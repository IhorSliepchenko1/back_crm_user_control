import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateDescriptionsDto } from './dto/update-descriptions.dto';
import { AuthRoles } from 'src/auth/decorators/auth-roles.decorator';
import { RoleChangeDto } from './dto/role-change.dto';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @ApiOperation({
    summary: 'Создание роли',
    description:
      'Создание роли по ранее зарезервированным именам (доступ к созданию только у роли - ADMIN)',
  })
  @ApiOkResponse({
    description: 'Новая роль создана',
    schema: {
      example: { success: true, message: 'Новая роль создана' },
    },
  })
  @ApiConflictResponse({
    description: 'Данная роль уже существует',
  })
  @ApiBadRequestResponse({
    description:
      'Создание роли - исключительно по зарезервированным названиям. Обратитесь к разработчику!',
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @ApiForbiddenResponse({
    description: 'У вас недостаточно прав доступа',
  })
  @Post()
  @AuthRoles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto);
  }

  @ApiOperation({
    summary: 'Изменение описания роли',
  })
  @ApiOkResponse({
    description: 'Описание роли изменено',
    schema: {
      example: { success: true, message: 'Описание роли изменено' },
    },
  })
  @ApiNotFoundResponse({
    description: 'Роли с таким id на сервере не обнаружено',
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @ApiForbiddenResponse({
    description: 'У вас недостаточно прав доступа',
  })
  @Patch(':id')
  @AuthRoles('ADMIN')
  @HttpCode(HttpStatus.OK)
  updateDescriptions(
    @Param('id') id: string,
    @Body() dto: UpdateDescriptionsDto,
  ) {
    return this.roleService.updateDescriptions(dto, id);
  }

  @ApiOperation({
    summary: 'Изменение списка ролей',
  })
  @ApiOkResponse({
    description: 'Описание роли изменено',
    schema: {
      example: { success: true, message: 'Роли изменены' },
    },
  })
  @ApiNotFoundResponse({
    description: 'Пользователь не найден',
  })
  @ApiConflictResponse({
    description: [
      'Удалить роль можно при наличии более 1й роли',
      'Пользователю присвоено максимальный статус ролей',
    ].join('\n\n'),
  })
  @ApiBadRequestResponse({
    description: [
      'Вы передали некорректный массив ролей',
      'Удалить роли USER у ADMIN невозможно, это делается в обратном направлении',
      'Вы не можете одновременно удалять и добавлять права доступа к пользователю',
    ].join('\n\n'),
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @ApiForbiddenResponse({
    description: 'У вас недостаточно прав доступа',
  })
  @AuthRoles('ADMIN')
  @Patch('change-access/:id')
  @HttpCode(HttpStatus.OK)
  async roleChange(@Param('id') id: string, @Body() dto: RoleChangeDto) {
    return await this.roleService.roleChange(dto, id);
  }

  @ApiOperation({
    summary: 'Список ролей',
  })
  @ApiOkResponse({
    description: 'Список ролей',
    schema: {
      example: {
        success: true,
        message: 'Список ролей',
        roles: [{ name: 'USER' }, { name: 'ADMIN' }],
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @ApiForbiddenResponse({
    description: 'У вас недостаточно прав доступа',
  })
  @AuthRoles('ADMIN')
  @Get('all')
  @HttpCode(HttpStatus.OK)
  async rolesAll() {
    return await this.roleService.rolesAll();
  }
}
