import { TaskStatus } from '@prisma/client';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class PaginationTaskDto {
  @IsNumber()
  page: number;

  @IsNumber()
  limit: number;

  @IsOptional()
  projectId: string;

  @IsString()
  @IsOptional()
  status?: TaskStatus;

  @IsString()
  @IsOptional()
  deadlineFrom?: string;

  @IsString()
  @IsOptional()
  deadlineTo?: string;
}
