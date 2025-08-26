import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from '@prisma/client';
import { ApiResponse } from 'src/common/interfaces';
import { buildResponse } from 'src/common/utils/build-response';
import { UpdateDescriptionsDto } from './dto/update-descriptions.dto';

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
}
