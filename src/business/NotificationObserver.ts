import { IObserver } from '../interfaces/IObserver';
import { ValidationEvent, Notification, DisputeReason } from '../interfaces/types';
import { mockNotifications } from '../data/mockData';

/** Human-readable Turkish labels for dispute reason categories. */
const DISPUTE_REASON_LABELS: Record<DisputeReason, string> = {
  inappropriate: 'Uygunsuz içerik',
  irrelevant:    'Alakasız',
  false_report:  'Yanlış ihbar',
  duplicate:     'Mükerrer',
  spam:          'Spam',
  other:         'Diğer',
};

export class NotificationObserver implements IObserver {
  private notifications: Notification[] = [...mockNotifications];

  update(event: ValidationEvent): void {
    let message: string;

    if (event.validationType === 'validate') {
      message = 'Raporunuz doğrulandı! Güven puanınız arttı.';
    } else {
      const reasonLabel = event.reason
        ? DISPUTE_REASON_LABELS[event.reason]
        : 'bilinmeyen neden';
      message = `Raporunuz itiraz aldı — Neden: ${reasonLabel}.`;
    }

    const notification: Notification = {
      id: `n${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: event.reporterId,
      message,
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
