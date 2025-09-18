import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class RenameUserDto {
  @ApiProperty({
    example: 'USER_1',
    description: 'Новый логин',
  })
  @IsString({ message: 'Логин - это строка' })
  @IsNotEmpty({ message: 'Обязательное поле' })
  @Length(5, 20, { message: 'Длина от 5 до 20 символов' })
  login: string;
}
