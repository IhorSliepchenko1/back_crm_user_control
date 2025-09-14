import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthRoles } from 'src/auth/decorators/auth-roles.decorator';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { RenameUserDto } from './dto/rename-user.dto';
import { ChangePassword } from './dto/change-password.dto';
import type { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @AuthRoles('ADMIN')
  @Get('')
  @HttpCode(HttpStatus.OK)
  async users(@Query('page') page: string, @Query('limit') limit: string) {
    return await this.usersService.users({ page: +page, limit: +limit });
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
}
