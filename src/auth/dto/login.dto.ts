import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user_login_1',
    description: 'Логин для входа в аккаунт',
  })
  @IsString({ message: 'Логин - это строка' })
  @IsNotEmpty({ message: 'Обязательное поле' })
  @Length(5, 20, { message: 'Длина от 5 до 20 символов' })
  login: string;

  @ApiProperty({
    example: '*****1',
    description: 'Пароль для входа в аккаунт',
  })
  @IsString({ message: 'Пароль - это строка' })
  @IsNotEmpty({ message: 'Обязательное поле' })
  @Length(5, 20, { message: 'Длина от 5 до 20 символов' })
  password: string;

  @ApiProperty({
    example: true,
    description:
      'Статус длительности жизни сессии, true = 30 дней, false = 1 день',
  })
  @IsOptional()
  @IsBoolean({ message: 'Поле `запомнить меня` - boolean значение' })
  remember: boolean;
}
