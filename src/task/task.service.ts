import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { buildResponse } from 'src/utils/build-response';
import { UploadsService } from 'src/uploads/uploads.service';
import { UpdateTaskData } from './interfaces/update-task-data.interface';
import { JwtPayload } from 'src/token/interfaces/jwt-payload.interface';
import type { Request } from 'express';
import { UpdateTaskCreatorDto } from './dto/update-task-creator.dto';
import { UpdateTaskExecutorDto } from './dto/update-task-executor.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsersService } from 'src/users/users.service';
import { PaginationTaskDto } from './dto/pagination-task.dto';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TaskService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly uploadsService: UploadsService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createTask(
    dto: CreateTaskDto,
    projectId: string,
    req: Request,
    files?: Array<Express.Multer.File>,
  ) {
    const { id: creatorId, roles } = req.user as JwtPayload;

    const project = await this.prismaService.project.findUnique({
      where: {
        id: projectId,
      },

      select: {
        id: true,
        creatorId: true,
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
    console.log(project.creatorId, creatorId);

    if (
      project.creatorId !== creatorId &&
      !roles.some((role) => role === 'ADMIN')
    ) {
      throw new ForbiddenException(
        'Только куратор проекта может назначать задачи!',
      );
    }

    if (files && files.length > 5) {
      throw new ConflictException('Максимально к-во файлов (5шт)');
    }

    const { name, deadline, taskDescription, executors } = dto;

    if (executors.length < 1 || executors.length > 5) {
      throw new BadRequestException(
        'К-во участников должно быть в пределах 1-5',
      );
    }

    const participants = project.participants.map((p) => p.id);
    const isAccess = executors.some((id) => !participants.includes(id));

    if (isAccess) {
      throw new BadRequestException(
        'Вы передали участника не имеющего доступ к данному проекту',
      );
    }

    const task = await this.prismaService.task.create({
      data: {
        name,
        deadline,
        taskDescription,
        projectId,

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
    filePathTask: string[],
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
        status: true,
        executors: {
          select: {
            id: true,
            login: true,
          },
        },

        taskDescription: true,
        executorDescription: true,
        deadline: true,
        name: true,
        project: {
          select: {
            id: true,
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
    arrayId: string[],
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
    taskId: string,
    req: Request,
    files?: Array<Express.Multer.File>,
  ) {
    const { id: creatorId, roles } = req.user as JwtPayload;
    const task = await this.taskData(taskId);

    if (!task) {
      throw new NotFoundException('Задача не обнаружена');
    }

    const { name, deadline, taskDescription, executorsAdd } = dto;

    const updateData: Partial<UpdateTaskData> = {};
    const currentName = task.name;
    const currentTaskDescription = task.taskDescription;
    const currentDeadline = new Date(task.deadline);
    const currentExecutors = task.executors.map((e) => e.id);
    let recipients = [creatorId, ...currentExecutors];
    const message: string[] = [];

    if (
      creatorId !== task.project.creatorId &&
      !roles.some((role) => role === 'ADMIN')
    ) {
      throw new ForbiddenException('У вас нет права доступа к задаче');
    }

    if (name && name !== currentName) {
      updateData.name = name;
      message.push('Смена названия задачи');
    }

    if (taskDescription && taskDescription !== currentTaskDescription) {
      updateData.taskDescription = taskDescription;
      message.push('Внесены изменения в описании к задаче');
    }

    if (deadline) {
      const newDeadline = new Date(deadline);

      if (newDeadline !== currentDeadline) {
        updateData.deadline = deadline;
        message.push('Изменённ срок сдачи задачи');
      } else {
        throw new ConflictException(
          'Срок сдачи не может быть в прошедшем времени',
        );
      }
    }

    if (executorsAdd) {
      const newExecutors = executorsAdd.filter(
        (id) => !currentExecutors.includes(id),
      );

      if (executorsAdd.length + currentExecutors.length > 5) {
        throw new ConflictException(
          'На задаче задействовано максимально к-во (5)',
        );
      }

      recipients.push(...newExecutors);
      message.push(
        `Изменённ список исполнителей добавлены - (${newExecutors.join(', ')})`,
      );
      await this.taskChangeExecutors(newExecutors, taskId, 'connect');
    }

    if (files) {
      if (
        files.length +
          task.files.filter((f) => f.type !== 'filePathExecutor').length >
        5
      ) {
        throw new ConflictException('Максимально к-во файлов (5шт)');
      }

      const filePathTask = this.uploadsService.seveFiles(files);
      await this.saveFiles(filePathTask, task.id, 'filePathTask');
      message.push(`Добавлены новые файлы`);
    }

    await this.prismaService.task.update({
      where: { id: taskId },
      data: { ...updateData },
    });

    await this.eventEmitter.emitAsync('notification.send', {
      taskId,
      senderId: creatorId,
      recipients,
      subject: `Внесены изменения в задачу - '${task.name}'`,
      message: message.join('\n\n'),
    });

    return buildResponse('Задача обновлена');
  }
  async removeExecutor(taskId: string, executorId: string, req: Request) {
    const { id: creatorId, roles } = req.user as JwtPayload;
    const task = await this.taskData(taskId);

    if (!task) {
      throw new NotFoundException('Задача не обнаружена');
    }

    if (
      creatorId !== task.project.creatorId &&
      !roles.some((role) => role === 'ADMIN')
    ) {
      throw new ForbiddenException('У вас нет права доступа к задаче');
    }

    const executor = task.executors.find((e) => e.id === executorId);

    if (!executor) {
      new ConflictException('Данный пользователь не относится к задаче');
    }

    const currentExecutors = task.executors.map((e) => e.id);
    let recipients = [creatorId, ...currentExecutors];

    await this.taskChangeExecutors([executorId], taskId, 'disconnect');
    await this.eventEmitter.emitAsync('notification.send', {
      taskId,
      senderId: creatorId,
      recipients,
      subject: `Внесены изменения в задачу - '${task.name}'`,
      message: `Изменённ список исполнителей удалены - (${executor?.login})`,
    });

    return buildResponse('Задача обновлена');
  }
  async updateTaskExecutor(
    dto: UpdateTaskExecutorDto,
    taskId: string,
    req: Request,
    files?: Array<Express.Multer.File>,
  ) {
    const { id: executorId, login } = req.user as JwtPayload;
    const task = await this.taskData(taskId);

    if (!task) {
      throw new NotFoundException('Задача не обнаружена');
    }

    if (task.status !== 'IN_PROGRESS') {
      throw new ConflictException(
        "Задача уже не в статусе 'в процессе', вы уже не можете вносить изменения",
      );
    }

    const recipients = [
      ...task.executors.map((e) => e.id),
      task.project.creatorId,
    ];

    const isExecutor = recipients.includes(executorId);

    if (!isExecutor) {
      throw new ForbiddenException('У вас нет права доступа к задаче');
    }
    const { executorDescription } = dto;

    if (files) {
      if (files.length > 5) {
        console.log(files);

        throw new ConflictException('Максимально к-во файлов (5шт)');
      }

      const filePathTask = this.uploadsService.seveFiles(files);
      await this.saveFiles(filePathTask, task.id, 'filePathExecutor');
    }

    await this.prismaService.task.update({
      where: { id: taskId },
      data: { executorDescription, status: 'IN_REVIEW' },
    });

    await this.eventEmitter.emitAsync('notification.send', {
      taskId,
      senderId: executorId,
      recipients,
      subject: `Проверка выполнения задачи '${task.name}'`,
      message: `Учатник задачи '${login}', прислал решение на проверку`,
    });

    return buildResponse('Задача обновлена');
  }
  async deleteFileTask(taskId: string, fileId: string, req: Request) {
    const { id: creatorId, roles } = req.user as JwtPayload;
    const task = await this.taskData(taskId);
    let message = '';
    if (!task) {
      throw new NotFoundException('Задача не обнаружена');
    }

    if (
      creatorId !== task.project.creatorId &&
      !roles.some((role) => role === 'ADMIN')
    ) {
      throw new ForbiddenException('У вас нет права доступа к задаче');
    }

    const currentFiles = task.files.find((f) => f.id === fileId);

    if (!currentFiles) {
      throw new NotFoundException('Вы передали несуществующий файл');
    }

    const recipients = [
      ...task.executors.map((e) => e.id),
      task.project.creatorId,
    ];

    if (currentFiles.type === 'filePathExecutor') {
      await this.prismaService.task.update({
        data: {
          status: 'IN_PROGRESS',
        },

        where: {
          id: taskId,
        },
      });

      message = 'В задаче был сменён статус и удалён файл';
    } else {
      message = 'В задаче был удалён файл';
    }

    await this.prismaService.files.delete({
      where: {
        id: fileId,
      },
    });

    await this.eventEmitter.emitAsync('notification.send', {
      taskId,
      senderId: creatorId,
      recipients,
      subject: `Внесены изменения в задачу - '${task.name}'`,
      message,
    });

    return buildResponse('Задача обновлена');
  }
  async changeStatus(taskId: string, status: TaskStatus, req: Request) {
    const { id: creatorId, roles } = req.user as JwtPayload;
    const task = await this.taskData(taskId);

    if (!task) {
      throw new NotFoundException('Задача не обнаружена');
    }

    if (
      creatorId !== task.project.creatorId &&
      !roles.some((role) => role === 'ADMIN')
    ) {
      throw new ForbiddenException('У вас нет права доступа к задаче');
    }

    if (!Object.values(TaskStatus).includes(status)) {
      throw new BadRequestException('Передано неизвестное значение');
    }

    if (status === task.status) {
      throw new ConflictException('Имя статуса должно отличаться от текущего');
    }

    const recipients = [
      ...task.executors.map((e) => e.id),
      task.project.creatorId,
    ];

    await this.prismaService.task.update({
      where: {
        id: taskId,
      },

      data: {
        status,
      },
    });

    await this.eventEmitter.emitAsync('notification.send', {
      taskId,
      senderId: creatorId,
      recipients,
      subject: `Внесены изменения в задачу - '${task.name}'`,
      message: `Статус был изменён на '${status}'`,
    });

    return buildResponse('Задача обновлена');
  }
  async taskByProjectId(dto: PaginationTaskDto, req: Request) {
    const { page, limit, status, deadlineFrom, deadlineTo, projectId } = dto;
    const { id: creatorId, roles } = req.user as JwtPayload;
    const currentPage = page ?? 1;
    const pageSize = limit ?? 10;

    const isAdmin = roles.some((role) => role === 'ADMIN');

    const isCreator = await this.prismaService.project.findUnique({
      where: {
        id: projectId,
      },

      select: {
        creatorId: true,
        participants: true,
      },
    });

    const isParticipants = isCreator?.participants.some(
      (p) => p.id === creatorId,
    );

    if (!isAdmin && isCreator?.creatorId !== creatorId && !isParticipants) {
      throw new ForbiddenException(
        'Отказано в доступе. Вы можете просматривать эти задачи!',
      );
    }

    const where = {
      projectId,
      ...(status && { status }),
      ...(isParticipants &&
        !isAdmin &&
        isCreator?.creatorId !== creatorId && {
          executors: {
            some: {
              id: creatorId,
            },
          },
        }),
      ...(deadlineTo &&
        deadlineFrom && {
          deadline: {
            gte: deadlineFrom,
            lte: deadlineTo,
          },
        }),
    };

    const [tasks, total] = await this.prismaService.$transaction([
      this.prismaService.task.findMany({
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        orderBy: { deadline: 'asc' },
        where,
        select: {
          id: true,
          name: true,
          status: true,
          deadline: true,
          executors: {
            select: {
              id: true,
              login: true,
            },
          },
          createdAt: true,
        },
      }),

      this.prismaService.task.count({
        where,
      }),
    ]);

    const count_pages = Math.ceil(total / limit);

    const data = {
      tasks,
      total,
      count_pages,
      page,
      limit,
    };

    return buildResponse('Список задач', { data });
  }
  async taskById(id: string, req: Request) {
    const { id: creatorId, roles } = req.user as JwtPayload;
    const task = await this.prismaService.task.findUnique({
      where: {
        id,
      },

      select: {
        name: true,
        executors: {
          select: {
            id: true,
            login: true,
          },
        },
        deadline: true,
        status: true,
        executorDescription: true,
        taskDescription: true,
        files: {
          select: {
            id: true,
            fileName: true,
            type: true,
          },
        },
        project: {
          select: {
            id: true,
            creatorId: true,
            creator: {
              select: {
                login: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Задача не обнаружена');
    }

    const projectParticipants = await this.prismaService.project.findUnique({
      where: {
        id: task?.project.id,
      },

      select: {
        participants: {
          where: {
            id: {
              notIn: task.executors.map((e) => e.id),
            },
          },
          select: {
            login: true,
            id: true,
          },
        },
      },
    });

    if (
      task.project.creatorId !== creatorId &&
      !task.executors.some((e) => e.id === creatorId) &&
      !roles.includes('ADMIN')
    ) {
      throw new ForbiddenException('У вас нет права доступа к задаче');
    }

    return buildResponse('Задача', {
      data: { ...task, participants: projectParticipants?.participants },
    });
  }
}
