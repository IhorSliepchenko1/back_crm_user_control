import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response, Request } from 'express';
import parse from 'parse-duration';
import { ApiResponse } from 'src/common/interfaces';
import { isDev } from 'src/common/utils/is-dev.utils';
import { buildResponse } from 'src/common/build-response';
import { JwtPayload } from 'src/token/interfaces/jwt-payload.interface';
import { Tokens } from 'src/token/interfaces/token.interfaces';
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
    id: string,
    login: string,
    roles: Roles[],
  ): { accessToken: string; refreshToken: string } {
    const { accessToken, refreshToken } = this.generateTokens(id, login, roles);

    this.setTokenCookie(
      res,
      'refreshToken',
      refreshToken,
      this.JWT_REFRESH_TOKEN_TTL,
    );

    this.setTokenCookie(
      res,
      'accessToken',
      accessToken,
      this.JWT_ACCESS_TOKEN_TTL,
    );
    return { accessToken, refreshToken };
  }

  private signToken(payload: JwtPayload, ttl: string) {
    return this.jwtService.sign(payload, {
      expiresIn: ttl,
      secret: this.JWT_SECRET,
    });
  }

  private generateTokens(id: string, login: string, roles: Roles[]): Tokens {
    const payload: JwtPayload = { id, roles, login };

    const accessToken = this.signToken(payload, this.JWT_ACCESS_TOKEN_TTL);
    const refreshToken = this.signToken(payload, this.JWT_REFRESH_TOKEN_TTL);

    return {
      accessToken,
      refreshToken,
    };
  }

  private setTokenCookie(
    res: Response,
    tokenName: 'refreshToken' | 'accessToken',
    value: string,
    ttl: string | 0,
  ) {
    const maxAge = typeof ttl === 'string' ? (parse(ttl) as number) : 0;

    return res.cookie(tokenName, value, {
      httpOnly: true,
      domain: this.COOKIE_DOMAIN,
      secure: !isDev(this.configService),
      sameSite: 'lax',
      maxAge,
    });
  }

  async logout(res: Response): Promise<ApiResponse> {
    this.setTokenCookie(res, 'refreshToken', '', 0);
    this.setTokenCookie(res, 'accessToken', '', 0);
    return buildResponse('Выполнен выход из системы');
  }
}
