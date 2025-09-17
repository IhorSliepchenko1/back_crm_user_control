import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response, Request } from 'express';
import parse from 'parse-duration';
import { ApiResponse } from 'src/common/interfaces';
import { JwtPayload } from 'src/token/interfaces/jwt-payload.interface';
import { Roles } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { buildResponse } from 'src/utils/build-response';
import { isDev } from 'src/utils/is-dev.utils';

@Injectable()
export class TokenService {
  private readonly JWT_REFRESH_TOKEN_TTL_SHORT: string;
  private readonly JWT_REFRESH_TOKEN_TTL_LONG: string;
  private readonly COOKIE_DOMAIN: string;
  private readonly JWT_SECRET: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
  ) {
    this.JWT_REFRESH_TOKEN_TTL_SHORT = configService.getOrThrow<string>(
      'JWT_REFRESH_TOKEN_TTL_SHORT',
    );
    this.JWT_REFRESH_TOKEN_TTL_LONG = configService.getOrThrow<string>(
      'JWT_REFRESH_TOKEN_TTL_LONG',
    );
    this.COOKIE_DOMAIN = configService.getOrThrow<string>('COOKIE_DOMAIN');
    this.JWT_SECRET = configService.getOrThrow<string>('JWT_SECRET');
  }

  async auth(
    res: Response,
    payload: JwtPayload,
    remember: boolean = false,
  ): Promise<ApiResponse> {
    const { id, roles } = payload;

    await this.deactivateTokens(id);

    const ttl = remember
      ? this.JWT_REFRESH_TOKEN_TTL_SHORT
      : this.JWT_REFRESH_TOKEN_TTL_LONG;

    const { refreshToken } = this.generateTokens(id, roles, ttl);

    this.setRefreshTokenCookie(res, refreshToken, ttl);

    await this.prismaService.refreshToken.create({
      data: {
        userId: id,
        tokenHash: refreshToken,
        revoked: false,
      },
    });

    return buildResponse('Токен обновлён');
  }

  private signToken(payload: JwtPayload, ttl: string) {
    return this.jwtService.sign(payload, {
      expiresIn: ttl,
      secret: this.JWT_SECRET,
    });
  }

  private generateTokens(id: string, roles: Roles[], ttl: string) {
    const payload: JwtPayload = { id, roles };
    const refreshToken = this.signToken(payload, ttl);

    return { refreshToken };
  }

  private setRefreshTokenCookie(res: Response, value: string, ttl: string | 0) {
    const maxAge = typeof ttl === 'string' ? (parse(ttl) as number) : 0;

    return res.cookie('refreshToken', value, {
      httpOnly: true,
      domain: this.COOKIE_DOMAIN,
      secure: !isDev(this.configService),
      sameSite: 'lax',
      maxAge,
    });
  }

  async logout(res: Response, req: Request): Promise<ApiResponse> {
    const refreshToken = req.cookies['refreshToken'];
    const payload: JwtPayload = await this.jwtService.verifyAsync(refreshToken);

    this.setRefreshTokenCookie(res, '', 0);
    await this.deactivateTokens(payload.id);

    return buildResponse('Выполнен выход из системы');
  }

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

    if (!findLiveTokens) {
      throw new NotFoundException(
        'Данный пользователь не имеет активных токенов',
      );
    }

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

    return buildResponse('Выполнен выход из системы');
  }
}
