import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { buildResponse } from 'src/utils/build-response';
import * as argon2 from 'argon2';
import type { Request } from 'express';
import { JwtPayload } from 'src/token/interfaces/jwt-payload.interface';
import { PaginationDto } from './dto/pagination.dto';
import { UploadsService } from 'src/uploads/uploads.service';
import { UpdateUserByIdDto } from './dto/update-user-by-id.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  async users(dto: PaginationDto, req: Request) {
    const { page, limit, active } = dto;
    const { roles } = req.user as JwtPayload;

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
  async user(id: string, req: Request) {
    let userId: string | null = id;

    if (id === 'my-profile') {
      const { id: myId } = req.user as JwtPayload;
      userId = myId;
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
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

    const data = [
      { title: 'id', value: user.id },
      { title: 'имя', value: user.login },
      {
        title: 'роль',
        value: user.roles.map((r) => r.name).includes('ADMIN')
          ? 'ADMIN'
          : 'USER',
      },
      { title: 'статус', value: user.active ? 'active' : 'blocked' },
      {
        title: 'создан',
        value: new Date(user.createdAt).toLocaleDateString(),
      },
      { title: 'личные проекты', value: user.createdProjects.length },
      { title: 'участник проектов', value: user.projects.length },
      { title: 'avatarPath', value: user.avatarPath },
      { title: 'к-во задач', value: tasks.count_tasks },
      { title: 'выполненные задачи', value: tasks.done_tasks },
      { title: 'задачи на проверке', value: tasks.in_reviews_tasks },
      { title: 'задачи в работе', value: tasks.in_progress_tasks },
      { title: 'отменённые задачи', value: tasks.canceled_task },
    ];

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
  async isActive(id: string, req: Request) {
    const { id: myId } = req.user as JwtPayload;
    if (myId === id) {
      throw new ConflictException(
        'Пользователь не может заблокировать самого себя',
      );
    }

    const user = await this.findUser(id);

    await this.prismaService.user.update({
      where: { id: user.id },

      data: {
        active: !user.active,
      },
    });

    return buildResponse(
      `Пользователь '${user.login}' ${user.active ? 'заблокирован' : 'разблокирован'}`,
    );
  }

  async usersForProject(req: Request) {
    const { id } = req.user as JwtPayload;

    const data = await this.prismaService.user.findMany({
      where: {
        active: true,
        id: {
          not: id,
        },
      },

      select: {
        login: true,
        id: true,
      },
    });

    return buildResponse('Список пользователей', { data });
  }

  async updateUserById(
    dto: UpdateUserByIdDto,
    id: string,
    req: Request,
    files?: Array<Express.Multer.File>,
  ) {
    const { id: myId, roles } = req.user as JwtPayload;

    let userId: string | null = id;

    if (id === 'my-profile') {
      const { id: myId } = req.user as JwtPayload;
      userId = myId;
    }

    const user = await this.findUser(userId);

    if (!roles.includes('ADMIN') && userId !== myId) {
      throw new ForbiddenException();
    }

    const { login, newPassword, oldPassword } = dto;
    const data: { login?: string; password?: string; avatarPath?: string } = {};

    if (login) {
      const isExistLogin = await this.prismaService.user.findUnique({
        where: { login },
      });
      if (isExistLogin) {
        throw new ConflictException(
          'Логин уже используется другим пользователем',
        );
      }

      data.login = login;
    }

    if ((newPassword && !oldPassword) || (oldPassword && !newPassword)) {
      throw new BadRequestException(
        'Вы передали не все данные для смены пароля',
      );
    }

    if (newPassword && oldPassword) {
      if (oldPassword === newPassword) {
        throw new ConflictException('Значения не могут быть одинаковыми');
      }

      const isMatch = await argon2.verify(user.password, oldPassword);

      if (!isMatch) {
        throw new ConflictException('Не верный пароль');
      }

      const hashNewPassword = await argon2.hash(newPassword);

      data.password = hashNewPassword;
    }

    if (files) {
      if (files.length) {
        const avatarPath = this.uploadsService.seveFiles(files)[0];
        data.avatarPath = avatarPath;
      }
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data,
    });

    return buildResponse('Вы успешно сохранили новые данные');
  }
}
