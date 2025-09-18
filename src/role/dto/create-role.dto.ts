import { ApiProperty } from '@nestjs/swagger';
import { Roles } from '@prisma/client';
import { IsString, Length } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    example: 'ADMIN',
    description: 'Название роли',
  })
  @IsString({ message: 'Имя роль - это строка' })
  name: Roles;

  @ApiProperty({
    example: 'Роль для выполнения задач связанных с админ-действиями',
    description: 'Описание задач и прав роли',
  })
  @IsString({ message: 'Описание роль - это строка' })
  @Length(10, 100, { message: 'Длина от 10 до 100 символов' })
  descriptions: string;
}
