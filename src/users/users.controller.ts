import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersDto } from './dto/users.dto';
import { AuthRoles } from 'src/auth/decorators/auth-roles.decorator';
import { RoleChangeDto } from './dto/role-change.dto';

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
}
