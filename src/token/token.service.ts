import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response, Request } from 'express';
import parse from 'parse-duration';
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

  async auth(res: Response, payload: JwtPayload, remember: boolean) {
    const { id, roles, avatarPath, login } = payload;

    await this.deactivateTokens(id);

    const ttl = remember
      ? this.JWT_REFRESH_TOKEN_TTL_LONG
      : this.JWT_REFRESH_TOKEN_TTL_SHORT;

    const { refreshToken } = this.generateTokens(
      id,
      roles,
      avatarPath,
      login,
      ttl,
    );

    this.setRefreshTokenCookie(res, refreshToken, ttl);

    await this.prismaService.refreshToken.create({
      data: {
        userId: id,
        tokenHash: refreshToken,
        revoked: false,
      },
    });

    return buildResponse('Вы вошли в систему');
  }
  private signToken(payload: JwtPayload, ttl: string) {
    return this.jwtService.sign(payload, {
      expiresIn: ttl,
      secret: this.JWT_SECRET,
    });
  }
  private generateTokens(
    id: string,
    roles: Roles[],
    avatarPath: string | null,
    login: string,
    ttl: string,
  ) {
    const payload: JwtPayload = { id, roles, avatarPath, login };
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
  async logout(res: Response, req: Request, redirect?: boolean) {
    const refreshToken = req.cookies['refreshToken'];
    const payload: JwtPayload = await this.jwtService.verifyAsync(refreshToken);
    await this.deactivateTokens(payload.id);
    this.setRefreshTokenCookie(res, '', 0);

    if (redirect) {
      throw new UnauthorizedException('Вы вышли из системы');
    }

    return buildResponse('Выполнен выход из системы');
  }

  async logoutById(id: string) {
    const currentTokens = await this.findAliveTokens(id);
    if (!currentTokens.length) {
      throw new NotFoundException(
        'Данный пользователь не имеет активных сессий',
      );
    }

    await this.deactivateTokens(id);
    return buildResponse('Выполнен выход из системы');
  }

  private async findAliveTokens(userId: string) {
    const tokens = await this.prismaService.refreshToken.findMany({
      where: {
        userId,
        revoked: false,
      },

      select: {
        id: true,
      },
    });

    return tokens;
  }

  async deactivateTokens(id: string) {
    const findLiveTokens = await this.findAliveTokens(id);

    if (!findLiveTokens) {
      throw new NotFoundException(
        'Данный пользователь не имеет активных сессий',
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

    return true;
  }

  async validateToken(req: Request, res: Response) {
    const tokenHash = req.cookies['refreshToken'] as string;

    const findToken = await this.prismaService.refreshToken.findUnique({
      where: {
        tokenHash,
      },
    });

    if (findToken) {
      const { revoked } = findToken;
      if (revoked) {
        this.setRefreshTokenCookie(res, '', 0);
        throw new UnauthorizedException('Сессия просрочена, войдите снова');
      }
    }
  }
}
