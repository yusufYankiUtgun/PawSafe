const API = '';

export class AdminPanel {
  private token: string;

  constructor() {
    this.token = localStorage.getItem('token') || '';
  }

  async loadStats(): Promise<void> {
    const res = await fetch(`${API}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) { window.location.href = '/login'; return; }
    const stats = await res.json();
    document.getElementById('stat-markers')!.textContent = stats.totalMarkers;
    document.getElementById('stat-users')!.textContent = stats.totalUsers;
    document.getElementById('stat-validations')!.textContent = stats.totalValidations;
    document.getElementById('stat-disputes')!.textContent = stats.totalDisputes;
  }

  async loadMarkers(): Promise<void> {
    const res = await fetch(`${API}/api/admin/markers`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    const markers = await res.json();
    const tbody = document.getElementById('markers-tbody')!;
    tbody.innerHTML = markers.map((m: any) => `
      <tr>
        <td>${m.id}</td>
        <td>${m.description || '-'}</td>
        <td>${m.reporterName}</td>
        <td>${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}</td>
        <td>✅${m.validationCount} ⚠️${m.disputeCount}</td>
        <td>${m.createdAt}</td>
        <td>
          <button class="btn-delete" onclick="window.adminPanel.deleteMarker('${m.id}')">Sil</button>
        </td>
      </tr>`).join('');
  }

  async loadUsers(): Promise<void> {
    const res = await fetch(`${API}/api/admin/users`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    const users = await res.json();
    const tbody = document.getElementById('users-tbody')!;
    tbody.innerHTML = users.map((u: any) => `
      <tr>
        <td>${u.id}</td>
        <td>${u.username}</td>
        <td>${u.email}</td>
        <td>${u.trustScore}</td>
        <td><span class="badge-role ${u.role}">${u.role}</span></td>
      </tr>`).join('');
  }

  async deleteMarker(id: string): Promise<void> {
    if (!confirm('Bu markerı silmek istediğinize emin misiniz?')) return;
    const res = await fetch(`${API}/api/admin/markers/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (res.ok) {
      this.loadMarkers();
      this.loadStats();
    }
  }

  showTab(tab: 'markers' | 'users'): void {
    document.querySelectorAll('.tab-panel').forEach(p => (p as HTMLElement).style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`panel-${tab}`)!.style.display = 'block';
    document.querySelector(`.tab-btn[data-tab="${tab}"]`)!.classList.add('active');
  }
}
