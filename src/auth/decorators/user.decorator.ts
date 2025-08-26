import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from 'src/token/interfaces/jwt-payload.interface';

export const User = createParamDecorator((_, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user as JwtPayload;

  return user.roles;
});
