import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserByIdDto {
  @IsOptional()
  @IsString({ message: 'Логин - это строка' })
  @Length(5, 20, { message: 'Длина от 5 до 20 символов' })
  login?: string;

  @IsOptional()
  @IsString()
  @Length(5, 20)
  newPassword?: string;

  @IsOptional()
  @IsString()
  @Length(5, 20)
  oldPassword?: string;
}
