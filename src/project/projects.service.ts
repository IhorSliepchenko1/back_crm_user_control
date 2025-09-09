import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectDto } from './dto/project.dto';
import { buildResponse } from 'src/common/utils/build-response';
import { Participants } from './dto/participants.dto';
import { Projects } from './dto/projects.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prismaService: PrismaService) {}

  async createProject(dto: ProjectDto, creatorId: string) {
    await this.prismaService.project.create({
      data: {
        name: dto.name,
        creatorId,
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

  async renameProject(dto: ProjectDto, id: string) {
    const project = await this.findProject(id);

    await this.prismaService.project.update({
      where: { id: project.id },
      data: {
        name: dto.name,
      },
    });

    return buildResponse('Пользователь переименован');
  }

  async participantsProject(dto: Participants, id: string) {
    const project = await this.findProject(id);
    const { ids, key } = dto;

    const participants =
      key === 'connect'
        ? { connect: ids.map((id) => ({ id })) }
        : { disconnect: ids.map((id) => ({ id })) };

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

  async isActive(id: string) {
    const project = await this.findProject(id);

    await this.prismaService.project.update({
      where: {
        id: project.id,
      },

      data: {
        active: !project.active,
      },
    });

    return buildResponse('Статус проекта обновлён');
  }

  async projects(dto: Projects) {
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

          tasks: {
            select: {
              status: true,
            },
          },
        },
      }),

      this.prismaService.user.count(),
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
      };
    });

    return buildResponse('', {
      data,
      total,
      page,
      limit,
    });
  }
}
