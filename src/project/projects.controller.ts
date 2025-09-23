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
import { Auth } from 'src/auth/decorators/auth.decorator';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectService: ProjectsService) {}

  @Auth()
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createProject(@Body() dto: ProjectDto, @Req() req: Request) {
    return await this.projectService.createProject(dto, req);
  }

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

  @Auth()
  @Patch('is-active/:id')
  @HttpCode(HttpStatus.OK)
  async isActive(@Param('id') id: string, @Req() req: Request) {
    return await this.projectService.isActive(id, req);
  }

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
