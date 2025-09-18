import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class RenameProjectDto {
  @ApiProperty({
    example: 'Project_1',
    description: 'Название проекта',
  })
  @IsString({ message: 'Имя проекта - это строка' })
  @IsNotEmpty({ message: 'Обязательное поле' })
  @Length(5, 100, { message: 'Длина имени проекта от 5 - 100 символов' })
  name: string;
}
