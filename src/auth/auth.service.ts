import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { Response, Request } from 'express';
import * as argon2 from 'argon2';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenService } from 'src/token/token.service';
import { JwtPayload } from 'src/token/interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
import { Roles } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ApiResponse } from 'src/common/interfaces';
import { buildResponse } from 'src/utils/build-response';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<ApiResponse> {
    const { login, password, adminCode } = dto;

    if (!login || !password) {
      throw new BadRequestException('Отсутствует логин или пароль');
    }

    const isUser = await this.prismaService.user.findUnique({
      where: { login },
    });

    if (isUser) {
      throw new ConflictException('Пользователь уже зарегистирован');
    }

    const hashPassword = await argon2.hash(password);
    const rolesUser: Roles[] = [];

    const isAdmin =
      adminCode && adminCode === this.configService.getOrThrow('ADMIN_CODE');

    if (isAdmin) {
      const allRoles = await this.prismaService.role.findMany({
        select: {
          name: true,
        },
      });

      allRoles.forEach((n) => (rolesUser as Roles[]).push(n.name));
    } else {
      rolesUser.push('USER');
    }

    await this.prismaService.user.create({
      data: {
        login,
        password: hashPassword,
        roles: {
          connect: rolesUser.map((name) => ({
            name,
          })),
        },
      },
    });

    return buildResponse('Новый пользователь добавлен');
  }
  async login(res: Response, dto: LoginDto): Promise<ApiResponse> {
    const { login, password, remember } = dto;

    if (!login || !password) {
      throw new BadRequestException('Отсутствует логин или пароль');
    }

    const user = await this.prismaService.user.findUnique({
      where: {
        login,
      },

      select: {
        id: true,
        password: true,
        roles: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Не верный логин или пароль');
    }

    const verifyPassword = await argon2.verify(user.password, password);

    if (!verifyPassword) {
      throw new UnauthorizedException('Не верный логин или пароль');
    }

    const checkSession = await this.prismaService.refreshToken.findMany({
      where: {
        userId: user.id,
        revoked: false,
      },
    });

    if (checkSession.length) {
      throw new ConflictException(
        'Ваша сессия активна, что бы выполнить вход заново выйдите из системы',
      );
    }

    const roles = user.roles.map((n) => n.name);
    const payload = { ...user, roles };

    return this.tokenService.auth(res, payload, remember);
  }
  async validate(id: string): Promise<JwtPayload> {
    const userInfo = await this.prismaService.user.findUnique({
      where: { id },

      select: {
        id: true,
        roles: true,
      },
    });

    if (!userInfo) throw new NotFoundException('Пользователь не найден');

    const checkAuth = await this.prismaService.refreshToken.findMany({
      where: {
        userId: id,
        revoked: false,
      },
    });

    if (checkAuth.length < 1) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }

    const roles = userInfo.roles.map((n) => n.name);
    const user = { ...userInfo, roles };

    return user;
  }
  async refresh(req: Request, res: Response): Promise<ApiResponse> {
    const refreshToken = req.cookies['refreshToken'];
    const payload: JwtPayload = await this.jwtService.verifyAsync(refreshToken);

    const isRevoked = await this.prismaService.refreshToken.findUnique({
      where: {
        tokenHash: refreshToken,
      },
    });

    if (!isRevoked || isRevoked.revoked)
      throw new ConflictException('Токен не активен');

    const userInfo = await this.prismaService.user.findUnique({
      where: {
        id: payload.id,
      },

      select: {
        id: true,
        roles: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!userInfo) {
      throw new NotFoundException('Пользователь не найден');
    }
    const user = await this.validate(userInfo.id);

    this.tokenService.deactivateTokens(userInfo.id);
    return this.tokenService.auth(res, user);
  }
}
