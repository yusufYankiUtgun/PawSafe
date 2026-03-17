import { MapFacade } from '../facade/MapFacade';
import { Marker } from '../interfaces/types';

const API = '';

const SIZE_LABELS: Record<string, string> = { small: 'Küçük', medium: 'Orta', large: 'Büyük' };
const CLASS_LABELS: Record<string, string> = { friendly: 'Zararsız', aggressive: 'Zararlı' };
const CLASS_COLORS: Record<string, string> = { friendly: '#2E7D32', aggressive: '#C62828' };

async function fetchAddress(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=tr`,
      { headers: { 'Accept-Language': 'tr' } }
    );
    const data = await res.json();
    const a = data.address || {};
    const parts = [
      a.neighbourhood || a.suburb || a.quarter,
      a.road || a.pedestrian || a.footway,
    ].filter(Boolean);
    return parts.join(', ') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

export class MapView {
  private facade: MapFacade;
  private markers: Marker[] = [];
  private selectedLat: number | null = null;
  private selectedLng: number | null = null;
  private selectedAddress: string = '';

  constructor() {
    this.facade = new MapFacade('map');
    this.facade.onMapClick((lat, lng) => this.onMapClick(lat, lng));
  }

  private async onMapClick(lat: number, lng: number): Promise<void> {
    const token = localStorage.getItem('token');
    if (!token) {
      this.showToast('Marker eklemek için giriş yapmanız gerekiyor.', 'error');
      return;
    }
    this.selectedLat = lat;
    this.selectedLng = lng;

    const preview = document.getElementById('coord-preview') as HTMLElement;
    preview.textContent = 'Adres yükleniyor...';
    (document.getElementById('add-marker-modal') as HTMLElement).style.display = 'flex';

    this.selectedAddress = await fetchAddress(lat, lng);
    preview.textContent = `📍 ${this.selectedAddress}`;
  }

  async loadMarkers(): Promise<void> {
    const res = await fetch(`${API}/api/markers`);
    this.markers = await res.json();
    this.facade.clearMarkers();
    this.markers.forEach(m => this.addMarkerToMap(m));
    this.facade.updateHeatmap(this.markers.map(m => [m.lat, m.lng, 1]));
  }

  private addMarkerToMap(m: Marker): void {
    const danger: 'low' | 'medium' | 'high' =
      m.classification === 'aggressive' ? (m.validationCount >= 5 ? 'high' : 'medium') : 'low';
    const popup = this.buildPopup(m);
    this.facade.addMarker(m.id, m.lat, m.lng, popup, danger);
  }

  private buildPopup(m: Marker): string {
    const currentUserId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const isOwner = currentUserId && currentUserId === m.reporterId;

    const classLabel = m.classification ? CLASS_LABELS[m.classification] : '';
    const classColor = m.classification ? CLASS_COLORS[m.classification] : '#757575';
    const sizeLabel = m.size ? SIZE_LABELS[m.size] : '';

    const templateBadges = [
      sizeLabel ? `<span class="popup-badge">${sizeLabel}</span>` : '',
      m.color ? `<span class="popup-badge">${m.color}</span>` : '',
      m.earTagColor && m.earTagColor !== 'yok' ? `<span class="popup-badge">Küpe: ${m.earTagColor}</span>` : '',
    ].filter(Boolean).join('');

    const ownerActions = isOwner ? `
      <div class="popup-actions">
        <button class="btn-edit" onclick="window.mapView.openEditModal('${m.id}')">✏️ Düzenle</button>
        <button class="btn-delete-marker" onclick="window.mapView.deleteMarker('${m.id}')">🗑️ Sil</button>
      </div>` : '';

    const voteButtons = token && !isOwner ? `
      <div class="popup-actions">
        <button class="btn-validate" onclick="window.mapView.vote('${m.id}','validate')">✅ Doğrula</button>
        <button class="btn-dispute" onclick="window.mapView.vote('${m.id}','dispute')">⚠️ İtiraz</button>
      </div>` : '';

    return `
      <div class="marker-popup">
        <div class="popup-header" style="background:${classColor}">
          <span class="popup-classification">${classLabel || 'Bilinmiyor'}</span>
          <span class="popup-animal-count">🐾 ${m.animalCount} hayvan</span>
        </div>
        <div class="popup-body">
          <div class="popup-badges">${templateBadges}</div>
          <p class="popup-desc">${m.description || 'Açıklama yok'}</p>
          <p class="popup-address">📍 ${m.address || `${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}`}</p>
          <p class="popup-meta">
            <span>👤 ${m.reporterName}</span>
            <span>📅 ${m.createdAt}</span>
          </p>
          <p class="popup-meta">
            <span>✅ ${m.validationCount} doğrulama</span>
            <span>⚠️ ${m.disputeCount} itiraz</span>
          </p>
        </div>
        ${ownerActions}
        ${voteButtons}
      </div>`;
  }

  async vote(markerId: string, type: 'validate' | 'dispute'): Promise<void> {
    const token = localStorage.getItem('token');
    if (!token) { alert('Lütfen giriş yapın.'); return; }

    const res = await fetch(`${API}/api/validations/${markerId}/${type}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      await this.loadMarkers();
      this.showToast(data.message, 'success');
    } else if (res.status === 401) {
      localStorage.clear();
      this.showToast('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.', 'error');
      setTimeout(() => { window.location.href = '/login'; }, 2000);
    } else {
      this.showToast(data.error, 'error');
    }
  }

  async addMarker(description: string, animalCount: number): Promise<void> {
    if (this.selectedLat === null || this.selectedLng === null) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const size = (document.getElementById('marker-size') as HTMLSelectElement).value;
    const color = (document.getElementById('marker-color') as HTMLSelectElement).value;
    const earTagColor = (document.getElementById('marker-ear-tag') as HTMLSelectElement).value;
    const classification = (document.querySelector('input[name="classification"]:checked') as HTMLInputElement)?.value;

    if (!size || !color || !earTagColor || !classification) {
      this.showToast('Lütfen tüm köpek özelliklerini seçin.', 'error');
      return;
    }

    const res = await fetch(`${API}/api/markers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        lat: this.selectedLat,
        lng: this.selectedLng,
        description,
        animalCount,
        size,
        color,
        earTagColor,
        classification,
        address: this.selectedAddress,
      }),
    });

    if (res.ok) {
      this.closeModal();
      await this.loadMarkers();
      this.showToast('Marker eklendi! +10 puan kazandınız 🎉', 'success');
    } else {
      const data = await res.json();
      if (res.status === 401) {
        localStorage.clear();
        this.showToast('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.', 'error');
        setTimeout(() => { window.location.href = '/login'; }, 2000);
      } else {
        this.showToast(data.error || 'Hata oluştu.', 'error');
      }
    }
  }

  openEditModal(markerId: string): void {
    const m = this.markers.find(x => x.id === markerId);
    if (!m) return;

    (document.getElementById('edit-marker-id') as HTMLInputElement).value = m.id;
    (document.getElementById('edit-marker-desc') as HTMLTextAreaElement).value = m.description;
    (document.getElementById('edit-marker-count') as HTMLInputElement).value = String(m.animalCount);
    (document.getElementById('edit-marker-size') as HTMLSelectElement).value = m.size || 'medium';
    (document.getElementById('edit-marker-color') as HTMLSelectElement).value = m.color || 'kahverengi';
    (document.getElementById('edit-marker-ear-tag') as HTMLSelectElement).value = m.earTagColor || 'yok';
    const classInput = document.querySelector(`input[name="edit-classification"][value="${m.classification || 'friendly'}"]`) as HTMLInputElement;
    if (classInput) classInput.checked = true;

    (document.getElementById('edit-marker-modal') as HTMLElement).style.display = 'flex';
  }

  async submitEdit(): Promise<void> {
    const id = (document.getElementById('edit-marker-id') as HTMLInputElement).value;
    const description = (document.getElementById('edit-marker-desc') as HTMLTextAreaElement).value;
    const animalCount = parseInt((document.getElementById('edit-marker-count') as HTMLInputElement).value) || 1;
    const size = (document.getElementById('edit-marker-size') as HTMLSelectElement).value;
    const color = (document.getElementById('edit-marker-color') as HTMLSelectElement).value;
    const earTagColor = (document.getElementById('edit-marker-ear-tag') as HTMLSelectElement).value;
    const classification = (document.querySelector('input[name="edit-classification"]:checked') as HTMLInputElement)?.value;
    const token = localStorage.getItem('token');
    if (!token) return;

    const res = await fetch(`${API}/api/markers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ description, animalCount, size, color, earTagColor, classification }),
    });

    if (res.ok) {
      (document.getElementById('edit-marker-modal') as HTMLElement).style.display = 'none';
      await this.loadMarkers();
      this.showToast('Marker güncellendi.', 'success');
    } else {
      const data = await res.json();
      this.showToast(data.error || 'Hata oluştu.', 'error');
    }
  }

  async deleteMarker(markerId: string): Promise<void> {
    if (!confirm('Bu marker\'ı silmek istediğinizden emin misiniz?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const res = await fetch(`${API}/api/markers/${markerId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      await this.loadMarkers();
      this.showToast('Marker silindi.', 'success');
    } else {
      const data = await res.json();
      this.showToast(data.error || 'Hata oluştu.', 'error');
    }
  }

  toggleHeatmap(): boolean {
    return this.facade.toggleHeatmap();
  }

  closeModal(): void {
    (document.getElementById('add-marker-modal') as HTMLElement).style.display = 'none';
    this.selectedLat = null;
    this.selectedLng = null;
    this.selectedAddress = '';
  }

  showToast(msg: string, type: 'success' | 'error'): void {
    const toast = document.getElementById('toast')!;
    toast.textContent = msg;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
}
