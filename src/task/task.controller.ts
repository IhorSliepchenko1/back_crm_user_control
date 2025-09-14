import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UploadedFiles,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UseUploadFiles } from 'src/uploads/decorators/upload-file.decorator';
import { UpdateTaskDto } from './dto/update-task.dto';
import type { Request } from 'express';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { SendNotificationMessageDto } from '../notification/dto/send-notification-message.dto';

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Auth()
  @Post(':id')
  @HttpCode(HttpStatus.CREATED)
  @UseUploadFiles()
  createTask(
    @Body() dto: CreateTaskDto,
    @Param('id') id: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.taskService.createTask(dto, id, files);
  }

  @Auth()
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  updateTask(
    @Body() dto: UpdateTaskDto,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.taskService.updateTask(dto, id, req);
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
