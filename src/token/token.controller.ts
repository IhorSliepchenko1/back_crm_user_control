import { Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { TokenService } from './token.service';
import { AuthRoles } from 'src/auth/decorators/auth-roles.decorator';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @ApiOperation({
    summary: 'Выход из системы',
    description: 'Принудительный выход из системы',
  })
  @ApiOkResponse({
    description: 'Выполнен выход из системы',
    schema: {
      example: { success: true, message: 'Выполнен выход из системы' },
    },
  })
  @ApiNotFoundResponse({
    description: 'Данный пользователь не имеет активных токенов',
  })
  @ApiUnauthorizedResponse({
    description: 'Доступ отклонён, войдите в систему и попробуйте снова',
  })
  @AuthRoles('ADMIN')
  @Post('deactivate/user/:id')
  @HttpCode(HttpStatus.OK)
  async deactivateTokens(@Param('id') id: string) {
    return await this.tokenService.deactivateTokens(id);
  }
}
