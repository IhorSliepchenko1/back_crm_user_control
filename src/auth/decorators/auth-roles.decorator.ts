import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '@prisma/client';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

export const ROLES_KEY = 'roles';

export const AuthRoles = (...roles: Roles[]) => {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(JwtAuthGuard, RolesGuard),
  );
};
