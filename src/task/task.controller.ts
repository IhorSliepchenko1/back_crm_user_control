import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFiles,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UseUploadFiles } from 'src/uploads/decorators/upload-file.decorator';
import type { Request } from 'express';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { SendNotificationMessageDto } from '../notification/dto/send-notification-message.dto';
import { UpdateTaskCreatorDto } from './dto/update-task-creator.dto';
import { UpdateTaskExecutorDto } from './dto/update-task-executor.dto';
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

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @ApiOperation({
    summary: 'Создание задачи',
  })
  @ApiOkResponse({
    description: 'Новая задача добавлена',
    schema: {
      example: { success: true, message: 'Новая задача добавлена' },
    },
  })
  @ApiNotFoundResponse({
    description: 'Проект не обнаружен',
  })
  @ApiBadRequestResponse({
    description: 'Вы передали участника не имеющего доступ к данному проекту',
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @Auth()
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @UseUploadFiles()
  createTask(
    @Body() dto: CreateTaskDto,
    @Query('projectId') projectId: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.taskService.createTask(dto, projectId, files);
  }

  @ApiOperation({
    summary: 'Редактирование задачи (от лица создателя задачи)',
  })
  @ApiOkResponse({
    description: 'Задача обновлена',
    schema: {
      example: { success: true, message: 'Задача обновлена' },
    },
  })
  @ApiNotFoundResponse({
    description: ['Пользователь не обнаружен', 'Задача не обнаружена'].join(
      '\n\n',
    ),
  })
  @ApiForbiddenResponse({
    description: 'У вас нет прав доступа к данной задачу',
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @Auth()
  @Put('update-creator/:id')
  @HttpCode(HttpStatus.OK)
  @UseUploadFiles()
  updateTaskCreator(
    @Body() dto: UpdateTaskCreatorDto,
    @Param('id') id: string,
    @Req() req: Request,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.taskService.updateTaskCreator(dto, id, req, files);
  }

  @ApiOperation({
    summary: 'Редактирование задачи (от лица исполнителя)',
  })
  @ApiOkResponse({
    description: 'Задача обновлена',
    schema: {
      example: { success: true, message: 'Задача обновлена' },
    },
  })
  @ApiNotFoundResponse({
    description: ['Пользователь не обнаружен', 'Задача не обнаружена'].join(
      '\n\n',
    ),
  })
  @ApiForbiddenResponse({
    description: 'У вас нет прав доступа к данной задачу',
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @Auth()
  @Put('update-executor/:id')
  @HttpCode(HttpStatus.OK)
  @UseUploadFiles()
  updateTaskExecutor(
    @Body() dto: UpdateTaskExecutorDto,
    @Param('id') id: string,
    @Req() req: Request,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.taskService.updateTaskExecutor(dto, id, req, files);
  }

  @ApiOperation({
    summary: 'Отправка уведомления для проверки задачи',
  })
  @ApiOkResponse({
    description: 'Задача выслана на проверку',
    schema: {
      example: { success: true, message: 'Задача выслана на проверку' },
    },
  })
  @ApiNotFoundResponse({
    description: ['Пользователь не обнаружен', 'Задача не обнаружена'].join(
      '\n\n',
    ),
  })
  @ApiForbiddenResponse({
    description: 'У вас нет прав доступа к данной задачу',
  })
  @ApiConflictResponse({
    description: 'Задача на стадии проверки, повторная отправка отклонена!',
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @Auth()
  @Patch('send-review/:id')
  @HttpCode(HttpStatus.OK)
  sendReviewTask(
    @Body() dto: SendNotificationMessageDto,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.taskService.sendReviewTask(dto, id, req);
  }

  @ApiOperation({
    summary: 'Отправка уведомления от создателя задачи',
  })
  @ApiOkResponse({
    description: 'Ответ по проверке задачи отравлен',
    schema: {
      example: { success: true, message: 'Ответ по проверке задачи отравлен' },
    },
  })
  @ApiNotFoundResponse({
    description: ['Пользователь не обнаружен', 'Задача не обнаружена'].join(
      '\n\n',
    ),
  })
  @ApiForbiddenResponse({
    description: 'У вас нет прав администрирования к данной задаче',
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @Auth()
  @Patch('task-verification/:id')
  @HttpCode(HttpStatus.OK)
  taskVerification(
    @Body() dto: SendNotificationMessageDto,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.taskService.taskVerification(dto, id, req);
  }
}
