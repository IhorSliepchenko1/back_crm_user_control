import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTaskCreatorDto {
  @ApiProperty({
    example: 'Task_1',
    description: 'Название задачи',
  })
  @IsOptional()
  @IsString({ message: 'Название задачи - это строка' })
  @Length(5, 100, { message: 'Длина названия задачи 5-100 символов' })
  name: string;

  @ApiProperty({
    example: '2025-01-01T00:00:00.000Z',
    description: 'Дедлайн задачи',
  })
  @IsOptional()
  @IsString({ message: 'deadline - это строка' })
  deadline: string;
  // "yyyy-mm-ddT00:00:00.000Z"

  @ApiProperty({
    example: 'Задание надо сделать...',
    description: 'Описание для задачи',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2_500, { message: 'Максимальное к-во 2500 символов' })
  taskDescription?: string;

  @ApiProperty({
    example: [
      '3673c0e8-c568-4388-b871-510bbd37e0f2',
      'f49aaeae-5f9e-433f-a399-9610c8930cf5',
      'a3f4e927-e27f-4cdc-9b44-0496ce54cc38',
    ],
    description: 'Массив ID участников для добавление на задачу',
  })
  @IsOptional()
  @IsArray({ message: 'Передайте массив пользователей' })
  @IsUUID('4', { each: true })
  executorsAdd: string[];

  @ApiProperty({
    example: [
      '3673c0e8-c568-4388-b871-510bbd37e0f2',
      'f49aaeae-5f9e-433f-a399-9610c8930cf5',
      'a3f4e927-e27f-4cdc-9b44-0496ce54cc38',
    ],
    description: 'Массив ID участников для удаления с задачи',
  })
  @IsOptional()
  @IsArray({ message: 'Передайте массив пользователей' })
  @IsUUID('4', { each: true })
  executorsRemove: string[];

  @ApiProperty({
    example: ['3673c0e8-c568-4388-b871-510bbd37e0f2'],
    description: 'Массив ID файлов для удаление с задачи',
  })
  @IsOptional()
  @IsArray({ message: 'Передайте массив файлов для удаления' })
  @IsUUID('4', { each: true })
  filesIdRemove: string[];
}
