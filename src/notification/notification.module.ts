import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationListener } from './notification.listener';
import { UsersModule } from 'src/users/users.module';
import { AppGateway } from 'src/gateway/app.gateway';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, NotificationListener, AppGateway],
  exports: [NotificationService],
  imports: [UsersModule],
})
export class NotificationModule {}
