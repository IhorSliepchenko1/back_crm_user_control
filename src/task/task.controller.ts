import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFiles,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UseUploadFiles } from 'src/uploads/decorators/upload-file.decorator';

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

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
}
