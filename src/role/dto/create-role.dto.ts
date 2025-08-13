import { Roles } from '@prisma/client';
import { IsString, Length } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name: Roles;

  @IsString()
  @Length(10, 100)
  descriptions: string;
}
