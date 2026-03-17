import { IObserver } from '../interfaces/IObserver';
import { ValidationEvent, Notification } from '../interfaces/types';
import { mockNotifications } from '../data/mockData';

export class NotificationObserver implements IObserver {
  private notifications: Notification[] = [...mockNotifications];

  update(event: ValidationEvent): void {
    const notification: Notification = {
      id: `n${Date.now()}`,
      userId: event.reporterId,
      message:
        event.validationType === 'validate'
          ? 'Raporunuz doğrulandı! Trust skorunuz arttı.'
          : 'Raporunuz itiraz aldı.',
      type: event.validationType === 'validate' ? 'success' : 'error',
      createdAt: new Date().toISOString(),
      read: false,
    };
    this.notifications.push(notification);
  }

  getForUser(userId: string): Notification[] {
    return this.notifications.filter(n => n.userId === userId);
  }

  markRead(notificationId: string): void {
    const n = this.notifications.find(n => n.id === notificationId);
    if (n) n.read = true;
  }
}
