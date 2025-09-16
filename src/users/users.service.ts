import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { buildResponse } from 'src/utils/build-response';

import { RenameUserDto } from './dto/rename-user.dto';
import { ChangePassword } from './dto/change-password.dto';
import * as argon2 from 'argon2';
import type { Request } from 'express';
import { JwtPayload } from 'src/token/interfaces/jwt-payload.interface';
import { PaginationDto } from './dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async users(dto: PaginationDto) {
    const { page, limit } = dto;

    const currentPage = page ?? 1;
    const pageSize = limit ?? 10;

    const [userData, total] = await this.prismaService.$transaction([
      this.prismaService.user.findMany({
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },

        select: {
          id: true,
          login: true,
          createdAt: true,
          blocked: true,
          projects: {
            select: {
              tasks: true,
            },
          },
          createdProjects: true,
          roles: {
            select: {
              name: true,
            },
          },
        },
      }),

      this.prismaService.user.count(),
    ]);

    const data = userData.map((user) => {
      const tasks = user.projects.reduce(
        (acc, val) => {
          val.tasks.map((item) => {
            acc.count_tasks++;
            if (item.status === 'DONE') {
              acc.done_tasks++;
            }

            if (item.status === 'IN_REVIEW') {
              acc.in_reviews_tasks++;
            }

            if (item.status === 'IN_PROGRESS') {
              acc.in_progress_tasks++;
            }
          });

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
        id: user.id,
        name: user.login,
        status: user.blocked,
        created_at: user.createdAt,
        creator_projects: user.createdProjects.length,
        participant_projects: user.projects.length,
        ...tasks,
      };
    });
    const count_pages = Math.ceil(total / limit);
    return buildResponse('', {
      data,
      total,
      count_pages,
      page,
      limit,
    });
  }

  async user(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        login: true,
        createdAt: true,
        blocked: true,
        projects: {
          select: {
            id: true,
            active: true,
            name: true,
            tasks: true,
          },
        },
        createdProjects: true,
        roles: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const tasks = user.projects.reduce(
      (acc, val) => {
        val.tasks.map((item) => {
          acc.count_tasks++;
          if (item.status === 'DONE') {
            acc.done_tasks++;
          }

          if (item.status === 'IN_REVIEW') {
            acc.in_reviews_tasks++;
          }

          if (item.status === 'IN_PROGRESS') {
            acc.in_progress_tasks++;
          }
        });

        return acc;
      },
      {
        count_tasks: 0,
        done_tasks: 0,
        in_reviews_tasks: 0,
        in_progress_tasks: 0,
      },
    );
    const data = {
      id: user.id,
      name: user.login,
      status: user.blocked,
      created_at: user.createdAt,
      creator_projects: user.createdProjects.length,
      participant_projects: user.projects.length,
      ...tasks,
      projects: user.projects,
    };
    return buildResponse('Информация о пользователе', { data });
  }

  private async findUser(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не обнаружен');
    }

    return user;
  }
  async isActive(id: string) {
    const user = await this.findUser(id);

    await this.prismaService.user.update({
      where: { id: user.id },

      data: {
        blocked: !user.blocked,
      },
    });

    return buildResponse(
      `Пользователь '${user.login}' ${!user.blocked ? 'заблокирован' : 'разблокирован'}`,
    );
  }
  async renameUser(dto: RenameUserDto, id: string, req: Request) {
    const { id: userId, roles } = req.user as JwtPayload;

    if (!roles.includes('ADMIN') && id !== userId) {
      throw new ForbiddenException(
        'У вас нет прав редактировать чужие логины!',
      );
    }

    const user = await this.findUser(id);

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        login: dto.login,
      },
    });

    return buildResponse('Пользователь переименован');
  }
  async changePassword(dto: ChangePassword, id: string, req: Request) {
    const { id: userId, roles } = req.user as JwtPayload;

    if (!roles.includes('ADMIN') && id !== userId) {
      throw new ForbiddenException(
        'У вас нет прав редактировать чужие логины!',
      );
    }
    const user = await this.findUser(id);

    const { oldPassword, newPassword } = dto;

    if (oldPassword === newPassword) {
      throw new ConflictException('Значения не могут быть одинаковыми');
    }

    const isMatch = await argon2.verify(user.password, oldPassword);

    if (!isMatch) {
      throw new ConflictException('Неверный пароль');
    }

    const hashNewPassword = await argon2.hash(newPassword);

    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashNewPassword,
      },
    });

    return buildResponse('Вы успешно сменили пароль');
  }
}
