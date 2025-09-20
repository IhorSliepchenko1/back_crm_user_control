import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadsService {
  seveFiles(files: Array<Express.Multer.File>) {
    return files.map((file) => file.filename);
  }
}
