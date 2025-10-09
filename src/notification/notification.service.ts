import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { Request } from 'express';
import { JwtPayload } from 'src/token/interfaces/jwt-payload.interface';
import { PaginationDto } from 'src/users/dto/pagination.dto';
import { buildResponse } from 'src/utils/build-response';

@Injectable()
export class NotificationService {
  constructor(private readonly prismaService: PrismaService) {}

  async currentUserNotifications(req: Request, dto: PaginationDto) {
    const { id } = req.user as JwtPayload;
    const { page, limit, isRead } = dto;

    const currentPage = page ?? 1;
    const pageSize = limit ?? 10;

    const [notifications, total, count_no_read] =
      await this.prismaService.$transaction([
        this.prismaService.notification.findMany({
          skip: (currentPage - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: 'desc' },

          where: {
            notificationRead: {
              some: {
                recipientId: id,
                isRead,
              },
            },
          },

          select: {
            id: true,
            subject: true,
            message: true,

            sender: {
              select: {
                login: true,
                id: true,
              },
            },

            recipients: true,

            task: {
              select: {
                name: true,
                id: true,
              },
            },

            notificationRead: {
              select: {
                id: true,
                recipientId: true,
                isRead: true,
              },
            },
          },
        }),

        this.prismaService.notification.count({
          where: {
            notificationRead: {
              some: {
                recipientId: id,
                isRead,
              },
            },
          },
        }),

        this.prismaService.notification.count({
          where: {
            notificationRead: {
              some: {
                recipientId: id,
                isRead: false,
              },
            },
          },
        }),
      ]);

    const notificationsData = notifications.map((notification) => {
      return {
        read_id:
          notification.notificationRead.find((f) => f.recipientId === id)?.id ||
          '',
        read_status:
          notification.notificationRead.find((f) => f.recipientId === id)
            ?.isRead || false,
        subject: notification.subject,
        message: notification.message,
        sender_name: notification.sender.login,
        sender_id: notification.sender.id,
        recipients: notification.recipients.map((r) => r.login),
        task_name: notification.task.name,
        task_id: notification.task.id,
      };
    });
    const count_pages = Math.ceil(total / limit);
    const data = {
      notifications: notificationsData,
      total,
      count_pages,
      page,
      limit,
      count_no_read,
    };
    return buildResponse('Ваши уведомления', { data });
  }
  async readNotification(idNotification: string, req: Request) {
    const { id } = req.user as JwtPayload;
    const notification = await this.prismaService.notificationRead.findUnique({
      where: {
        id: idNotification,
      },
    });

    if (!notification)
      throw new BadRequestException(
        'Вы передали несуществующий id уведомления',
      );

    if (notification && notification.recipientId !== id) {
      throw new ForbiddenException(
        'Вы передали чужой id уведомления. Отказано в доступе',
      );
    }

    if (notification.isRead) {
      throw new ConflictException('Данное сообщение уже прочитано');
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
