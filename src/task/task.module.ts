import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { UploadsModule } from 'src/uploads/uploads.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [UploadsModule, NotificationModule],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
