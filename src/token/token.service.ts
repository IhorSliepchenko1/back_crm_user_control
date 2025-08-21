import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response, Request } from 'express';
import parse from 'parse-duration';
import { ApiResponse } from 'src/common/interfaces';
import { isDev } from 'src/common/utils/is-dev.utils';
import { JwtPayload } from 'src/token/interfaces/jwt-payload.interface';
import { Roles } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { buildResponse } from 'src/common/utils/build-response';

@Injectable()
export class TokenService {
  private readonly JWT_ACCESS_TOKEN_TTL: string;
  private readonly JWT_REFRESH_TOKEN_TTL: string;
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
    this.COOKIE_DOMAIN = configService.getOrThrow<string>('COOKIE_DOMAIN');
    this.JWT_SECRET = configService.getOrThrow<string>('JWT_SECRET');
  }

  async auth(
    res: Response,
    payload: JwtPayload,
  ): Promise<ApiResponse<{ accessToken: string }>> {
    const { id, login, roles } = payload;

    await this.deactivateTokens(id);

    const { accessToken, refreshToken } = this.generateTokens(id, login, roles);

    this.setRefreshTokenCookie(res, refreshToken, this.JWT_REFRESH_TOKEN_TTL);

    await this.prismaService.refreshToken.create({
      data: {
        userId: id,
        expiresAt: this.convertTime(),
        tokenHash: refreshToken,
        revoked: false,
      },
    });

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

  async logout(res: Response, req: Request): Promise<ApiResponse> {
    const refreshToken = req.cookies['refreshToken'];

    if (!refreshToken)
      throw new UnauthorizedException(
        'Данные устарели, выполните вход в систему',
      );

    const payload: JwtPayload = await this.jwtService.verifyAsync(refreshToken);

    if (!payload) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }

    this.setRefreshTokenCookie(res, '', 0);
    await this.deactivateTokens(payload.id);

    return buildResponse('Выполнен выход из системы');
  }

  convertTime(): string {
    const maxAge = parse(this.JWT_REFRESH_TOKEN_TTL as string) as number;

    const now = new Date(Date.now() + maxAge);
    // "2025-08-21T09:42:35.439Z"
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
  }

  // по user_id
  async deactivateTokens(id: string) {
    const findLiveTokens = await this.prismaService.refreshToken.findMany({
      where: {
        userId: id,
        revoked: false,
      },

      select: {
        id: true,
      },
    });

    if (findLiveTokens && findLiveTokens.length >= 1) {
      const tokenIds = findLiveTokens.map((t) => t.id);

      await this.prismaService.refreshToken.updateMany({
        data: {
          revoked: true,
        },

        where: {
          id: {
            in: tokenIds,
          },
        },
      });
    }

    return true;
  }
}
