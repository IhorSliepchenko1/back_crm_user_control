import { IsNotEmpty, IsString, Length } from 'class-validator';

export class RenameProjectDto {
  @IsString({ message: 'Имя проекта - это строка' })
  @IsNotEmpty({ message: 'Обязательное поле' })
  @Length(5, 50, { message: 'Длина имени проекта от 5 - 50 символов' })
  name: string;
}
