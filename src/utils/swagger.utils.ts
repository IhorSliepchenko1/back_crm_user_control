import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationModule } from 'src/notification/notification.module';
import { ProjectsModule } from 'src/project/projects.module';
import { RoleModule } from 'src/role/role.module';
import { TaskModule } from 'src/task/task.module';
import { TokenModule } from 'src/token/token.module';
import { UsersModule } from 'src/users/users.module';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('SLP CRM-SYSTEM')
    .setDescription('CRM - контроль задач и коммуникация с сотрудниками')
    .setVersion('1.0.0')
    .addCookieAuth('refreshToken')
    .setContact(
      'Ihor',
      'https://cv-sliepchenko.pages.dev',
      'slp.i008511586@gmail.com',
    )

    .build();

  const document = SwaggerModule.createDocument(app, config, {
    include: [
      AuthModule,
      NotificationModule,
      ProjectsModule,
      RoleModule,
      TaskModule,
      TokenModule,
      UsersModule,
    ],
  });

  SwaggerModule.setup('swagger', app, document);
}
