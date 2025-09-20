import {
  BadRequestException,
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
import { UploadsService } from 'src/uploads/uploads.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  async users(dto: PaginationDto, req: Request) {
    const { page, limit, active } = dto;
    const { id, roles } = req.user as JwtPayload;

    const currentPage = page ?? 1;
    const pageSize = limit ?? 10;

    const [userData, total] = await this.prismaService.$transaction([
      this.prismaService.user.findMany({
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        where: { active: roles.includes('ADMIN') ? active : true },
        select: {
          id: true,
          login: true,
          avatarPath: true,
          createdAt: true,
          active: true,
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

      this.prismaService.user.count({
        where: { active: roles.includes('ADMIN') ? active : true },
      }),
    ]);

    const users = userData.map((user) => {
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
            if (item.status === 'CANCELED') {
              acc.canceled_task++;
            }
          });

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
        id: user.id,
        name: user.login,
        avatarPath: user.avatarPath,
        is_active: user.active,
        created_at: new Date(user.createdAt).toLocaleDateString(),
        creator_projects: user.createdProjects.length,
        participant_projects: user.projects.length,
        ...tasks,
        roles: user.roles.map((r) => r.name),
      };
    });
    const count_pages = Math.ceil(total / limit);

    const data = {
      users,
      total,
      count_pages,
      page,
      limit,
    };
    return buildResponse('Список пользователей', { data });
  }
  async user(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        login: true,
        createdAt: true,
        avatarPath: true,
        active: true,
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

          if (item.status === 'CANCELED') {
            acc.canceled_task++;
          }
        });

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
    const data = {
      id: user.id,
      name: user.login,
      is_active: user.active,
      created_at: new Date(user.createdAt).toLocaleDateString(),
      creator_projects: user.createdProjects.length,
      participant_projects: user.projects.length,
      avatarPath: user.avatarPath,
      ...tasks,
      roles: user.roles.map((r) => r.name),
    };
    return buildResponse('Информация о пользователе', { data });
  }
  async findUser(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        roles: true,
        password: true,
        login: true,
        active: true,
        avatarPath: true,
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
        active: !user.active,
      },
    });

    return buildResponse(
      `Пользователь '${user.login}' ${!user.active ? 'заблокирован' : 'разблокирован'}`,
    );
  }
  async renameUser(dto: RenameUserDto, id: string, req: Request) {
    const { id: userId, roles } = req.user as JwtPayload;

    const user = await this.findUser(id);

    if (!roles.includes('ADMIN') && id !== userId) {
      throw new ForbiddenException(
        'У вас нет прав редактировать другие аккаунты!',
      );
    }

    const { login } = dto;
    const isExistLogin = await this.prismaService.user.findUnique({
      where: { login },
    });

    if (isExistLogin) {
      throw new ConflictException(
        'Логин уже используется другим пользователем',
      );
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        login,
      },
    });

    return buildResponse('Пользователь переименован');
  }
  async changePassword(dto: ChangePassword, id: string, req: Request) {
    const { id: userId, roles } = req.user as JwtPayload;
    const user = await this.findUser(id);

    if (!roles.includes('ADMIN') && id !== userId) {
      throw new ForbiddenException(
        'У вас нет прав редактировать другие аккаунты!',
      );
    }

    const { oldPassword, newPassword } = dto;

    if (oldPassword === newPassword) {
      throw new BadRequestException('Значения не могут быть одинаковыми');
    }

    const isMatch = await argon2.verify(user.password, oldPassword);

    if (!isMatch) {
      throw new ConflictException('Не верный пароль');
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
  async changeAvatar(req: Request, files: Array<Express.Multer.File>) {
    const { id } = req.user as JwtPayload;
    await this.findUser(id);

    if (files.length) {
      const avatarPath = this.uploadsService.seveFiles(files);
      await this.prismaService.user.update({
        where: { id },

        data: {
          avatarPath: avatarPath[0],
        },
      });
    } else {
      throw new BadRequestException('Некоректные данные');
    }
    return buildResponse('Вы успешно сменили аватар аккаунта');
  }
}
