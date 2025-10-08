import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserByIdDto {
  @IsOptional()
  @IsString({ message: 'Логин - это строка' })
  @Length(5, 20, { message: 'Длина от 5 до 20 символов' })
  login?: string;

  @IsOptional()
  @IsString({ message: 'Пароль - это строка' })
  @Length(5, 20, { message: 'Длина от 5 до 20 символов' })
  newPassword?: string;

  @IsOptional()
  @IsString({ message: 'Пароль - это строка' })
  @Length(5, 20, { message: 'Длина от 5 до 20 символов' })
  oldPassword?: string;
}
