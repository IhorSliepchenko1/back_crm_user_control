import {
  IsDate,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  name: string;

  @IsDate()
  deadline: Date;

  @IsString()
  @IsOptional()
  @MaxLength(2_500)
  taskDescription?: string;
}
