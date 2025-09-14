import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import type { Request } from 'express';
import { PaginationDto } from 'src/users/dto/pagination.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Auth()
  @Get('me')
  @HttpCode(HttpStatus.OK)
  currentUserNotifications(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Req() req: Request,
  ) {
    const dto = { page: +page, limit: +limit };
    return this.notificationService.currentUserNotifications(dto, req);
  }

  @Auth()
  @Get('count-no-read-notification/me')
  @HttpCode(HttpStatus.OK)
  countNoReadNotifications(@Req() req: Request) {
    return this.notificationService.countNoReadNotifications(req);
  }

  @Auth()
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  readNotification(@Param('id') id: string, @Req() req: Request) {
    return this.notificationService.readNotification(id, req);
  }
}
