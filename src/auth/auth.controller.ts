import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response, Request } from 'express';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from './decorators/user.decorator';
import { TokenService } from 'src/token/token.service';
import { AuthRoles } from './decorators/auth-roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async registerUser(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: RegisterDto,
  ) {
    return await this.authService.register(res, dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: LoginDto,
  ) {
    return await this.authService.login(res, dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    return await this.tokenService.logout(res);
  }

  @AuthRoles('USER')
  @Get('me')
  async findOne(@User() user: { id: string; roles: string[]; login: string }) {
    return user;
  }

  @AuthRoles()
  @Post('refresh')
  async refreshTokens(req: Request, res: Response) {
    return await this.authService.refresh(req, res);
  }
}
