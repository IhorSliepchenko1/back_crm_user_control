import { OnEvent } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { NotificationPayload } from './interfaces/notification-payload.interface';
import { AppGateway } from 'src/gateway/app.gateway';

@Injectable()
export class NotificationListener {
  constructor(
    private readonly prismaService: PrismaService,
    private appGateway: AppGateway,
  ) {}

  @OnEvent('notification.send')
  async sendNotification(payload: NotificationPayload) {
    const { taskId, senderId, recipients, message, subject } = payload;

    const notification = await this.prismaService.notification.create({
      data: {
        message,
        subject,
        senderId,
        taskId,
        recipients: {
          connect: recipients.map((id) => ({ id })),
        },
      },
    });

    await this.prismaService.$transaction(
      recipients.map((id) =>
        this.prismaService.notificationRead.create({
          data: {
            recipientId: id,
            notificationId: notification.id,
          },
        }),
      ),
    );

    for (const userId of recipients) {
      if (senderId === userId) continue;
      this.appGateway.sendNotification(userId, {
        subject,
        message,
        types: ['NOTIFICATION', 'TRIGGER_TASKS'],
      });
    }

    return notification.id;
  }
}
