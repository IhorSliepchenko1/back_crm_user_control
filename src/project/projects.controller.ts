import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { AuthRoles } from 'src/auth/decorators/auth-roles.decorator';
import { ProjectDto } from './dto/project.dto';
import type { Request } from 'express';
import { Participants } from './dto/participants.dto';
import { RenameProjectDto } from './dto/rename-project.dto';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectService: ProjectsService) {}

  @ApiOperation({
    summary: 'Создание проекта',
  })
  @ApiOkResponse({
    description: 'Новый проект добавлен',
    schema: {
      example: { success: true, message: 'Новый проект добавлен' },
    },
  })
  @ApiBadRequestResponse({
    description: 'Пользователи переданные вам не все содержаться на сервере',
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @ApiNotFoundResponse({ description: 'Пользователь не обнаружен' })
  @Auth()
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createProject(@Body() dto: ProjectDto, @Req() req: Request) {
    return await this.projectService.createProject(dto, req);
  }

  @ApiOperation({
    summary: 'Переименование проекта',
  })
  @ApiOkResponse({
    description: 'Проект переименован',
    schema: {
      example: { success: true, message: 'Проект переименован' },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @ApiForbiddenResponse({
    description:
      'Право менять название проекта есть только у создателя проекта',
  })
  @ApiNotFoundResponse({ description: 'Пользователь не обнаружен' })
  @Auth()
  @Patch('rename/:id')
  @HttpCode(HttpStatus.OK)
  async renameProject(
    @Param('id') id: string,
    @Body() dto: RenameProjectDto,
    @Req() req: Request,
  ) {
    return await this.projectService.renameProject(dto, id, req);
  }

  @ApiOperation({
    summary: 'Манипуляция с участниками проекта',
  })
  @ApiOkResponse({
    description: 'Участники проекта обновлены',
    schema: {
      example: { success: true, message: 'Участники проекта обновлены' },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @ApiForbiddenResponse({
    description:
      'Право менять участников проекта есть только у создателя проекта',
  })
  @ApiNotFoundResponse({ description: 'Пользователь не обнаружен' })
  @Auth()
  @Patch('participants/:id')
  @HttpCode(HttpStatus.OK)
  async participantsProject(
    @Param('id') id: string,
    @Body() dto: Participants,
    @Req() req: Request,
  ) {
    return await this.projectService.participantsProject(dto, id, req);
  }

  @ApiOperation({
    summary: 'Манипуляция со статусом проекта',
  })
  @ApiOkResponse({
    description: 'Статус проекта обновлён',
    schema: {
      example: { success: true, message: 'Статус проекта обновлён' },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @ApiForbiddenResponse({
    description: 'Право менять статус проекта есть только у создателя проекта',
  })
  @ApiNotFoundResponse({ description: 'Пользователь не обнаружен' })
  @Auth()
  @Patch('is-active/:id')
  @HttpCode(HttpStatus.OK)
  async isActive(@Param('id') id: string, @Req() req: Request) {
    return await this.projectService.isActive(id, req);
  }

  @ApiOperation({
    summary: 'Список проектов',
  })
  @ApiOkResponse({
    description: 'Данные получены',
    schema: {
      example: {
        success: true,
        message: 'Данные получены',
        data: [
          {
            name: 'Колл-Центр-12',
            count_tasks: 5,
            done_tasks: 1,
            in_reviews_tasks: 1,
            in_progress_tasks: 3,
            creator: 'ADMINISTRATOR_1',
            created_ad: '2025-09-14T09:17:46.151Z',
            count_participants: 5,
            is_active: false,
          },
          {
            name: 'Test Project',
            count_tasks: 1,
            done_tasks: 0,
            in_reviews_tasks: 0,
            in_progress_tasks: 1,
            creator: 'MAIN_ADMIN',
            created_ad: '2025-09-11T13:19:03.943Z',
            count_participants: 3,
            is_active: false,
          },
        ],
        total: 2,
        count_pages: 1,
        page: 1,
        limit: 10,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'У вас недостаточно прав доступа',
  })
  @ApiForbiddenResponse({
    description: 'Право менять статус проекта есть только у создателя проекта',
  })
  @ApiNotFoundResponse({ description: 'Пользователь не обнаружен' })
  @AuthRoles('ADMIN')
  @Get('all')
  @HttpCode(HttpStatus.OK)
  async projects(
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('active', ParseBoolPipe) active: boolean,
  ) {
    return await this.projectService.projects({ page, limit, active });
  }
}
