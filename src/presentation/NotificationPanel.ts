import { Notification } from '../interfaces/types';

const API = '';

export class NotificationPanel {
  private container: HTMLElement;
  private badge: HTMLElement;
  private list: HTMLElement;
  private notifications: Notification[] = [];

  constructor(containerId: string, badgeId: string, listId: string) {
    this.container = document.getElementById(containerId)!;
    this.badge = document.getElementById(badgeId)!;
    this.list = document.getElementById(listId)!;
  }

  async load(): Promise<void> {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/users/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      this.notifications = await res.json();
      this.render();
    } catch {}
  }

  private render(): void {
    const unread = this.notifications.filter(n => !n.read).length;
    this.badge.textContent = unread > 0 ? String(unread) : '';
    this.badge.style.display = unread > 0 ? 'flex' : 'none';

    this.list.innerHTML = this.notifications.length === 0
      ? '<div class="no-notif">Bildirim yok</div>'
      : this.notifications
          .slice()
          .reverse()
          .map(n => `
            <div class="notif-item ${n.read ? '' : 'unread'} ${n.type}" data-id="${n.id}">
              <span class="notif-icon">${n.type === 'success' ? '✅' : n.type === 'info' ? '📢' : '⚠️'}</span>
              <span class="notif-msg">${n.message}</span>
            </div>
          `)
          .join('');

    this.list.querySelectorAll('.notif-item').forEach(el => {
      el.addEventListener('click', async () => {
        const id = (el as HTMLElement).dataset.id!;
        const token = localStorage.getItem('token');
        await fetch(`${API}/api/users/notifications/${id}/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        await this.load();
      });
    });
  }
}
