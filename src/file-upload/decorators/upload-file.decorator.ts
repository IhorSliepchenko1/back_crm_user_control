import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { UploadFileInterceptor } from '../interceptors/upload-file.interceptor';

export const UseUploadFile = (
  allowedTypes: string[],
  sizeMax: number,
  ext: string,
  fieldName: string = 'file',
) =>
  applyDecorators(
    UseInterceptors(
      UploadFileInterceptor(allowedTypes, sizeMax, ext, fieldName),
    ),
  );
