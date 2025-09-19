import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  mixin,
  Type,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

export function UploadFilesInterceptor(
  sizeMax: number,
  countFiles: number = 1,
  mimetypes?: Array<string>,
): Type<NestInterceptor> {
  @Injectable()
  class MixinInterceptor implements NestInterceptor {
    private readonly interceptor: NestInterceptor;
    constructor() {
      const InterceptorClass = FilesInterceptor('files', countFiles, {
        storage: diskStorage({
          destination: './uploads',
          filename: (_req, file, cb) => {
            const uniqueSuffix = Date.now();
            cb(null, `${uniqueSuffix}_${file.originalname}`);
          },
        }),

        fileFilter: (req, file, cb) => {
          if (mimetypes?.length) {
            if (!mimetypes.includes(file.mimetype)) {
              cb(new BadRequestException('Неподдерживаемый формат'), false);
            } else {
              cb(null, true);
            }
          }
        },

        limits: { fileSize: sizeMax * 1024 * 1024 },
      });

      this.interceptor = new InterceptorClass();
    }

    intercept(context: ExecutionContext, next: CallHandler<any>) {
      return this.interceptor.intercept(context, next);
    }
  }

  return mixin(MixinInterceptor);
}
