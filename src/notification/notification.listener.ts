import { OnEvent } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { NotificationPayload } from './interfaces/notification-payload.interface';
import { NotificationsGateway } from 'src/gateways/notification.gateway';

@Injectable()
export class NotificationListener {
  constructor(
    private readonly prismaService: PrismaService,
    private gateway: NotificationsGateway,
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

      this.gateway.sendNotification(userId, {
        subject,
        message,
      });
    }

    return notification.id;
  }
}
