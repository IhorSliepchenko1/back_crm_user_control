import cookieParser from 'cookie-parser';
import * as fs from 'fs';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { MulterExceptionFilter } from './file-upload/filters/multer-exeption.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(cookieParser());

  const uploads = path.join(process.cwd(), 'uploads');

  if (!fs.existsSync(uploads)) {
    await fs.promises.mkdir(uploads, { recursive: true });
  }

  app.useStaticAssets(uploads);
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new MulterExceptionFilter());
  app.useGlobalFilters(new HttpExceptionFilter());

  const PORT = process.env.PORT ?? 3000;
  await app.listen(PORT);
}
bootstrap();
