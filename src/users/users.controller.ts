import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthRoles } from 'src/auth/decorators/auth-roles.decorator';
import { RoleChangeDto } from './dto/role-change.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { RenameUserDto } from './dto/rename-user.dto';
import { User } from 'src/auth/decorators/user.decorator';
import type { JwtPayload } from 'src/token/interfaces/jwt-payload.interface';
import { ChangePassword } from './dto/change-password.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @AuthRoles('ADMIN')
  @Get('')
  @HttpCode(HttpStatus.OK)
  async users(@Query('page') page: number, @Query('limit') limit: number) {
    return await this.usersService.users({ page: +page, limit: +limit });
  }

  @AuthRoles('ADMIN')
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async roleChange(@Param('id') id: string, @Body() dto: RoleChangeDto) {
    return await this.usersService.roleChange(dto, id);
  }

  @AuthRoles('ADMIN')
  @Patch('blocked/:id')
  @HttpCode(HttpStatus.OK)
  async blockedOrUnblockedUser(@Param('id') id: string) {
    return await this.usersService.blockedOrUnblockedUser(id);
  }

  @Auth()
  @Patch('rename/:id')
  @HttpCode(HttpStatus.OK)
  async renameUser(
    @Param('id') id: string,
    @Body() dto: RenameUserDto,
    @User() user: JwtPayload,
  ) {
    const { id: userId, roles } = user;

    if (!roles.includes('ADMIN') && id !== userId) {
      throw new ForbiddenException(
        'У вас нет прав редактировать чужие логины!',
      );
    }

    return await this.usersService.renameUser(dto, id);
  }

  @Auth()
  @Patch('change-password/:id')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Param('id') id: string,
    @Body() dto: ChangePassword,
    @User() user: JwtPayload,
  ) {
    const { id: userId, roles } = user;

    if (!roles.includes('ADMIN') && id !== userId) {
      throw new ForbiddenException(
        'У вас нет прав редактировать чужие пароли!',
      );
    }

    return await this.usersService.changePassword(dto, id);
  }
}
