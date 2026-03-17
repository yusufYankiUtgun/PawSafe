import { Notification } from '../interfaces/types';

const API = '';

// Client-side fallback mock notifications shown for any logged-in user
const CLIENT_MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'cm1', userId: '__any__',
    message: 'Yakınınızda yeni bir köpek ihbarı eklendi.',
    type: 'info', createdAt: new Date(Date.now() - 3600000).toISOString(), read: false,
  },
  {
    id: 'cm2', userId: '__any__',
    message: 'Bir ihbarınız doğrulandı! Güven puanınız arttı.',
    type: 'success', createdAt: new Date(Date.now() - 7200000).toISOString(), read: false,
  },
];

export class NotificationPanel {
  private container: HTMLElement;
  private badge: HTMLElement;
  private list: HTMLElement;
  private notifications: Notification[] = [];

  constructor(containerId: string, badgeId: string, listId: string) {
    this.container = document.getElementById(containerId)!;
    this.badge = document.getElementById(badgeId)!;
    this.list = document.getElementById(listId)!;
    // Show container immediately when constructed (user is logged in)
    this.container.style.display = 'inline-block';
  }

  async load(): Promise<void> {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/users/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const serverNotifs: Notification[] = await res.json();
        // Merge server notifications with the client-side fallbacks (deduplicate by id)
        const ids = new Set(serverNotifs.map(n => n.id));
        this.notifications = [
          ...serverNotifs,
          ...CLIENT_MOCK_NOTIFICATIONS.filter(n => !ids.has(n.id)),
        ];
      } else {
        // API unavailable — fall back to client-side mock data
        this.notifications = [...CLIENT_MOCK_NOTIFICATIONS];
      }
      this.render();
    } catch {
      this.notifications = [...CLIENT_MOCK_NOTIFICATIONS];
      this.render();
    }
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
