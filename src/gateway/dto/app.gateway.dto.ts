// type TypeGateway = 'NOTIFICATION' | 'TRIGGER_TASKS' ;

export class AppGatewayDto {
  subject: string;
  message: string;
  // types: TypeGateway[];
  taskId: string;
  projectId?: string;
}
