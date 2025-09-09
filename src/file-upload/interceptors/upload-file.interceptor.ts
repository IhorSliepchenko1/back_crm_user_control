import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  mixin,
  NestInterceptor,
  Type,
} from '@nestjs/common';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { FileInterceptor } from '@nestjs/platform-express';

export function UploadFileInterceptor(
  allowedTypes: string[],
  sizeMax: number,
  ext: string = 'webp',
  fieldName: string = 'file',
): Type<NestInterceptor> {
  @Injectable()
  class MixinInterceptor implements NestInterceptor {
    private readonly interceptor: NestInterceptor;
    constructor() {
      const InterceptorClass = FileInterceptor(fieldName, {
        storage: diskStorage({
          destination: (_req, _file, cb) => {
            cb(null, './uploads');
          },

          filename: (_req, file, cb) => {
            const { fieldname, originalname } = file;
            const UUID = uuidv4();
            const filename = `${fieldname}_${originalname}_${UUID}.${ext}`;
            cb(null, filename);
          },
        }),

        fileFilter: (_req, file, cb) => {
          const acceptFile = allowedTypes.includes(file.mimetype);
          const error = acceptFile
            ? null
            : new BadRequestException(
                `Используйте только типы файлов: ${allowedTypes.join(',')}`,
              );
          cb(error, acceptFile);
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
