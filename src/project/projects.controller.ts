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

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectService: ProjectsService) {}

  @AuthRoles('ADMIN')
  @Post('')
  @HttpCode(HttpStatus.CREATED)
  async createProject(@Body() dto: ProjectDto, @Req() req: Request) {
    return await this.projectService.createProject(dto, req);
  }

  @AuthRoles('ADMIN')
  @Patch('rename/:id')
  @HttpCode(HttpStatus.OK)
  async renameProject(@Param('id') id: string, @Body() dto: RenameProjectDto) {
    return await this.projectService.renameProject(dto, id);
  }

  @AuthRoles('ADMIN')
  @Patch('participants/:id')
  @HttpCode(HttpStatus.OK)
  async participantsProject(
    @Param('id') id: string,
    @Body() dto: Participants,
  ) {
    return await this.projectService.participantsProject(dto, id);
  }

  @AuthRoles('ADMIN')
  @Patch('is-active/:id')
  @HttpCode(HttpStatus.OK)
  async isActive(@Param('id') id: string) {
    return await this.projectService.isActive(id);
  }

  @AuthRoles('ADMIN')
  @Get()
  @HttpCode(HttpStatus.OK)
  async projects(
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('active', ParseBoolPipe) active: boolean,
  ) {
    return await this.projectService.projects({ page, limit, active });
  }
}
