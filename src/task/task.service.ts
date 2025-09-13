import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { buildResponse } from 'src/common/utils/build-response';
import { UploadsService } from 'src/uploads/uploads.service';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskData } from './interfaces';
import { JwtPayload } from 'src/token/interfaces/jwt-payload.interface';
import type { Request } from 'express';
import { SendNotificationMessageDto } from './dto/send-notification-message.dto';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class TaskService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly uploadsService: UploadsService,
    private readonly notificationService: NotificationService,
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

  async updateTask(dto: UpdateTaskDto, id: string, req: Request) {
    const { id: creatorId } = req.user as JwtPayload;

    const task = await this.prismaService.task.findUnique({
      where: { id },

      select: {
        id: true,
        executors: {
          select: {
            id: true,
          },
        },

        taskDescription: true,
        executorDescription: true,
        deadline: true,
        name: true,
        project: {
          select: {
            creatorId: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Задача не обнаружена');
    }

    if (creatorId !== task.project.creatorId) {
      throw new ForbiddenException('У вас нет прав доступа к данной задачу');
    }

    const {
      name,
      deadline,
      taskDescription,
      executorDescription,
      executorsAdd,
      executorsRemove,
    } = dto;

    const updateData: Partial<UpdateTaskData> = {};
    const currentName = task.name;
    const currentTaskDescription = task.taskDescription;
    const currentExecutorDescription = task.executorDescription;
    const currentDeadline = new Date(task.deadline);
    const currentExecutors = task.executors.map((e) => e.id);

    if (name && name !== currentName) {
      updateData.name = currentName;
    }

    if (taskDescription && taskDescription !== currentTaskDescription) {
      updateData.taskDescription = taskDescription;
    }

    if (
      executorDescription &&
      executorDescription !== currentExecutorDescription
    ) {
      updateData.executorDescription = executorDescription;
    }

    if (deadline) {
      const newDeadline = new Date(deadline);

      if (newDeadline !== currentDeadline) {
        updateData.deadline = deadline;
      }
    }

    if (executorsAdd) {
      const newExecutors = executorsAdd.filter(
        (id) => !currentExecutors.includes(id),
      );

      if (newExecutors.length > 0) {
        await this.prismaService.task.update({
          where: { id },

          data: {
            executors: {
              connect: newExecutors.map((id) => ({ id })),
            },
          },
        });
      }
    }

    if (executorsRemove && !executorsAdd) {
      const newExecutorsRemove = executorsRemove.filter((id) =>
        currentExecutors.includes(id),
      );

      if (newExecutorsRemove.length > 0) {
        await this.prismaService.task.update({
          where: { id },

          data: {
            executors: {
              disconnect: newExecutorsRemove.map((id) => ({ id })),
            },
          },
        });
      }
    }

    await this.prismaService.task.update({
      where: { id },
      data: { ...updateData },
    });

    return buildResponse('Задача обновлена');
  }

  async sendReviewTask(
    dto: SendNotificationMessageDto,
    id: string,
    req: Request,
  ) {
    const { id: senderId } = req.user as JwtPayload;

    const task = await this.prismaService.task.findUnique({
      where: { id },

      select: {
        id: true,
        executors: {
          select: {
            id: true,
          },
        },

        status: true,
        project: {
          select: {
            creatorId: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Задача не обнаружена');
    }

    const recipients = task.executors.map((e) => e.id);
    const isExecutor = recipients.includes(id);

    if (!isExecutor) {
      throw new ForbiddenException('У вас нет доступа к данной задаче');
    }

    if (task.status === 'IN_REVIEW') {
      throw new ConflictException(
        'Задача на стадии проверки, повторная отправка отклонена!',
      );
    }

    await this.prismaService.task.update({
      where: { id },
      data: {
        status: 'IN_REVIEW',
      },
    });

    await this.notificationService.sendNotification(
      task.id,
      senderId,
      recipients,
      dto.message,
    );

    return buildResponse('Задача выслана на проверку');
  }

  async taskVerification(
    dto: SendNotificationMessageDto,
    id: string,
    req: Request,
  ) {
    const { id: creatorId } = req.user as JwtPayload;

    const task = await this.prismaService.task.findUnique({
      where: { id },

      select: {
        id: true,
        executors: {
          select: {
            id: true,
          },
        },

        status: true,
        project: {
          select: {
            creatorId: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Задача не обнаружена');
    }

    if (creatorId !== task.project.creatorId) {
      throw new ForbiddenException(
        'У вас нет прав администрирования к данной задаче',
      );
    }

    const recipients = task.executors.map((e) => e.id);

    await this.prismaService.task.update({
      where: { id },
      data: {
        status: dto.status,
      },
    });

    await this.notificationService.sendNotification(
      task.id,
      creatorId,
      recipients,
      dto.message,
    );

    return buildResponse('Ответ по проверке задачи отравлен');
  }
}
