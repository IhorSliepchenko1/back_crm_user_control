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
import { RoleChangeDto } from './dto/role-change.dto';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
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

  @AuthRoles('ADMIN')
  @Patch('role/:id')
  @HttpCode(HttpStatus.OK)
  async roleChange(@Param('id') id: string, @Body() dto: RoleChangeDto) {
    return await this.roleService.roleChange(dto, id);
  }
}
