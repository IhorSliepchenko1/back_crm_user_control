import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { UploadsModule } from 'src/uploads/uploads.module';
import { NotificationModule } from 'src/notification/notification.module';
import { UsersModule } from 'src/users/users.module';
import { ProjectsModule } from 'src/project/projects.module';

@Module({
  imports: [UploadsModule, NotificationModule, UsersModule, ProjectsModule],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
