import { Injectable } from '@nestjs/common';

@Injectable()
export class FileUploadService {
  seveFile(file: Express.Multer.File) {
    return file.filename;
  }
}
