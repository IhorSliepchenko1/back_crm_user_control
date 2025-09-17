import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
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
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @ApiOperation({
    summary: 'Создание аккаунта',
    description:
      'Создание нового аккаунта (доступ к созданию только у роли - ADMIN)',
  })
  @ApiOkResponse({
    description: 'Новый пользователь добавлен',
    schema: {
      example: { success: true, message: 'Новый пользователь добавлен' },
    },
  })
  @ApiBadRequestResponse({
    description: 'Отсутствует логин или пароль',
  })
  @ApiConflictResponse({
    description: 'Пользователь уже зарегистирован',
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @ApiForbiddenResponse({
    description: 'У вас недостаточно прав доступа',
  })
  @AuthRoles('ADMIN')
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async registerUser(@Body() dto: RegisterDto) {
    return await this.authService.register(dto);
  }

  @ApiCookieAuth()
  @ApiOperation({
    description:
      'Вход в систему, запись токена в cookies +добавление токена в БД',
    summary: 'Вход в систему',
  })
  @ApiOkResponse({
    description: 'Токен обновлён',
    schema: {
      example: { success: true, message: 'Токен обновлён' },
    },
  })
  @ApiBadRequestResponse({
    description: 'Отсутствует логин или пароль',
  })
  @ApiConflictResponse({
    description: 'Пользователь уже зарегистирован',
  })
  @ApiUnauthorizedResponse({
    description: 'Не верный логин или пароль',
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: LoginDto,
  ) {
    return await this.authService.login(res, dto);
  }

  @ApiOperation({
    summary: 'Выход из системы',
    description:
      'Удаление токена или cookies и деактивация токена записанного в БД',
  })
  @ApiOkResponse({
    description: 'Выполнен выход из системы',
    schema: {
      example: { success: true, message: 'Выполнен выход из системы' },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @Auth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
    return await this.tokenService.logout(res, req);
  }

  @ApiOperation({
    summary: 'Данные о текущем пользователе',
    description: 'Получение данных пользователя для проверки авторизации',
  })
  @ApiOkResponse({
    description: 'Массив ролей',
    schema: {
      example: ['USER'],
    },
  })
  @ApiConflictResponse({
    description: 'Сервер не смог распознать данные для верификации',
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @Auth()
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async findOne(@User() user: JwtPayload) {
    return user.roles;
  }

  @ApiOperation({
    summary: 'Обновление токена',
    description: 'Вызов принудительного обновления токена',
  })
  @ApiOkResponse({
    description: 'Токен обновлён',
    schema: {
      example: { success: true, message: 'Токен обновлён' },
    },
  })
  @ApiConflictResponse({
    description: 'Токен не активен',
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @ApiNotFoundResponse({
    description: 'Пользователь не найден',
  })
  @Auth()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return await this.authService.refresh(req, res);
  }
}
