import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectDto } from './dto/project.dto';
import { buildResponse } from 'src/utils/build-response';
import { Participants } from './dto/participants.dto';
import type { Request } from 'express';
import { JwtPayload } from 'src/token/interfaces/jwt-payload.interface';
import { RenameProjectDto } from './dto/rename-project.dto';
import { PaginationDto } from 'src/users/dto/pagination.dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UsersService,
  ) {}

  async createProject(dto: ProjectDto, req: Request) {
    const { id: creatorId } = req.user as JwtPayload;

    await this.userService.findUser(creatorId);

    const { name, participants } = dto;

    const isExistParticipants = await this.prismaService.user.findMany({
      where: {
        id: {
          in: participants,
        },
      },
    });

    if (isExistParticipants.length !== participants.length) {
      throw new BadRequestException(
        'Пользователи переданные вам не все содержаться на сервере',
      );
    }

    if (isExistParticipants.some((u) => !u.active)) {
      throw new BadRequestException(
        'Заблокированные пользователи не могут быть добавлены в проект',
      );
    }

    await this.prismaService.project.create({
      data: {
        name,
        creatorId,
        participants: {
          connect: participants.map((id) => ({ id })),
        },
      },
    });

    return buildResponse('Новый проект добавлен');
  }
  private async findProject(id: string) {
    const project = await this.prismaService.project.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        name: true,
        creatorId: true,
        active: true,

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

    return project;
  }
  async participantsProject(dto: Participants, id: string, req: Request) {
    const { id: creatorId, roles } = req.user as JwtPayload;
    await this.userService.findUser(creatorId);
    const project = await this.findProject(id);

    if (
      !roles.some((role) => role === 'ADMIN') &&
      creatorId !== project.creatorId
    ) {
      throw new ForbiddenException(
        'Вы не можете менять что то в чужих проектах',
      );
    }

    const { ids, key } = dto;

    if (ids.includes(creatorId)) {
      throw new ConflictException(
        `Создатель проекта не может быть ${key === 'connect' ? 'добавлен' : 'удалён'}`,
      );
    }

    if (key === 'connect' && project.participants.length + ids.length > 15) {
      throw new ConflictException(
        'При добавлении новых участников к-во привысит максимально допустимое (15)!',
      );
    }

    if (ids.length >= 15) {
      throw new ConflictException(
        `Вы передали слишком много пользователей для ${key === 'connect' ? 'добавления' : 'удаления'}`,
      );
    }

    const participants =
      key === 'connect'
        ? { connect: ids.map((id) => ({ id })) }
        : { disconnect: ids.map((id) => ({ id })) };

    if (key === 'disconnect') {
      const tasksUserId = await this.prismaService.task.findMany({
        where: {
          projectId: id,
        },

        select: {
          id: true,
          executors: {
            select: {
              id: true,
            },
          },
        },
      });

      const filteredData = tasksUserId.map((taskItem) => {
        taskItem.executors.filter((executor) => ids.includes(executor.id));
      });

      if (filteredData.length) {
        await this.prismaService.$transaction(
          tasksUserId.map((task) =>
            this.prismaService.task.update({
              where: {
                id: task.id,
              },

              data: {
                executors: { disconnect: ids.map((id) => ({ id })) },
              },
            }),
          ),
        );
      }
    }

    await this.prismaService.project.update({
      where: {
        id: project.id,
      },

      data: {
        participants,
      },
    });

    return buildResponse('Участники проекта обновлены');
  }
  async renameProject(dto: RenameProjectDto, id: string, req: Request) {
    const { id: creatorId, roles } = req.user as JwtPayload;
    await this.userService.findUser(creatorId);

    const project = await this.findProject(id);

    if (
      !roles.some((role) => role === 'ADMIN') &&
      creatorId !== project.creatorId
    ) {
      throw new ForbiddenException(
        'Вы не можете менять что то в чужих проектах',
      );
    }

    const { name } = dto;
    await this.prismaService.project.update({
      where: { id },
      data: {
        name,
      },
    });

    return buildResponse('Проект переименован');
  }
  async isActive(id: string, req: Request) {
    const { id: creatorId, roles } = req.user as JwtPayload;
    await this.userService.findUser(creatorId);
    const project = await this.findProject(id);

    if (
      !roles.some((role) => role === 'ADMIN') &&
      creatorId !== project.creatorId
    ) {
      throw new ForbiddenException(
        'Вы не можете менять что то в чужих проектах',
      );
    }

    await this.prismaService.project.update({
      where: {
        id,
      },

      data: {
        active: !project.active,
      },
    });

    return buildResponse('Статус проекта обновлён');
  }
  async projects(dto: PaginationDto, req: Request) {
    const { id: creatorId, roles } = req.user as JwtPayload;
    await this.userService.findUser(creatorId);

    const { page, limit, active, my } = dto;
    const currentPage = page ?? 1;
    const pageSize = limit ?? 10;

    const isAdmin = roles.some((role) => role === 'ADMIN');

    const where = {
      active,
      ...((!isAdmin || (my && isAdmin)) && { creatorId }),
    };

    const [prevData, total] = await this.prismaService.$transaction([
      this.prismaService.project.findMany({
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        where,

        select: {
          id: true,
          name: true,
          createdAt: true,
          creator: {
            select: {
              login: true,
            },
          },
          creatorId: true,
          participants: true,

          tasks: {
            select: {
              status: true,
            },
          },
        },
      }),

      this.prismaService.project.count({ where }),
    ]);

    const projects = prevData.map((item) => {
      const tasks = item.tasks.reduce(
        (acc, val) => {
          acc.count_tasks++;

          if (val.status === 'DONE') {
            acc.done_tasks++;
          }

          if (val.status === 'IN_REVIEW') {
            acc.in_reviews_tasks++;
          }

          if (val.status === 'IN_PROGRESS') {
            acc.in_progress_tasks++;
          }

          if (val.status === 'CANCELED') {
            acc.canceled_task++;
          }

          return acc;
        },
        {
          count_tasks: 0,
          done_tasks: 0,
          in_reviews_tasks: 0,
          in_progress_tasks: 0,
          canceled_task: 0,
        },
      );

      return {
        id: item.id,
        creatorId: item.creatorId,
        name: item.name,
        ...tasks,
        creator: item.creator.login,
        created_at: new Date(item.createdAt).toLocaleDateString(),
        count_participants: item.participants.length,
        is_active: active,
      };
    });
    const count_pages = Math.ceil(total / limit);

    const data = {
      projects,
      total,
      count_pages,
      page,
      limit,
    };

    return buildResponse('Список проектов', { data });
  }
  async project(id: string, req: Request) {
    const { id: creatorId, roles } = req.user as JwtPayload;
    await this.userService.findUser(creatorId);
    const project = await this.prismaService.project.findUnique({
      where: { id },
      select: {
        name: true,
        creator: {
          select: {
            login: true,
            id: true,
          },
        },

        participants: {
          select: {
            id: true,
            login: true,
          },
        },
        tasks: {
          select: {
            id: true,
            deadline: true,
            name: true,
            status: true,
            executors: {
              select: {
                login: true,
              },
            },
          },
        },
      },
    });

    if (
      project &&
      !roles.some((role) => role === 'ADMIN') &&
      creatorId !== project.creator.id
    ) {
      throw new ForbiddenException('Вам не доступен просмотр чужих проетов');
    }

    return buildResponse('Проект', { data: { project } });
  }
}
