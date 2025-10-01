import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { UploadFilesInterceptor } from '../interceptors/uploading-files.interceptor';

export const UseUploadFiles = (
  sizeMax: number = 5,
  countFiles: number = 5,
  mimetypes?: string[],
) =>
  applyDecorators(
    UseInterceptors(UploadFilesInterceptor(sizeMax, countFiles, mimetypes)),
  );
