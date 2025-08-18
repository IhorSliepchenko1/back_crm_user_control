import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersDto } from './dto/users.dto';
import { AuthRoles } from 'src/auth/decorators/auth-roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @AuthRoles(['ADMIN'])
  @Get('')
  @HttpCode(HttpStatus.OK)
  async users(@Query() dto: UsersDto) {
    return await this.usersService.users(dto);
  }
}
