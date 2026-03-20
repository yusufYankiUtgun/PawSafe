import { MapView } from './MapView';
import { NotificationPanel } from './NotificationPanel';

declare global {
  interface Window {
    mapView: MapView;
    notifPanel: NotificationPanel;
  }
}

async function checkSession(): Promise<boolean> {
  const token = localStorage.getItem('token');
  if (!token) return false;
  try {
    const res = await fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      localStorage.clear();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function init() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  const loginBtn = document.getElementById('nav-login');
  const userInfo = document.getElementById('nav-user');
  const logoutBtn = document.getElementById('nav-logout');

  // Validate session on load — clears stale tokens silently
  const sessionValid = token ? await checkSession() : false;
  const activeToken = sessionValid ? token : null;

  if (activeToken && username) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (userInfo) { userInfo.style.display = 'flex'; userInfo.textContent = `👤 ${username}`; }
    if (logoutBtn) logoutBtn.style.display = 'flex';
  } else if (token && !sessionValid) {
    const hint = document.getElementById('map-hint');
    if (hint) hint.textContent = '⚠️ Oturumunuz sona erdi. Tekrar giriş yapın.';
  }

  logoutBtn?.addEventListener('click', () => {
    localStorage.clear();
    window.location.reload();
  });

  const mapView = new MapView();
  window.mapView = mapView;
  await mapView.loadMarkers();

  // Notifications
  if (activeToken) {
    const notifPanel = new NotificationPanel('notif-container', 'notif-badge', 'notif-list');
    window.notifPanel = notifPanel;
    await notifPanel.load();
    setInterval(() => notifPanel.load(), 15000);

    document.getElementById('notif-btn')?.addEventListener('click', () => {
      const dropdown = document.getElementById('notif-dropdown')!;
      dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });
  }

  // ── Add marker form ──────────────────────────────────────────────────────
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

    (document.getElementById('confirm-modal') as HTMLElement).style.display = 'flex';
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

  // Image preview
  document.getElementById('marker-image')?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    const preview = document.getElementById('image-preview') as HTMLImageElement;
    if (file && preview) {
      const reader = new FileReader();
      reader.onload = ev => {
        preview.src = ev.target?.result as string;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else if (preview) {
      preview.style.display = 'none';
      preview.src = '';
    }
  });

  // ── Edit modal ───────────────────────────────────────────────────────────
  document.getElementById('edit-marker-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await mapView.submitEdit();
  });
  document.getElementById('edit-modal-close')?.addEventListener('click', () => {
    (document.getElementById('edit-marker-modal') as HTMLElement).style.display = 'none';
  });

  // ── Dispute modal ────────────────────────────────────────────────────────
  document.getElementById('dispute-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await mapView.submitDispute();
  });
  document.getElementById('dispute-modal-close')?.addEventListener('click', () => {
    mapView.closeDisputeModal();
  });
  document.getElementById('dispute-cancel')?.addEventListener('click', () => {
    mapView.closeDisputeModal();
  });

  // ── Close notif dropdown on outside click ────────────────────────────────
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notif-dropdown');
    const btn = document.getElementById('notif-btn');
    if (dropdown && btn && !btn.contains(e.target as Node) && !dropdown.contains(e.target as Node)) {
      dropdown.style.display = 'none';
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
