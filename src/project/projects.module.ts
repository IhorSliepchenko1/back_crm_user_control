import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService],
  imports: [UsersModule],
})
export class ProjectsModule {}
