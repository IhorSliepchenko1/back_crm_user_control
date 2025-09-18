import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

export class Participants {
  @ApiProperty({
    example: [
      '3673c0e8-c568-4388-b871-510bbd37e0f2',
      'f49aaeae-5f9e-433f-a399-9610c8930cf5',
      'a3f4e927-e27f-4cdc-9b44-0496ce54cc38',
    ],
    description: 'Массив ID участников проекта',
  })
  @IsArray({ message: 'Передайте массив пользователей' })
  @ArrayMinSize(1, { message: 'Минимальная длина массив - 1' })
  @ArrayMaxSize(25, { message: 'Минимальная длина массив - 25' })
  @IsUUID('4', { each: true })
  ids: string[];

  @ApiProperty({
    example: 'connect',
    description: 'Статус действия добавить или удалить участников проекта',
  })
  @IsNotEmpty({ message: 'Обязательное поле' })
  key: 'connect' | 'disconnect';
}
