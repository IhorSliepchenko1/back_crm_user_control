import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  mixin,
  Type,
  BadRequestException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

export function UploadFilesInterceptor(
  sizeMax: number,
  countFiles: number = 1,
  folder: string,
  mimetypes?: string[],
): Type<NestInterceptor> {
  @Injectable()
  class MixinInterceptor implements NestInterceptor {
    private readonly interceptor: NestInterceptor;
    constructor() {
      const InterceptorClass = FilesInterceptor('files', countFiles, {
        storage: diskStorage({
          destination: `./uploads/${folder}`,
          filename: (_req, file, cb) => {
            const uniqueSuffix = Date.now();
            cb(null, `${uniqueSuffix}_file${extname(file.originalname)}`);
          },
        }),

        limits: { fileSize: sizeMax * 1024 * 1024 },

        fileFilter: (_req, file, cb) => {
          if (
            mimetypes &&
            mimetypes.length &&
            !mimetypes.includes(file.mimetype)
          ) {
            cb(new BadRequestException('Неподдерживаемый формат'), false);
          }
          cb(null, true);
        },
      });

      this.interceptor = new InterceptorClass();
    }

    async intercept(context: ExecutionContext, next: CallHandler<any>) {
      try {
        return await this.interceptor.intercept(context, next);
      } catch (error: any) {
        if (error instanceof PayloadTooLargeException) {
          throw new BadRequestException(
            `Размер файла превышает допустимый (${sizeMax}MB)`,
          );
        }
        throw new BadRequestException('Ошибка имфорта файла(ов)');
      }
    }
  }

  return mixin(MixinInterceptor);
}
