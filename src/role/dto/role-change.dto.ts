import { Roles } from '@prisma/client';
import { IsArray, IsOptional } from 'class-validator';

export class RoleChangeDto {
  @IsArray({ message: 'Список ролей - массив данных' })
  @IsOptional()
  deleteRoles: Roles[];

  @IsArray({ message: 'Список ролей - массив данных' })
  @IsOptional()
  addRoles: Roles[];
}
