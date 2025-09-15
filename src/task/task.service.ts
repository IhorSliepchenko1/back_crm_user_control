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
import { UpdateTaskData } from './interfaces';
import { JwtPayload } from 'src/token/interfaces/jwt-payload.interface';
import type { Request } from 'express';
import { SendNotificationMessageDto } from '../notification/dto/send-notification-message.dto';
// import { NotificationService } from 'src/notification/notification.service';
import { UpdateTaskCreatorDto } from './dto/update-task-creator.dto';
import { UpdateTaskExecutorDto } from './dto/update-task-executor.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class TaskService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly uploadsService: UploadsService,
    // private readonly notificationService: NotificationService,
    private eventEmitter: EventEmitter2,
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
      const filePathTask = this.uploadsService.seveFiles(files);
      await this.saveFiles(filePathTask, task.id, 'filePathTask');
    }

    return buildResponse('Новая задача добавлена');
  }

  private async saveFiles(
    filePathTask: Array<string>,
    taskId: string,
    type: 'filePathTask' | 'filePathExecutor',
  ) {
    await this.prismaService.$transaction(
      filePathTask.map((fileName) =>
        this.prismaService.files.create({
          data: {
            fileName,
            type,
            taskId,
          },
        }),
      ),
    );
  }

  private async taskData(id: string) {
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

        files: {
          select: {
            id: true,
            type: true,
          },
        },
      },
    });

    return task;
  }

  private async taskChangeExecutors(
    arrayId: Array<string>,
    taskId: string,
    key: 'connect' | 'disconnect',
  ) {
    if (arrayId.length > 0) {
      const executors =
        key === 'connect'
          ? { connect: arrayId.map((id) => ({ id })) }
          : { disconnect: arrayId.map((id) => ({ id })) };

      await this.prismaService.task.update({
        where: { id: taskId },
        data: {
          executors,
        },
      });
      return true;
    }

    return false;
  }

  async updateTaskCreator(
    dto: UpdateTaskCreatorDto,
    id: string,
    req: Request,
    files?: Array<Express.Multer.File>,
  ) {
    const { id: creatorId } = req.user as JwtPayload;

    const task = await this.taskData(id);

    if (!task) {
      throw new NotFoundException('Задача не обнаружена');
    }

    const {
      name,
      deadline,
      taskDescription,
      executorsAdd,
      executorsRemove,
      filesIdRemove,
    } = dto;

    const updateData: Partial<UpdateTaskData> = {};
    const currentName = task.name;
    const currentTaskDescription = task.taskDescription;
    const currentDeadline = new Date(task.deadline);
    const currentExecutors = task.executors.map((e) => e.id);
    const currentFilesId = task.files.reduce<string[]>((acc, val) => {
      if (val.type === 'filePathTask') {
        acc.push(val.id);
      }
      return acc;
    }, []);

    if (creatorId !== task.project.creatorId) {
      throw new ForbiddenException('У вас нет прав доступа к данной задачу');
    }

    if (name && name !== currentName) {
      updateData.name = name;
    }

    if (taskDescription && taskDescription !== currentTaskDescription) {
      updateData.taskDescription = taskDescription;
    }

    if (deadline) {
      const newDeadline = new Date(deadline);

      if (newDeadline !== currentDeadline) {
        updateData.deadline = deadline;
      }
    }

    if (executorsRemove) {
      const newExecutorsRemove = executorsRemove.filter((id) =>
        currentExecutors.includes(id),
      );

      await this.taskChangeExecutors(newExecutorsRemove, id, 'disconnect');
    }

    if (executorsAdd) {
      const newExecutors = executorsAdd.filter(
        (id) => !currentExecutors.includes(id),
      );

      await this.taskChangeExecutors(newExecutors, id, 'connect');
    }

    if (filesIdRemove) {
      const newFilesRemove = filesIdRemove.filter((f) =>
        currentFilesId.includes(id),
      );

      await this.prismaService.$transaction(
        newFilesRemove.map((id) =>
          this.prismaService.files.delete({
            where: { id },
          }),
        ),
      );
    }

    if (files) {
      const filePathTask = this.uploadsService.seveFiles(files);
      await this.saveFiles(filePathTask, task.id, 'filePathTask');
    }

    await this.prismaService.task.update({
      where: { id },
      data: { ...updateData },
    });

    return buildResponse('Задача обновлена');
  }

  async updateTaskExecutor(
    dto: UpdateTaskExecutorDto,
    id: string,
    req: Request,
    files?: Array<Express.Multer.File>,
  ) {
    const { id: executorId } = req.user as JwtPayload;

    const task = await this.taskData(id);

    if (!task) {
      throw new NotFoundException('Задача не обнаружена');
    }

    const recipients = new Set([
      ...task.executors.map((e) => e.id),
      task.project.creatorId,
    ]);

    const isExecutor = recipients.has(executorId);

    if (!isExecutor) {
      throw new ForbiddenException('У вас нет доступа к данной задаче');
    }
    const { executorDescription, filesIdRemove } = dto;

    const updateData: Partial<UpdateTaskData> = {};
    const currentFilesId = task.files.reduce<string[]>((acc, val) => {
      if (val.type === 'filePathExecutor') {
        acc.push(val.id);
      }
      return acc;
    }, []);

    const currentExecutorDescription = task.executorDescription;

    if (
      executorDescription &&
      executorDescription !== currentExecutorDescription
    ) {
      updateData.executorDescription = executorDescription;
    }

    if (filesIdRemove) {
      const newFilesRemove = filesIdRemove.filter((id) =>
        currentFilesId.includes(id),
      );

      await this.prismaService.$transaction(
        newFilesRemove.map((id) =>
          this.prismaService.files.delete({
            where: { id },
          }),
        ),
      );
    }

    if (files) {
      const filePathTask = this.uploadsService.seveFiles(files);
      await this.saveFiles(filePathTask, task.id, 'filePathExecutor');
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

    const recipients = new Set([
      ...task.executors.map((e) => e.id),
      task.project.creatorId,
    ]);

    const isExecutor = recipients.has(senderId);

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

    const { message, subject } = dto;
    const arrayRecipients: Array<string> = [];

    recipients.forEach((id) => {
      arrayRecipients.push(id);
    });

    await this.eventEmitter.emitAsync('notification.send', {
      taskId: task.id,
      senderId,
      recipients: arrayRecipients,
      message,
      subject,
    });

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

    const { message, subject, status } = dto;

    await this.prismaService.task.update({
      where: { id },
      data: {
        status,
      },
    });

    await this.eventEmitter.emitAsync('notification.send', {
      taskId: task.id,
      creatorId,
      recipients,
      message,
      subject,
    });

    return buildResponse('Ответ по проверке задачи отравлен');
  }
}
