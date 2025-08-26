import { Roles } from '@prisma/client';

export interface JwtPayload {
  id: string;
  roles: Roles[];
}
