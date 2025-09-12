import {
  IsArray,
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

  @IsString()
  deadline: string;
  // "yyyy-mm-ddT00:00:00.000Z"

  @IsString()
  @IsOptional()
  @MaxLength(2_500)
  taskDescription?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  executors: string[];
}
