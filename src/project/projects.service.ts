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
    });

    if (!project) {
      throw new NotFoundException('Проект не обнаружен');
    }

    return project;
  }

  async renameProject(dto: RenameProjectDto, id: string, req: Request) {
    const { id: creatorId } = req.user as JwtPayload;
    await this.userService.findUser(creatorId);

    const project = await this.findProject(id);

    if (creatorId !== project.creatorId) {
      throw new ForbiddenException(
        'Право менять название проекта есть только у создателя проекта',
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

  async participantsProject(dto: Participants, id: string, req: Request) {
    const { id: creatorId } = req.user as JwtPayload;
    await this.userService.findUser(creatorId);
    const project = await this.findProject(id);

    if (creatorId !== project.creatorId) {
      throw new ForbiddenException(
        'Право менять участников проекта есть только у создателя проекта',
      );
    }
    const { ids, key } = dto;

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

  async isActive(id: string, req: Request) {
    const { id: creatorId } = req.user as JwtPayload;
    await this.userService.findUser(creatorId);
    const project = await this.findProject(id);

    if (creatorId !== project.creatorId) {
      throw new ForbiddenException(
        'Право менять статус проекта есть только у создателя проекта',
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

  async projects(dto: PaginationDto) {
    const { page, limit, active } = dto;
    const currentPage = page ?? 1;
    const pageSize = limit ?? 10;

    const [prevData, total] = await this.prismaService.$transaction([
      this.prismaService.project.findMany({
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        where: { active },

        select: {
          name: true,
          createdAt: true,
          creator: {
            select: {
              login: true,
            },
          },

          participants: true,

          tasks: {
            select: {
              status: true,
            },
          },
        },
      }),

      this.prismaService.project.count({ where: { active } }),
    ]);

    const data = prevData.map((item) => {
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

          return acc;
        },
        {
          count_tasks: 0,
          done_tasks: 0,
          in_reviews_tasks: 0,
          in_progress_tasks: 0,
        },
      );

      return {
        name: item.name,
        ...tasks,
        creator: item.creator.login,
        created_ad: item.createdAt,
        count_participants: item.participants.length,
        is_active: active
      };
    });

    const count_pages = Math.ceil(total / limit);
    return buildResponse('Данные получены', {
      data,
      total,
      count_pages,
      page,
      limit,
    });
  }
}
