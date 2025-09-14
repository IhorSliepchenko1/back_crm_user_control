import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'Логин - это строка' })
  @IsNotEmpty({ message: 'Обязательное поле' })
  @Length(5, 20, { message: 'Длина от 5 до 20 символов' })
  login: string;

  @IsString({ message: 'Пароль - это строка' })
  @IsNotEmpty({ message: 'Обязательное поле' })
  @Length(5, 20, { message: 'Длина от 5 до 20 символов' })
  password: string;

  @IsOptional()
  @IsString({ message: 'Админ код - это строка' })
  adminCode: string;
}
