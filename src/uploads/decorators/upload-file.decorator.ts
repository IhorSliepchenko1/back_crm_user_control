import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { UploadFilesInterceptor } from '../interceptors/uploading-files.interceptor';

export const UseUploadFiles = (
  sizeMax: number = 15,
  countFiles: number = 5,
  mimetypes?: Array<string>,
) =>
  applyDecorators(
    UseInterceptors(UploadFilesInterceptor(sizeMax, countFiles, mimetypes)),
  );
