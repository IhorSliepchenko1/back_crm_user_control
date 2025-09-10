import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { FileUploadModule } from 'src/file-upload/file-upload.module';

@Module({
  imports: [FileUploadModule],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
