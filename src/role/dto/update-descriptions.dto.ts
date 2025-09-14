import { IsString, Length } from 'class-validator';

export class UpdateDescriptionsDto {
  @IsString({ message: 'Описание роль - это строка' })
  @Length(10, 100, { message: 'Длина от 10 до 100 символов' })
  descriptions: string;
}
