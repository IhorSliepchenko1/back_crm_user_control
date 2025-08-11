import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { Request, Response } from 'express';
import parse from 'parse-duration';
import * as argon2 from 'argon2';
import { RegisterDto } from './dto/register.dto';
import { ApiResponse } from 'src/common/interfaces';
import { isDev } from 'src/common/utils/is-dev.utils';
import { buildResponse } from 'src/common/build-response';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly JWT_ACCESS_TOKEN_TTL: string;
  private readonly JWT_REFRESH_TOKEN_TTL: string;
  private readonly JWT_REFRESH_TOKEN_TTL_MS: number;
  private readonly JWT_ACCESS_TOKEN_TTL_MS: number;
  private readonly COOKIE_DOMAIN: string;
  private readonly JWT_SECRET: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
  ) {
    this.JWT_ACCESS_TOKEN_TTL = configService.getOrThrow<string>(
      'JWT_ACCESS_TOKEN_TTL',
    );
    this.JWT_REFRESH_TOKEN_TTL = configService.getOrThrow<string>(
      'JWT_REFRESH_TOKEN_TTL',
    );
    this.JWT_REFRESH_TOKEN_TTL_MS = parse(this.JWT_REFRESH_TOKEN_TTL) as number;
    this.JWT_ACCESS_TOKEN_TTL_MS = parse(this.JWT_ACCESS_TOKEN_TTL) as number;
    this.COOKIE_DOMAIN = configService.getOrThrow<string>('COOKIE_DOMAIN');
    this.JWT_SECRET = configService.getOrThrow<string>('JWT_SECRET');
  }

  async register(res: Response, dto: RegisterDto): Promise<ApiResponse> {
    const { login, password } = dto;

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
        role: 'USER',
      },

      select: {
        id: true,
        role: true,
        password: true,
      },
    });

    return this.auth(res, user.id, user.role);
  }

  async login(res: Response, dto: LoginDto): Promise<ApiResponse> {
    const { login, password } = dto;
    const user = await this.prismaService.user.findUnique({
      where: {
        login,
      },

      select: {
        id: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Не верный логин или пароль');
    }

    const verifyPassword = await argon2.verify(user.password, password);

    if (!verifyPassword) {
      throw new UnauthorizedException('Не верный логин или пароль');
    }

    return this.auth(res, user.id, user.role);
  }

  private auth(
    res: Response,
    id: string,
    role: string,
    updateRefresh: boolean = true,
  ): ApiResponse {
    const { accessToken, refreshToken } = this.generateTokens(id, role);

    if (updateRefresh) {
      this.setTokenCookie(
        res,
        'refreshToken',
        refreshToken,
        new Date(Date.now() + this.JWT_REFRESH_TOKEN_TTL_MS),
      );
    }

    this.setTokenCookie(
      res,
      'accessToken',
      accessToken,
      new Date(Date.now() + this.JWT_ACCESS_TOKEN_TTL_MS),
    );
    return buildResponse('Вход разрешён');
  }

  async validate(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },

      select: {
        id: true,
        role: true,
      },
    });

    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  private generateTokens(
    id: string,
    role: string,
  ): {
    accessToken: string;
    refreshToken: string;
  } {
    const payload: JwtPayload = { id, role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.JWT_ACCESS_TOKEN_TTL,
      secret: this.JWT_SECRET,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.JWT_REFRESH_TOKEN_TTL,
      secret: this.JWT_SECRET,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private setTokenCookie(
    res: Response,
    tokenName: 'refreshToken' | 'accessToken',
    value: string,
    expires: Date,
  ) {
    return res.cookie(tokenName, value, {
      expires,
      httpOnly: true,
      domain: this.COOKIE_DOMAIN,
      secure: isDev(this.configService),
      sameSite: 'none',
    });
  }
}
