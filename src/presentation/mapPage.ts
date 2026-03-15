import { MapView } from './MapView';
import { NotificationPanel } from './NotificationPanel';

declare global {
  interface Window {
    mapView: MapView;
    notifPanel: NotificationPanel;
  }
}

async function init() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  // Update navbar
  const loginBtn = document.getElementById('nav-login');
  const userInfo = document.getElementById('nav-user');
  const logoutBtn = document.getElementById('nav-logout');

  if (token && username) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (userInfo) { userInfo.style.display = 'flex'; userInfo.textContent = `👤 ${username}`; }
    if (logoutBtn) logoutBtn.style.display = 'flex';
  }

  logoutBtn?.addEventListener('click', () => {
    localStorage.clear();
    window.location.reload();
  });

  // Init map
  const mapView = new MapView();
  window.mapView = mapView;
  await mapView.loadMarkers();

  // Notifications
  if (token) {
    const notifPanel = new NotificationPanel('notif-container', 'notif-badge', 'notif-list');
    window.notifPanel = notifPanel;
    await notifPanel.load();
    setInterval(() => notifPanel.load(), 15000);

    document.getElementById('notif-btn')?.addEventListener('click', () => {
      const dropdown = document.getElementById('notif-dropdown')!;
      dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });
  }

  // Add marker form
  document.getElementById('add-marker-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const desc = (document.getElementById('marker-desc') as HTMLInputElement).value;
    const count = parseInt((document.getElementById('marker-count') as HTMLInputElement).value) || 1;
    await mapView.addMarker(desc, count);
  });

  document.getElementById('modal-close')?.addEventListener('click', () => mapView.closeModal());

  // Close notif dropdown on outside click
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notif-dropdown');
    const btn = document.getElementById('notif-btn');
    if (dropdown && btn && !btn.contains(e.target as Node) && !dropdown.contains(e.target as Node)) {
      dropdown.style.display = 'none';
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
