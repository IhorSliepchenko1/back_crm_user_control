import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersDto } from './dto/users.dto';
import { RoleChangeDto } from './dto/role-change.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async users(dto: UsersDto) {
    const { page, limit } = dto;

    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.user.findMany({
        skip: page && limit ? (page - 1) * limit : 0,
        take: limit ?? 10,

        orderBy: { createdAt: 'desc' },
      }),

      this.prismaService.user.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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

    if (user.roles.length === 1) {
      throw new ConflictException(
        'Удалить роль можно при наличии более 1й роли.',
      );
    }

    const { deleteRoles, addRoles } = dto;

    if (deleteRoles && deleteRoles.length >= 1) {
      const rolesDelete = await this.prismaService.role.findMany({
        where: {
          name: {
            in: deleteRoles,
          },
        },
      });

      if (rolesDelete.length !== deleteRoles.length) {
        throw new ConflictException('Вы передали некоректный массив ролей');
      }

      const actualRolesList = user.roles.filter(
        (r) => !deleteRoles.includes(r.name),
      );

      await this.prismaService.user.update({
        where: { id },
        data: {
          roles: {
            connect: actualRolesList.map((r) => ({ name: r.name })),
          },
        },
      });

      return 
    }
  }
}
