import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prismaService: PrismaService) {}

  async sendNotification(
    taskId: string,
    senderId: string,
    recipients: Array<string>,
    message: string,
  ) {
    const notification = await this.prismaService.notification.create({
      data: {
        message,
        senderId,
        taskId,
        recipients: {
          connect: recipients.map((id) => ({ id })),
        },
      },
    });

    return notification.id;
  }
}
