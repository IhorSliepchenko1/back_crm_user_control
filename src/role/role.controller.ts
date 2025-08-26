import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateDescriptionsDto } from './dto/update-descriptions.dto';
import { AuthRoles } from 'src/auth/decorators/auth-roles.decorator';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post('add')
  @AuthRoles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto);
  }

  @Patch(':id')
  @AuthRoles('ADMIN')
  @HttpCode(HttpStatus.OK)
  updateDescriptions(
    @Param('id') id: string,
    @Body() dto: UpdateDescriptionsDto,
  ) {
    return this.roleService.updateDescriptions(dto, id);
  }
}
