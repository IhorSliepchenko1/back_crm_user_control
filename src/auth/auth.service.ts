import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Response, Request } from 'express';
import * as argon2 from 'argon2';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenService } from 'src/token/token.service';
import { JwtPayload } from 'src/token/interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
import { Roles } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    res: Response,
    dto: RegisterDto,
  ): Promise<ReturnType<typeof this.tokenService.auth>> {
    const { login, password } = dto;

    if (!login || !password) {
      throw new ConflictException('Данные обязательны');
    }

    const defaultRole = await this.prismaService.role.findUnique({
      where: {
        name: this.configService.getOrThrow<Roles>('USER'),
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

  async login(
    res: Response,
    dto: LoginDto,
  ): Promise<ReturnType<typeof this.tokenService.auth>> {
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

  async validate(id: string): Promise<JwtPayload> {
    const userInfo = await this.prismaService.user.findUnique({
      where: { id },

      select: {
        id: true,
        roles: true,
        login: true,
      },
    });

    if (!userInfo) throw new NotFoundException('Пользователь не найден');

    const roles = userInfo.roles.map((n) => n.name);
    const user = { ...userInfo, roles };

    return user;
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies['refreshToken'];
    if (!refreshToken) throw new UnauthorizedException('Нет refresh токена');

    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const user = await this.validate(payload.id);
      return this.tokenService.auth(res, user.id, user.login, user.roles);
    } catch {
      throw new UnauthorizedException('Refresh токен невалиден или протух');
    }
  }
}
