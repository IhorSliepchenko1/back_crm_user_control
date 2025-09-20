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
  Query,
  Req,
  UploadedFiles,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthRoles } from 'src/auth/decorators/auth-roles.decorator';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { RenameUserDto } from './dto/rename-user.dto';
import { ChangePassword } from './dto/change-password.dto';
import type { Request } from 'express';

import { UseUploadFiles } from 'src/uploads/decorators/upload-file.decorator';

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
  async user(@Param('id') id: string) {
    return await this.usersService.user(id);
  }

  @AuthRoles('ADMIN')
  @Patch('is-active/:id')
  @HttpCode(HttpStatus.OK)
  async isActive(@Param('id') id: string) {
    return await this.usersService.isActive(id);
  }

  @Auth()
  @Patch('rename/:id')
  @HttpCode(HttpStatus.OK)
  async renameUser(
    @Param('id') id: string,
    @Body() dto: RenameUserDto,
    @Req() req: Request,
  ) {
    return await this.usersService.renameUser(dto, id, req);
  }

  @Auth()
  @Patch('change-password/:id')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Param('id') id: string,
    @Body() dto: ChangePassword,
    @Req() req: Request,
  ) {
    return await this.usersService.changePassword(dto, id, req);
  }

  @Auth()
  @Patch('change-avatar')
  @HttpCode(HttpStatus.OK)
  @UseUploadFiles(1, 1, ['image/jpeg', 'image/png', 'image/webp'])
  async changeAvatar(
    @Req() req: Request,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return await this.usersService.changeAvatar(req, files);
  }
}
