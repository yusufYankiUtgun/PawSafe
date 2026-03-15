import { AdminPanel } from './AdminPanel';

declare global {
  interface Window {
    adminPanel: AdminPanel;
  }
}

async function init() {
  const token = localStorage.getItem('token');
  if (!token) { window.location.href = '/login'; return; }

  const panel = new AdminPanel();
  window.adminPanel = panel;

  await panel.loadStats();
  await panel.loadMarkers();

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = (btn as HTMLElement).dataset.tab as 'markers' | 'users';
      panel.showTab(tab);
      if (tab === 'users') panel.loadUsers();
    });
  });

  document.getElementById('nav-logout')?.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/login';
  });
}

document.addEventListener('DOMContentLoaded', init);
