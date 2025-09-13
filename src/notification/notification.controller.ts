import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
  @Get()
  @HttpCode(HttpStatus.OK)
  currentUserNotifications(@Body() dto: PaginationDto, @Req() req: Request) {
    return this.notificationService.currentUserNotifications(dto, req);
  }

  @Auth()
  @Get()
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
