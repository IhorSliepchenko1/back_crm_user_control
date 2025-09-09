import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TaskService {
  constructor(private readonly prismaService: PrismaService) {}

  async craetTask(dto: CreateTaskDto, projectId: string, executorId: string) {
    const newTask = await this.prismaService.task.create({
      data: {
        ...dto,
        projectId,
        executorId,
      },
    });
  }
}
