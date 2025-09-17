import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';
import { IsOptional, MaxLength } from 'class-validator';

export class SendNotificationMessageDto {
  @ApiProperty({
    example: 'Я выполнил задачу, будь-те добры, проверьте её. Спасибо!',
    description: 'Текст уведомления',
  })
  @MaxLength(2_500, { message: 'Максимальная длина - 2500 символов' })
  message: string;

  @ApiProperty({
    example: 'Проверка задачи',
    description: 'Тема уведомления',
  })
  @MaxLength(35, { message: 'Максимальная длина - 35 символов' })
  subject: string;

  @ApiProperty({
    example: 'IN_REVIEW',
    description: 'Статус выполнения задачи',
  })
  @IsOptional()
  status: TaskStatus;
}
