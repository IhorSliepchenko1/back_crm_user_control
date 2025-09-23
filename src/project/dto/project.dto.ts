import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class ProjectDto {
  @IsString({ message: 'Имя проекта - это строка' })
  @IsNotEmpty({ message: 'Обязательное поле' })
  @Length(5, 100, { message: 'Длина имени проекта от 5 - 100 символов' })
  name: string;

  @IsArray({ message: 'Передайте массив участников проекта' })
  @IsUUID('4', { each: true })
  @ArrayMaxSize(15, { message: 'Максимум 15 пользователей' })
  @ArrayMinSize(1, { message: 'Минимальное к-во участников проекта - 1' })
  participants: string[];
}
