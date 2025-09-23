import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

export class Participants {
  @IsArray({ message: 'Передайте массив пользователей' })
  @ArrayMinSize(1, { message: 'Минимальная длина массив - 1' })
  @ArrayMaxSize(25, { message: 'Минимальная длина массив - 25' })
  @IsUUID('4', { each: true })
  ids: string[];

  @IsNotEmpty({ message: 'Обязательное поле' })
  key: 'connect' | 'disconnect';
}
