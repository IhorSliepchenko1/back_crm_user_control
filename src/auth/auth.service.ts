import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Response } from 'express';
import * as argon2 from 'argon2';
import { RegisterDto } from './dto/register.dto';
import { ApiResponse } from 'src/common/interfaces';
import { LoginDto } from './dto/login.dto';
import { TokenService } from 'src/token/token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async register(res: Response, dto: RegisterDto): Promise<ApiResponse> {
    const { login, password } = dto;

    if (!login || !password) {
      throw new ConflictException('Данные обязательны');
    }

    const defaultRole = await this.prismaService.role.findUnique({
      where: {
        name: 'USER',
      },
    });

    if (!defaultRole) {
      throw new ConflictException('Данные о роли не обнаружены');
    }

    const isUser = await this.prismaService.user.findUnique({
      where: { login },
    });

    if (isUser) {
      throw new ConflictException('Пользователь уже зарегистирован');
    }

    const hashPassword = await argon2.hash(password);

    const user = await this.prismaService.user.create({
      data: {
        login,
        password: hashPassword,
        roles: {
          connect: {
            name: defaultRole?.name,
          },
        },
      },

      select: {
        id: true,
        login: true,
        roles: true,
      },
    });

    const roles = user.roles.map((n) => n.name);
    return this.tokenService.auth(res, user.id, user.login, roles);
  }

  async validate(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },

      select: {
        id: true,
        roles: true,
        login: true,
      },
    });

    if (!user) throw new NotFoundException('Пользователь не найден');

    const roles = user.roles.map((n) => n.name);

    return { ...user, roles };
  }

  async login(res: Response, dto: LoginDto): Promise<ApiResponse> {
    const { login, password } = dto;
    if (!login || !password) {
      throw new ConflictException('Данные обязательны');
    }

    const user = await this.prismaService.user.findUnique({
      where: {
        login,
      },

      select: {
        id: true,
        password: true,
        login: true,
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
    const roles = user.roles.map((n) => n.name);
    return this.tokenService.auth(res, user.id, user.login, roles);
  }
}
