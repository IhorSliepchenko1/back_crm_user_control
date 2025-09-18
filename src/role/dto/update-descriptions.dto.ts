import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class UpdateDescriptionsDto {
  @ApiProperty({
    example: 'Роль для выполнения задач связанных с админ-действиями',
    description: 'Новое описание роли',
  })
  @IsString({ message: 'Описание роль - это строка' })
  @Length(10, 100, { message: 'Длина от 10 до 100 символов' })
  descriptions: string;
}
