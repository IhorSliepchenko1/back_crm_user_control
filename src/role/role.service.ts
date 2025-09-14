import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role, Roles } from '@prisma/client';
import { ApiResponse } from 'src/common/interfaces';
import { buildResponse } from 'src/common/utils/build-response';
import { UpdateDescriptionsDto } from './dto/update-descriptions.dto';
import { RoleChangeDto } from './dto/role-change.dto';

@Injectable()
export class RoleService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: CreateRoleDto): Promise<ApiResponse<Role>> {
    try {
      const role = await this.prismaService.role.create({
        data: { ...dto },
      });

      return buildResponse('Новая роль создана', role);
    } catch (error: any) {
      throw new ConflictException(
        'Создание роли - исключительно по зарезервированным названиям. Обратитесь к разработчику!',
      );
    }
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
    return buildResponse('Новая роль создана');
  }

  async validateRolesExist(
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
