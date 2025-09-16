import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { Request } from 'express';
import { JwtPayload } from 'src/token/interfaces/jwt-payload.interface';
import { PaginationDto } from 'src/users/dto/pagination.dto';
import { buildResponse } from 'src/utils/build-response';

@Injectable()
export class NotificationService {
  constructor(private readonly prismaService: PrismaService) {}

  async currentUserNotifications(dto: PaginationDto, req: Request) {
    const { id } = req.user as JwtPayload;

    const { page, limit } = dto;

    const currentPage = page ?? 1;
    const pageSize = limit ?? 10;

    const [notifications, total] = await this.prismaService.$transaction([
      this.prismaService.notification.findMany({
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },

        where: {
          recipients: {
            some: {
              id,
            },
          },
        },

        select: {
          subject: true,
          message: true,
          senderId: true,
          recipients: true,
          taskId: true,
          notificationRead: {
            select: {
              isRead: true,
            },
          },
        },
      }),

      this.prismaService.notification.count({
        where: {
          recipients: {
            some: {
              id,
            },
          },
        },
      }),
    ]);

    const data = notifications.map((notification) => {
      return {
        subject: notification.subject,
        message: notification.message,
        senderId: notification.senderId,
        recipients: notification.recipients.map((r) => r.login),
        taskId: notification.taskId,
        isRead: notification.notificationRead[0].isRead,
      };
    });
    const count_pages = Math.ceil(total / limit);
    return buildResponse('', {
      data,
      total,
      count_pages,
      page,
      limit,
    });
  }

  async countNoReadNotifications(req: Request) {
    const { id } = req.user as JwtPayload;

    const count = await this.prismaService.notificationRead.count({
      where: {
        recipientId: id,
        isRead: false,
      },
    });

    return buildResponse('Не прочитанные уведомления', {
      count,
    });
  }

  async readNotification(idNotification: string, req: Request) {
    const { id } = req.user as JwtPayload;

    const notification = await this.prismaService.notificationRead.findUnique({
      where: {
        id: idNotification,
      },
    });

    if (notification && notification.recipientId !== id) {
      throw new ForbiddenException(
        'Отказано в доступе, скорее всего вы ошибочно пытаетесь отредактировать чужое уведомление',
      );
    }

    await this.prismaService.notificationRead.update({
      where: { id: idNotification },
      data: {
        isRead: true,
      },
    });

    return buildResponse('Уведомление прочитано');
  }
}
