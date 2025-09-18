import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

export class ProjectDto {
  @ApiProperty({
    example: 'Project_1',
    description: 'Название проекта',
  })
  @IsString({ message: 'Имя проекта - это строка' })
  @IsNotEmpty({ message: 'Обязательное поле' })
  @Length(5, 100, { message: 'Длина имени проекта от 5 - 100 символов' })
  name: string;

  @ApiProperty({
    example: [
      '3673c0e8-c568-4388-b871-510bbd37e0f2',
      'f49aaeae-5f9e-433f-a399-9610c8930cf5',
      'a3f4e927-e27f-4cdc-9b44-0496ce54cc38',
    ],
    description: 'Массив ID участников проекта',
  })
  @IsArray({ message: 'Передайте массив участников проекта' })
  @IsUUID('4', { each: true })
  participants: string[];
}
