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
  Put,
  Query,
  Req,
  UploadedFiles,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthRoles } from 'src/auth/decorators/auth-roles.decorator';
import { Auth } from 'src/auth/decorators/auth.decorator';
import type { Request } from 'express';

import { UseUploadFiles } from 'src/uploads/decorators/upload-file.decorator';
import { UpdateUserByIdDto } from './dto/update-user-by-id.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Auth()
  @Get('')
  @HttpCode(HttpStatus.OK)
  async users(
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('active', ParseBoolPipe) active: boolean,
    @Req() req: Request,
  ) {
    return await this.usersService.users({ page, limit, active }, req);
  }

  @Auth()
  @Get('user/:id')
  @HttpCode(HttpStatus.OK)
  async user(@Param('id') id: string, @Req() req: Request) {
    return await this.usersService.user(id, req);
  }

  @AuthRoles('ADMIN')
  @Patch('is-active/:id')
  @HttpCode(HttpStatus.OK)
  async isActive(@Param('id') id: string, @Req() req: Request) {
    return await this.usersService.isActive(id, req);
  }

  @Auth()
  @Put('update-user/:id')
  @HttpCode(HttpStatus.OK)
  @UseUploadFiles(1, 1, ['image/jpeg', 'image/png', 'image/webp'])
  async updateUserById(
    @Body() dto: UpdateUserByIdDto,
    @Param('id') id: string,
    @Req() req: Request,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return await this.usersService.updateUserById(dto, id, req, files);
  }

  @Auth()
  @Get('for-project')
  @HttpCode(HttpStatus.OK)
  async usersForProject(@Req() req: Request) {
    return await this.usersService.usersForProject(req);
  }
}
