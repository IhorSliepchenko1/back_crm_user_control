import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { AuthRoles } from 'src/auth/decorators/auth-roles.decorator';
import { ProjectDto } from './dto/project.dto';
import { User } from 'src/auth/decorators/user.decorator';
import type { JwtPayload } from 'src/token/interfaces/jwt-payload.interface';
import { Participants } from './dto/participants.dto';
import { Projects } from './dto/projects.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectService: ProjectsService) {}

  @AuthRoles('ADMIN')
  @Post('')
  @HttpCode(HttpStatus.CREATED)
  async createProject(@Body() dto: ProjectDto, @User() user: JwtPayload) {
    return await this.projectService.createProject(dto, user.id);
  }

  @AuthRoles('ADMIN')
  @Patch('rename/:id')
  @HttpCode(HttpStatus.OK)
  async renameProject(@Param('id') id: string, @Body() dto: ProjectDto) {
    return await this.projectService.renameProject(dto, id);
  }

  @AuthRoles('ADMIN')
  @Patch(':id/participants')
  @HttpCode(HttpStatus.OK)
  async participantsProject(
    @Param('id') id: string,
    @Body() dto: Participants,
  ) {
    return await this.projectService.participantsProject(dto, id);
  }

  @AuthRoles('ADMIN')
  @Patch(':id/active')
  @HttpCode(HttpStatus.OK)
  async isActive(@Param('id') id: string) {
    return await this.projectService.isActive(id);
  }

  @AuthRoles('ADMIN')
  @Get()
  @HttpCode(HttpStatus.OK)
  async projects(@Body() dto: Projects) {
    return await this.projectService.projects(dto);
  }
}
