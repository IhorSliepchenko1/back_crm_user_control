import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthRoles } from 'src/auth/decorators/auth-roles.decorator';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { RenameUserDto } from './dto/rename-user.dto';
import { ChangePassword } from './dto/change-password.dto';
import type { Request } from 'express';
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

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: 'Список пользователей',
    description: 'Список всех пользователей (доступ только у роли - ADMIN)',
  })
  @ApiOkResponse({
    description: 'Список пользователей',
    schema: {
      example: {
        success: true,
        message: 'Список пользователей',
        data: [
          {
            id: '8d41efaa-7ba5-40b8-bcd3-5fa451a6dd89',
            name: 'USER_1-1-1',
            status: false,
            created_at: '2025-09-17T12:10:41.498Z',
            creator_projects: 0,
            participant_projects: 0,
            count_tasks: 0,
            done_tasks: 0,
            in_reviews_tasks: 0,
            in_progress_tasks: 0,
          },
          {
            id: '6087b04b-92a5-465a-bc17-4a64f856db96',
            name: 'user_login_1',
            status: false,
            created_at: '2025-09-16T22:29:56.921Z',
            creator_projects: 0,
            participant_projects: 0,
            count_tasks: 0,
            done_tasks: 0,
            in_reviews_tasks: 0,
            in_progress_tasks: 0,
          },
        ],
        total: 57,
        count_pages: 29,
        page: 1,
        limit: 2,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @ApiForbiddenResponse({
    description: 'У вас недостаточно прав доступа',
  })
  @AuthRoles('ADMIN')
  @Get('')
  @HttpCode(HttpStatus.OK)
  async users(
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return await this.usersService.users({ page, limit });
  }

  @ApiOperation({
    summary: 'Получение информации о пользователе по ID',
    description: 'Информация о пользовтеле (доступ только у роли - ADMIN)',
  })
  @ApiOkResponse({
    description: 'Информация о пользователе',
    schema: {
      example: {
        success: true,
        message: 'Информация о пользователе',
        data: {
          id: '2fe237c4-a74e-42c6-a928-8cd518a0b773',
          name: 'ADMINISTRATOR_1-1',
          is_blocked: false,
          created_at: '17.09.2025',
          creator_projects: 0,
          participant_projects: 0,
          count_tasks: 0,
          done_tasks: 0,
          in_reviews_tasks: 0,
          in_progress_tasks: 0,
          projects: [
            {
              id: 'b9e62b34-6437-4e7f-abb7-bdcf92513b5e',
              active: false,
              name: 'Колл-Центр-12',
              tasks: [
                {
                  id: '79126de7-5994-4b43-b0fa-b380f90595a4',
                  name: 'тЕСТОВАЯ ЗАДdfdfddfdfgfdffАЧА',
                  status: 'IN_REVIEW',
                  deadline: '2025-09-16T00:00:00.000Z',
                  taskDescription: 'Описание для задачи',
                  projectId: 'b9e62b34-6437-4e7f-abb7-bdcf92513b5e',
                  executorDescription: null,
                  createdAt: '2025-09-15T23:15:19.963Z',
                  updatedAt: '2025-09-15T23:37:51.414Z',
                },
                {
                  id: '33a1fde8-68d1-4092-b9d6-1bed2731bec1',
                  name: 'Test_test_1222dffdfdfd2ddd',
                  status: 'DONE',
                  deadline: '2025-12-12T23:59:00.011Z',
                  taskDescription: 'Описанаие_14fdffddf222dffdfdf2',
                  projectId: 'b9e62b34-6437-4e7f-abb7-bdcf92513b5e',
                  executorDescription: null,
                  createdAt: '2025-09-14T10:39:48.481Z',
                  updatedAt: '2025-09-14T13:08:05.450Z',
                },
              ],
            },
          ],
          roles: ['USER', 'ADMIN'],
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @ApiForbiddenResponse({
    description: 'У вас недостаточно прав доступа',
  })
  @ApiNotFoundResponse({ description: 'Пользователь не найден' })
  @AuthRoles('ADMIN')
  @Get('user/:id')
  @HttpCode(HttpStatus.OK)
  async user(@Param('id') id: string) {
    return await this.usersService.user(id);
  }

  @ApiOperation({
    summary: 'Манипуляция со статусом пользователя',
    description:
      'Блокировать/разблокировать пользователя (доступ только у роли - ADMIN)',
  })
  @ApiOkResponse({
    description: 'Пользователь "login" заблокирован/разблокирован',
    schema: {
      example: {
        success: true,
        message: "Пользователь '12-09' заблокирован",
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @ApiForbiddenResponse({
    description: 'У вас недостаточно прав доступа',
  })
  @ApiNotFoundResponse({ description: 'Пользователь не найден' })
  @AuthRoles('ADMIN')
  @Patch('is-active/:id')
  @HttpCode(HttpStatus.OK)
  async isActive(@Param('id') id: string) {
    return await this.usersService.isActive(id);
  }

  @ApiOperation({
    summary: 'Редактировать имя пользователя',
  })
  @ApiOkResponse({
    description: 'Пользователь переименован',
    schema: {
      example: {
        success: true,
        message: 'Пользователь переименован',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @ApiForbiddenResponse({
    description: 'У вас нет прав редактировать другие аккаунты!',
  })
  @ApiNotFoundResponse({ description: 'Пользователь не найден' })
  @ApiConflictResponse({
    description: 'Логин уже используется другим пользователем',
  })
  @Auth()
  @Patch('rename/:id')
  @HttpCode(HttpStatus.OK)
  async renameUser(
    @Param('id') id: string,
    @Body() dto: RenameUserDto,
    @Req() req: Request,
  ) {
    return await this.usersService.renameUser(dto, id, req);
  }

  @ApiOperation({
    summary: 'Смена пароля',
  })
  @ApiOkResponse({
    description: 'Вы успешно сменили пароль',
    schema: {
      example: {
        success: true,
        message: 'Вы успешно сменили пароль',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @ApiForbiddenResponse({
    description: 'У вас нет прав редактировать другие аккаунты!',
  })
  @ApiNotFoundResponse({ description: 'Пользователь не найден' })
  @ApiBadRequestResponse({
    description: 'Значения не могут быть одинаковыми',
  })
  @ApiConflictResponse({
    description: 'Не верный пароль',
  })
  @Auth()
  @Patch('change-password/:id')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Param('id') id: string,
    @Body() dto: ChangePassword,
    @Req() req: Request,
  ) {
    return await this.usersService.changePassword(dto, id, req);
  }
}
