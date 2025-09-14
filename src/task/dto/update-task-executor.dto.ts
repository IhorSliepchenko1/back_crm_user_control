import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';

export class UpdateTaskExecutorDto {
  @IsString()
  @IsOptional()
  @MaxLength(2_500, { message: 'Максимальное к-во 2500 символов' })
  executorDescription?: string;

  @IsOptional()
  @IsArray({ message: 'Передайте массив файлов для удаления' })
  @IsUUID('4', { each: true })
  filesIdRemove: string[];
}
