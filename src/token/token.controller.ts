import { Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { TokenService } from './token.service';
import { AuthRoles } from 'src/auth/decorators/auth-roles.decorator';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @AuthRoles(['ADMIN'])
  @Post('deactivate/:id')
  @HttpCode(HttpStatus.OK)
  async deactivateTokens(@Param('id') id: string) {
    return await this.tokenService.deactivateTokens(id);
  }
}
