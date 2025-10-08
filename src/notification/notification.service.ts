import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { Request } from 'express';
import { JwtPayload } from 'src/token/interfaces/jwt-payload.interface';
import { PaginationDto } from 'src/users/dto/pagination.dto';
import { buildResponse } from 'src/utils/build-response';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UsersService,
  ) {}

  async currentUserNotifications(dto: PaginationDto, req: Request) {
    const { id } = req.user as JwtPayload;

    await this.userService.findUser(id);

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
    return buildResponse('Ваши уведомления', {
      data,
      total,
      count_pages,
      page,
      limit,
    });
  }
  async countNoReadNotifications(req: Request) {
    const { id } = req.user as JwtPayload;

    await this.userService.findUser(id);

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

    await this.userService.findUser(id);

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
      throw new ForbiddenException();
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
