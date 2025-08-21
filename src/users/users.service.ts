import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersDto } from './dto/users.dto';
import { RoleChangeDto } from './dto/role-change.dto';
import { Roles } from '@prisma/client';
import { buildResponse } from 'src/common/utils/build-response';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async users(dto: UsersDto) {
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
}
