import { Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { buildResponse } from 'src/common/build-response';
import { ApiResponse } from 'src/common/interfaces';
import { Role } from '@prisma/client';

@Injectable()
export class RoleService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: CreateRoleDto): Promise<ApiResponse<Role>> {
    const role = await this.prismaService.role.create({
      data: { ...dto },
    });

    return buildResponse('Новая роль создана', role);
  }
}
