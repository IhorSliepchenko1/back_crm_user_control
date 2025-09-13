import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleChangeDto } from './dto/role-change.dto';
import { Roles } from '@prisma/client';
import { buildResponse } from 'src/common/utils/build-response';
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

    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.user.findMany({
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),

      this.prismaService.user.count(),
    ]);

    return buildResponse('', {
      data,
      total,
      page,
      limit,
    });
  }
  
  private async validateRolesExist(
    names: Roles[],
    id: string,
    status: 'add' | 'delete',
  ) {
    const roles = (
      await this.prismaService.role.findMany({
        where: { name: { in: names } },
      })
    ).map((r) => r.name);

    if (roles.length !== names.length) {
      throw new ConflictException('Вы передали некорректный массив ролей');
    }

    if (status === 'delete') {
      await this.prismaService.user.update({
        where: { id },
        data: {
          roles: { disconnect: roles.map((name) => ({ name })) },
        },
      });
    }

    if (status === 'add') {
      await this.prismaService.user.update({
        where: { id },
        data: {
          roles: { connect: roles.map((name) => ({ name })) },
        },
      });
    }

    return true;
  }
  async roleChange(dto: RoleChangeDto, id: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },

      select: {
        roles: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const { deleteRoles, addRoles } = dto;

    if (deleteRoles?.length) {
      if (user.roles.length === 1) {
        throw new ConflictException(
          'Удалить роль можно при наличии более 1й роли.',
        );
      }

      await this.validateRolesExist(deleteRoles, id, 'delete');
    }

    if (addRoles?.length) {
      await this.validateRolesExist(addRoles, id, 'add');
    }

    return buildResponse('Роли изменены');
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
  async blockedOrUnblockedUser(id: string) {
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
