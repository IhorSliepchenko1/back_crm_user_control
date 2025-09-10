import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { JwtPayload } from 'src/token/interfaces/jwt-payload.interface';
import { Request } from 'express';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { buildResponse } from 'src/common/utils/build-response';

@Injectable()
export class TaskService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly uploadsService: FileUploadService,
  ) {}

  async createTask(
    dto: CreateTaskDto,
    req: Request,
    projectId: string,
    file: Express.Multer.File,
  ) {
    const { id: executorId } = req.user as JwtPayload;

    let filePathTask: string | null = null;

    if (file) {
      filePathTask = this.uploadsService.seveFile(file);
    }

    const newTask = await this.prismaService.task.create({
      data: {
        ...dto,
        filePathTask,
        projectId,
        executorId,
      },
    });

    return buildResponse('Новая задача добавлена');
  }
}
