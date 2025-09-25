import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Req() req: Request,
  ) {
    return this.notificationService.currentUserNotifications(
      { page, limit },
      req,
    );
  }

  @Auth()
  @Get('count-no-read')
  @HttpCode(HttpStatus.OK)
  countNoReadNotifications(@Req() req: Request) {
    return this.notificationService.countNoReadNotifications(req);
  }

  @Auth()
  @Patch('read/:id')
  @HttpCode(HttpStatus.OK)
  readNotification(@Param('id') id: string, @Req() req: Request) {
    return this.notificationService.readNotification(id, req);
  }
}
