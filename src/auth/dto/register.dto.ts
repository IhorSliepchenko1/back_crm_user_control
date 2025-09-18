import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'user_login_1',
    description: 'Логин для входа в аккаунт',
  })
  @IsString({ message: 'Логин - это строка' })
  @IsNotEmpty({ message: 'Обязательное поле' })
  @Length(5, 20, { message: 'Длина логина от 5 до 20 символов' })
  login: string;

  @ApiProperty({
    example: '*****1',
    description: 'Пароль для входа в аккаунт',
  })
  @IsString({ message: 'Пароль - это строка' })
  @IsNotEmpty({ message: 'Обязательное поле' })
  @Length(5, 20, { message: 'Длина пароля от 5 до 20 символов' })
  password: string;

  @ApiProperty({
    example: '123456',
    description:
      'Что бы зарегистрировать аккаунт с правами ADMIN, необходимо ввести ADMIN-CODE',
  })
  @IsOptional()
  @IsString({ message: 'Админ код - это строка' })
  adminCode: string;
}
