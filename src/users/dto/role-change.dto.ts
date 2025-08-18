import { Roles } from '@prisma/client';
import { IsArray, IsOptional } from 'class-validator';

export class RoleChangeDto {
  @IsArray()
  @IsOptional()
  deleteRoles: Roles[];

  @IsArray()
  @IsOptional()
  addRoles: Roles[];
}
