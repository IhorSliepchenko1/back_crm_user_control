import { TaskStatus } from '@prisma/client';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';

export class UpdateTaskCreatorDto {
  @IsOptional()
  @IsString({ message: 'Название задачи - это строка' })
  @Length(5, 100, { message: 'Длина названия задачи 5-100 символов' })
  name: string;

  @IsOptional()
  @IsString({ message: 'deadline - это строка' })
  deadline: string;
  // "yyyy-mm-ddT00:00:00.000Z"

  @IsString()
  @IsOptional()
  @MaxLength(2_500, { message: 'Максимальное к-во 2500 символов' })
  taskDescription?: string;

  @IsOptional()
  @IsArray({ message: 'Передайте массив пользователей' })
  @IsUUID('4', { each: true })
  executorsAdd: string[];

  @IsOptional()
  @IsArray({ message: 'Передайте массив пользователей' })
  @IsUUID('4', { each: true })
  executorsRemove: string[];
}
