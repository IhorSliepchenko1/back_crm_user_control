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

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

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
