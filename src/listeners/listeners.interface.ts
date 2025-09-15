export interface NotificationPayload {
  taskId: string;
  senderId: string;
  recipients: Array<string>;
  message: string;
  subject: string;
}
