import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import type { Request } from 'express';
import { Auth } from 'src/auth/decorators/auth.decorator';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}
  @Auth()
  @Get('all')
  @HttpCode(HttpStatus.OK)
  currentUserNotifications(
    @Req() req: Request,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('isRead', ParseBoolPipe) isRead: boolean,
  ) {
    return this.notificationService.currentUserNotifications(req, {
      page,
      limit,
      isRead,
    });
  }

  @Auth()
  @Patch('read/:id')
  @HttpCode(HttpStatus.OK)
  readNotification(@Param('id') id: string, @Req() req: Request) {
    return this.notificationService.readNotification(id, req);
  }
}
