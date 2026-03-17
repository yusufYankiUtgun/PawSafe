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

  // Add marker form — confirm step
  document.getElementById('add-marker-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const size = (document.getElementById('marker-size') as HTMLSelectElement).value;
    const color = (document.getElementById('marker-color') as HTMLSelectElement).value;
    const earTagColor = (document.getElementById('marker-ear-tag') as HTMLSelectElement).value;
    const classification = (document.querySelector('input[name="classification"]:checked') as HTMLInputElement)?.value;

    if (!size || !color || !earTagColor || !classification) {
      mapView.showToast('Lütfen tüm köpek özelliklerini seçin.', 'error');
      return;
    }

    // Show confirm step
    const confirmModal = document.getElementById('confirm-modal') as HTMLElement;
    confirmModal.style.display = 'flex';
  });

  document.getElementById('confirm-yes')?.addEventListener('click', async () => {
    (document.getElementById('confirm-modal') as HTMLElement).style.display = 'none';
    const desc = (document.getElementById('marker-desc') as HTMLTextAreaElement).value;
    const count = parseInt((document.getElementById('marker-count') as HTMLInputElement).value) || 1;
    await mapView.addMarker(desc, count);
  });

  document.getElementById('confirm-no')?.addEventListener('click', () => {
    (document.getElementById('confirm-modal') as HTMLElement).style.display = 'none';
  });

  document.getElementById('modal-close')?.addEventListener('click', () => mapView.closeModal());

  // Edit modal
  document.getElementById('edit-marker-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await mapView.submitEdit();
  });
  document.getElementById('edit-modal-close')?.addEventListener('click', () => {
    (document.getElementById('edit-marker-modal') as HTMLElement).style.display = 'none';
  });

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
