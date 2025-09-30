import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Redirect,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response, Request } from 'express';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from './decorators/user.decorator';
import { TokenService } from 'src/token/token.service';
import type { JwtPayload } from 'src/token/interfaces/jwt-payload.interface';
import { Auth } from './decorators/auth.decorator';
import { AuthRoles } from './decorators/auth-roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @AuthRoles('ADMIN')
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return await this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: LoginDto,
  ) {
    return await this.authService.login(res, dto);
  }

  @Auth()
  @Post('logout/me')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
    return await this.tokenService.logout(res, req);
  }

  @Auth()
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @User() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const { roles, avatarPath, login } = user;
    const { exp, now } = await this.authService.findSession(user.id);

    await this.tokenService.validateToken(req, res);

    if (exp < now) {
      return await this.tokenService.logout(res, req, true);
    }

    return { roles, avatarPath, name: login };
  }

  @AuthRoles('ADMIN')
  @Post('logout/:id')
  @HttpCode(HttpStatus.OK)
  async logoutById(@Param('id') id: string) {
    return await this.tokenService.logoutById(id);
  }

  // @Auth()
  // @Post('refresh')
  // @HttpCode(HttpStatus.OK)
  // async refreshTokens(
  //   @Req() req: Request,
  //   @Res({ passthrough: true }) res: Response,
  // ) {
  //   return await this.authService.refresh(req, res);
  // }
}
