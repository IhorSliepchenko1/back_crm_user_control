import { TaskStatus } from '@prisma/client';
import { IsOptional, MaxLength } from 'class-validator';

export class SendNotificationMessageDto {
  @MaxLength(2_500)
  message: string;

  @IsOptional()
  status: TaskStatus;
}
