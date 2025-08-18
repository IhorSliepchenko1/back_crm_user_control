import { Controller, Post } from '@nestjs/common';
import { TokenService } from './token.service';
import { AuthRoles } from 'src/auth/decorators/auth-roles.decorator';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}
}
