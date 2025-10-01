export interface NotificationPayload {
  taskId: string;
  senderId: string;
  recipients: string[];
  message: string;
  subject: string;
}
