import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ChangePassword {
  @ApiProperty({
    example: '12345***',
    description: 'Новый пароль',
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 20)
  newPassword: string;

  @ApiProperty({
    example: '12345***',
    description: 'Текущий пароль',
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 20)
  oldPassword: string;
}
