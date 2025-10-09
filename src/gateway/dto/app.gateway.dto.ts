type TypeGateway =
  | 'NOTIFICATION'
  | 'LOGOUT'
  | 'TRIGGER_USERS'
  | 'TRIGGER_TASKS'
  | 'TRIGGER_PROJECTS';

export class AppGatewayDto {
  subject: string;
  message: string;
  types: TypeGateway[];
}
