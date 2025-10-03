import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateTaskDto {
  @IsString({ message: 'Название задачи - это строка' })
  @Length(5, 30, { message: 'Длина названия задачи 5-30 символов' })
  name: string;

  @IsString({ message: 'deadline - это строка' })
  deadline: string;
  // "yyyy-mm-ddT00:00:00.000Z"

  @IsString()
  @IsOptional()
  @MaxLength(10_000, { message: 'Максимальное к-во 2500 символов' })
  taskDescription?: string;

  @IsArray({ message: 'Передайте массив пользователей' })
  @IsUUID('4', { each: true })
  @Transform(({ value }) => JSON.parse(value))
  executors: string[];
}
