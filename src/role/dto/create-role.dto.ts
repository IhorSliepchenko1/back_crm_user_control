import { Roles } from '@prisma/client';
import { IsString, Length } from 'class-validator';

export class CreateRoleDto {
  @IsString({ message: 'Имя роль - это строка' })
  name: Roles;

  @IsString({ message: 'Описание роль - это строка' })
  @Length(10, 100, { message: 'Длина от 10 до 100 символов' })
  descriptions: string;
}
