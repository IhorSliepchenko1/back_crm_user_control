import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
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
import { TaskStatus } from '@prisma/client';

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Auth()
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @UseUploadFiles(5, 5, 'tasks')
  createTask(
    @Body() dto: CreateTaskDto,
    @Query('projectId') projectId: string,
    @Req() req: Request,
    @UploadedFiles() files?: Array<Express.Multer.File>,
  ) {
    return this.taskService.createTask(dto, projectId, req, files);
  }

  @Auth()
  @Put('update-creator/:id')
  @HttpCode(HttpStatus.OK)
  @UseUploadFiles(5, 5, 'tasks')
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
  @UseUploadFiles(5, 5, 'tasks')
  updateTaskExecutor(
    @Body() dto: UpdateTaskExecutorDto,
    @Param('id') id: string,
    @Req() req: Request,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.taskService.updateTaskExecutor(dto, id, req, files);
  }

  @Auth()
  @Get('task-by-project')
  @HttpCode(HttpStatus.OK)
  taskByProjectId(
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('status') status: TaskStatus,
    @Query('deadlineFrom') deadlineFrom: string,
    @Query('deadlineTo') deadlineTo: string,
    @Query('projectId') projectId: string,
    @Req() req: Request,
  ) {
    const dto = { page, limit, status, deadlineFrom, deadlineTo, projectId };
    return this.taskService.taskByProjectId(dto, req);
  }

  @Auth()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  taskById(@Param('id') id: string, @Req() req: Request) {
    return this.taskService.taskById(id, req);
  }

  @Auth()
  @Delete('file-delete')
  @HttpCode(HttpStatus.OK)
  deleteFileTask(
    @Query('taskId') taskId: string,
    @Query('fileId') fileId: string,
    @Req() req: Request,
  ) {
    return this.taskService.deleteFileTask(taskId, fileId, req);
  }

  @Auth()
  @Patch('change-status')
  @HttpCode(HttpStatus.OK)
  changeStatus(
    @Query('taskId') taskId: string,
    @Query('status') status: TaskStatus,
    @Req() req: Request,
  ) {
    return this.taskService.changeStatus(taskId, status, req);
  }
}
