import { IsNumber, IsOptional } from 'class-validator';

export class PaginationDto {
  @IsNumber()
  page: number;

  @IsNumber()
  limit: number;

  @IsOptional()
  @IsNumber()
  active?: boolean;

  @IsOptional()
  my?: boolean;

  @IsOptional()
  userId?: string;

  @IsOptional()
  isRead?: boolean;
}
