export interface NotificationMessage {
  id: string;
  severity: 'Success' | 'Warning' | 'Error' | 'Info';
  message: string;
}