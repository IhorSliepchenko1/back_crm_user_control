import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationListener } from './notification.listener';
import { UsersModule } from 'src/users/users.module';
import { GatewaysModule } from 'src/gateways/gateways.module';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, NotificationListener],
  exports: [NotificationService],
  imports: [UsersModule, GatewaysModule],
})
export class NotificationModule {}
