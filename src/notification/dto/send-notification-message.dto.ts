import { TaskStatus } from '@prisma/client';
import { IsOptional } from 'class-validator';

export class SendNotificationMessageDto {
  @IsOptional()
  status: TaskStatus;
}
