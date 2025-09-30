import {
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
  @MaxLength(2_500, { message: 'Максимальное к-во 2500 символов' })
  taskDescription?: string;

  @IsArray({ message: 'Передайте массив пользователей' })
  @IsUUID('4', { each: true })
  executors: string[];
}
