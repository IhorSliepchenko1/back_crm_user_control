import { IsNumber, IsOptional } from 'class-validator';

export class UsersDto {
  @IsOptional()
  @IsNumber()
  page: number;

  @IsOptional()
  @IsNumber()
  limit: number;
}
