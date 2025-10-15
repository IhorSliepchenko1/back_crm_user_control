import cookieParser from 'cookie-parser';
import * as fs from 'fs';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: process.env.FRONT_URL,
    credentials: true,
  });

  app.use(cookieParser());

  const uploads = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploads)) {
    await fs.promises.mkdir(uploads, { recursive: true });
  }

  app.useStaticAssets(path.join(uploads, 'avatars'), {
    prefix: '/avatars/',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  const PORT = process.env.PORT ?? 3000;
  await app.listen(PORT);
}
bootstrap();
