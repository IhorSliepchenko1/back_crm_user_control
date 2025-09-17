import {
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
import { NotificationService } from './notification.service';
import type { Request } from 'express';
import { Auth } from 'src/auth/decorators/auth.decorator';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiOperation({
    summary: 'Список уведомлений',
    description: 'Получение списка уведомлений от других пользователей',
  })
  @ApiOkResponse({
    description: 'Токен обновлён',
    schema: {
      example: {
        success: true,
        message: 'Ваши уведомления',
        data: [
          {
            read_id: 'b05b26ed-0bc7-324c7-aebb-a6dfdf5397b',
            read_status: true,
            subject: 'Проверка задачи',
            message: 'Задача была выполнена, проверьте пожалуйста',
            sender_name: 'Имя отправителя 1',
            sender_id: 'b05b26ed-0bc7-41c7-aebb-a683b2b5397b',
            recipients: ['USER_1', 'ADMINISTRATOR_1'],
            task_name: 'Задача 1',
            task_id: '79126de7-5994-4b43-b0fa-b380f90595a4',
          },
          {
            read_id: 'b05b26ed-0bc7-324c7-aebb-a6dfdf5397b',
            read_status: false,
            subject: 'Проверка задачи 2',
            message: 'Задача была выполнена, проверьте пожалуйста',
            sender_name: 'Имя отправителя 1',
            sender_id: 'b05b26ed-0bc7-41c7-aebb-a683b2b5397b',
            recipients: ['USER_2', 'ADMINISTRATOR_2'],
            task_name: 'Задача 2',
            task_id: '79126de7-5994-4b43-b0fa-b380f90595a4',
          },
        ],
        total: 1,
        count_pages: 1,
        page: 1,
        limit: 10,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Пользователь не обнаружен',
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @Auth()
  @Get('all')
  @HttpCode(HttpStatus.OK)
  currentUserNotifications(
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Req() req: Request,
  ) {
    return this.notificationService.currentUserNotifications(
      { page, limit },
      req,
    );
  }

  @ApiOperation({
    summary: 'К-во не прочитанных уведомлений',
    description: 'Получение количества не прочитанных уведомлений',
  })
  @ApiOkResponse({
    description: 'Не прочитанные уведомления',
    schema: {
      example: {
        success: true,
        message: 'Не прочитанные уведомления',
        count: 10,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Пользователь не обнаружен',
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @Auth()
  @Get('count-no-read')
  @HttpCode(HttpStatus.OK)
  countNoReadNotifications(@Req() req: Request) {
    return this.notificationService.countNoReadNotifications(req);
  }

  @ApiOperation({
    summary: 'Прочитать уведомление',
    description: 'Изменение статуса уведомления',
  })
  @ApiOkResponse({
    description: 'Уведомление прочитано',
    schema: {
      example: {
        success: true,
        message: 'Уведомление прочитано',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Пользователь не обнаружен',
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @ApiForbiddenResponse({
    description:
      'Отказано в доступе, скорее всего вы ошибочно пытаетесь отредактировать чужое уведомление',
  })
  @ApiBadRequestResponse({
    description: 'Вы передали несуществующий id уведомления',
  })
  @Auth()
  @Patch('read/:id')
  @HttpCode(HttpStatus.OK)
  readNotification(@Param('id') id: string, @Req() req: Request) {
    return this.notificationService.readNotification(id, req);
  }
}
