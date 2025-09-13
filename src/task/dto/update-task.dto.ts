import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateTaskDto {
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  deadline: string;
  // "yyyy-mm-ddT00:00:00.000Z"

  @IsString()
  @IsOptional()
  @MaxLength(2_500)
  taskDescription?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2_500)
  executorDescription?: string;

  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  executorsAdd: string[];

  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  executorsRemove: string[];
}
