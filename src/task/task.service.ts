import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { buildResponse } from 'src/common/utils/build-response';
import { UploadsService } from 'src/uploads/uploads.service';
import { FileName } from '@prisma/client';

@Injectable()
export class TaskService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  async createTask(
    dto: CreateTaskDto,
    id: string,
    files: Array<Express.Multer.File>,
  ) {
    const project = await this.prismaService.project.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        participants: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Проект не обнаружен');
    }

    const filePathTask: string[] = [];

    const { name, deadline, taskDescription, executors } = dto;
    const participants = project.participants.map((p) => p.id);
    const isAccess = executors.some((id) => !participants.includes(id));

    if (isAccess) {
      throw new ConflictException(
        'Вы передали участника не имеющего доступ к данному проекту',
      );
    }

    const task = await this.prismaService.task.create({
      data: {
        name,
        deadline,
        taskDescription,
        projectId: id,

        executors: {
          connect: executors.map((id) => ({ id })),
        },
      },
    });

    if (files) {
      filePathTask.push(...this.uploadsService.seveFiles(files));

      await this.prismaService.$transaction(
        filePathTask.map((fileName) =>
          this.prismaService.files.create({
            data: {
              fileName,
              type: 'filePathTask',
              taskId: task.id,
            },
          }),
        ),
      );
    }

    return buildResponse('Новая задача добавлена');
  }
}
