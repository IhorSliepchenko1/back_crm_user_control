import { ApiProperty } from '@nestjs/swagger';
import { Roles } from '@prisma/client';
import { IsArray, IsOptional } from 'class-validator';

export class RoleChangeDto {
  @ApiProperty({
    example: ['ADMIN'],
    description: 'Массив для удаления какой то из ролей',
  })
  @IsArray({ message: 'Список ролей - массив данных' })
  @IsOptional()
  deleteRoles: Roles[];

  @ApiProperty({
    example: ['ADMIN'],
    description: 'Массив для добавления какой то из ролей',
  })
  @IsArray({ message: 'Список ролей - массив данных' })
  @IsOptional()
  addRoles: Roles[];
}
