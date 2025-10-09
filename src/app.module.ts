import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TokenModule } from './token/token.module';
import { RoleModule } from './role/role.module';
import { UsersModule } from './users/users.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { LoggerModule } from './common/logger/logger.module';
import { ProjectsModule } from './project/projects.module';
import { TaskModule } from './task/task.module';
import { NotificationModule } from './notification/notification.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FilesModule } from './files/files.module';
import { AppGateway } from './gateway/app.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
    }),
    PrismaModule,
    AuthModule,
    TokenModule,
    RoleModule,
    UsersModule,
    LoggerModule,
    ProjectsModule,
    TaskModule,
    NotificationModule,
    FilesModule,
  ],

  controllers: [AppController],
  providers: [AppService, AppGateway],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
