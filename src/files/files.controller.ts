import {
  Controller,
  Get,
  Param,
  Res,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { FilesService } from './files.service';
import { Auth } from 'src/auth/decorators/auth.decorator';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Auth()
  @Get('download/:fileName')
  @HttpCode(HttpStatus.OK)
  async downloadFile(
    @Res() res: Response,
    @Req() req: Request,
    @Param('fileName') fileName: string,
  ) {
     await this.filesService.downloadsFile(req, res, fileName);
  }
}
