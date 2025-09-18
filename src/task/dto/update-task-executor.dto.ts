import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTaskExecutorDto {
  @ApiProperty({
    example: 'Задание было выполено...',
    description: 'Описание выполнения задачи',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2_500, { message: 'Максимальное к-во 2500 символов' })
  executorDescription?: string;

  @ApiProperty({
    example: ['3673c0e8-c568-4388-b871-510bbd37e0f2'],
    description: 'Массив ID файлов для удаление с задачи',
  })
  @IsOptional()
  @IsArray({ message: 'Передайте массив файлов для удаления' })
  @IsUUID('4', { each: true })
  filesIdRemove: string[];
}
