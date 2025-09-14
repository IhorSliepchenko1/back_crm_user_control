import { TaskStatus } from '@prisma/client';
import { IsOptional, MaxLength } from 'class-validator';

export class SendNotificationMessageDto {
  @MaxLength(2_500, { message: 'Максимальная длина - 2500 символов' })
  message: string;

  @MaxLength(35, { message: 'Максимальная длина - 35 символов' })
  subject: string;

  @IsOptional()
  status: TaskStatus;
}
