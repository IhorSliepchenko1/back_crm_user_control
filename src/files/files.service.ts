import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { Request, Response } from 'express';
import { JwtPayload } from 'src/token/interfaces/jwt-payload.interface';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class FilesService {
  constructor(private readonly prismaService: PrismaService) {}

  private async fileExists(filePath: string) {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async downloadsFile(req: Request, res: Response, fileName: string) {
    const { id, roles } = req.user as JwtPayload;

    const file = await this.prismaService.files.findFirst({
      where: {
        fileName,
      },

      select: {
        task: {
          select: {
            executors: true,
            project: {
              select: {
                creatorId: true,
              },
            },
          },
        },
      },
    });

    if (!file) {
      throw new NotFoundException('Данное имя файла отсутствует');
    }

    const creatorProject = file.task.project.creatorId;
    const executorsTask = file.task.executors.map((e) => e.id);
    const accessIds = [creatorProject, ...executorsTask];

    if (!accessIds.includes(id) && !roles.includes('ADMIN')) {
      throw new ForbiddenException(
        'У вас нет права доступа к скачиванию файла',
      );
    }
    const filePath = path.join(process.cwd(), 'uploads', 'tasks', fileName);
    const exists = await this.fileExists(filePath);

    if (!exists) {
      throw new NotFoundException('Файл отсутствует на сервера или был удалён');
    }

    res.download(filePath, fileName, (err) => {
      if (err) console.error('Ошибка при скачивании файла:', err);
    });
  }
}
