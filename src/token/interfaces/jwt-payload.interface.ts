import { Roles } from "@prisma/client";

export interface JwtPayload {
  id: string;
  login: string;
  roles: Roles[];
}
