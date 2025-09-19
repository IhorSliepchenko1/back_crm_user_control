import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role, Roles } from '@prisma/client';
import { ApiResponse } from 'src/common/interfaces';
import { buildResponse } from 'src/utils/build-response';

import { UpdateDescriptionsDto } from './dto/update-descriptions.dto';
import { RoleChangeDto } from './dto/role-change.dto';

@Injectable()
export class RoleService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: CreateRoleDto) {
    const { name, descriptions } = dto;

    const reservedRolesName = Object.values(Roles);

    if (!reservedRolesName.includes(name)) {
      throw new BadRequestException(
        'Создание роли - исключительно по зарезервированным названиям. Обратитесь к разработчику!',
      );
    }

    const isExist = await this.prismaService.role.findUnique({
      where: {
        name,
      },
    });

    if (isExist) {
      throw new ConflictException('Данная роль уже существует');
    }

    await this.prismaService.role.create({
      data: { name, descriptions },
    });

    return buildResponse('Новая роль создана');
  }

  async updateDescriptions(
    dto: UpdateDescriptionsDto,
    id: string,
  ): Promise<ApiResponse> {
    const role = await this.prismaService.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Роли с таким id на сервере не обнаружено');
    }

    await this.prismaService.role.update({
      where: { id },
      data: {
        descriptions: dto.descriptions,
      },
    });
    return buildResponse('Описание роли изменено');
  }

  async validateRolesExist(
    names: Roles[],
    id: string,
    status: 'add' | 'delete',
  ) {
    const rolesData = (
      await this.prismaService.role.findMany({
        select: {
          name: true,
        },
      })
    ).map((r) => r.name);

    const roles = rolesData.filter((name) => names.includes(name));

    if (roles.length !== names.length) {
      throw new BadRequestException('Вы передали некорректный массив ролей');
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

    if (deleteRoles?.length && addRoles?.length) {
      throw new BadRequestException(
        'Вы не можете одновременно удалять и добавлять права доступа к пользователю',
      );
    }

    if (deleteRoles?.length) {
      if (user.roles.length === 1) {
        throw new ConflictException(
          'Удалить роль можно при наличии более 1й роли',
        );
      }

      if (
        user.roles.some((r) => r.name === 'ADMIN') &&
        deleteRoles.length === 1 &&
        deleteRoles.includes('USER')
      ) {
        throw new BadRequestException(
          'Удалить роли USER у ADMIN невозможно, это делается в обратном направлении',
        );
      }

      await this.validateRolesExist(deleteRoles, id, 'delete');
    }

    if (addRoles?.length) {
      if (
        user.roles.length === 1 &&
        user.roles.some((r) => r.name === 'USER')
      ) {
        await this.validateRolesExist(addRoles, id, 'add');
      } else {
        throw new ConflictException(
          'Пользователю присвоено максимальный статус ролей',
        );
      }
    }
    return buildResponse('Роли изменены');
  }

  async rolesAll() {
    const data = await this.prismaService.role.findMany({
      select: {
        name: true,
      },
    });

    return buildResponse('Список ролей', { data });
  }
}
