import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import parse from 'parse-duration';
import { ApiResponse } from 'src/common/interfaces';
import { isDev } from 'src/common/utils/is-dev.utils';
import { buildResponse } from 'src/common/build-response';
import { JwtPayload } from 'src/token/interfaces/jwt-payload.interface';
import { Roles } from '@prisma/client';

@Injectable()
export class TokenService {
  private readonly JWT_ACCESS_TOKEN_TTL: string;
  private readonly JWT_REFRESH_TOKEN_TTL: string;
  private readonly COOKIE_DOMAIN: string;
  private readonly JWT_SECRET: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.JWT_ACCESS_TOKEN_TTL = configService.getOrThrow<string>(
      'JWT_ACCESS_TOKEN_TTL',
    );
    this.JWT_REFRESH_TOKEN_TTL = configService.getOrThrow<string>(
      'JWT_REFRESH_TOKEN_TTL',
    );
    this.COOKIE_DOMAIN = configService.getOrThrow<string>('COOKIE_DOMAIN');
    this.JWT_SECRET = configService.getOrThrow<string>('JWT_SECRET');
  }

  auth(
    res: Response,
    payload: JwtPayload,
  ): ApiResponse<{ accessToken: string }> {
    const { id, login, roles } = payload;
    const { accessToken, refreshToken } = this.generateTokens(id, login, roles);
    this.setRefreshTokenCookie(res, refreshToken, this.JWT_REFRESH_TOKEN_TTL);
    return buildResponse<{ accessToken: string }>(
      'Система выдала новый access-token, никому его не сообщайте',
      {
        accessToken,
      },
    );
  }

  private signToken(payload: JwtPayload, ttl: string) {
    return this.jwtService.sign(payload, {
      expiresIn: ttl,
      secret: this.JWT_SECRET,
    });
  }

  private generateTokens(id: string, login: string, roles: Roles[]) {
    const payload: JwtPayload = { id, roles, login };
    const accessToken = this.signToken(payload, this.JWT_ACCESS_TOKEN_TTL);
    const refreshToken = this.signToken(payload, this.JWT_REFRESH_TOKEN_TTL);

    return {
      accessToken,
      refreshToken,
    };
  }

  private setRefreshTokenCookie(res: Response, value: string, ttl: string | 0) {
    const maxAge = typeof ttl === 'string' ? (parse(ttl) as number) : 0;

    return res.cookie('refreshToken', value, {
      httpOnly: true,
      domain: this.COOKIE_DOMAIN,
      secure: !isDev(this.configService),
      sameSite: 'none',
      maxAge,
    });
  }

  async logout(res: Response): Promise<ApiResponse> {
    this.setRefreshTokenCookie(res, '', 0);
    return buildResponse('Выполнен выход из системы');
  }
}
