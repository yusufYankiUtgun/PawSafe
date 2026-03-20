import { MapFacade } from '../facade/MapFacade';
import { Marker } from '../interfaces/types';
import { IMapViewStrategy } from '../interfaces/IMapViewStrategy';
import { MarkerViewStrategy } from './MarkerViewStrategy';
import { HeatmapViewStrategy } from './HeatmapViewStrategy';

const API = '';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png']);

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

  /** Dispute modal state */
  private pendingDisputeMarkerId: string | null = null;

  /** Strategy Pattern: current map rendering mode */
  private currentStrategy: IMapViewStrategy;
  private markerStrategy: IMapViewStrategy;
  private heatmapStrategy: IMapViewStrategy;

  constructor() {
    this.facade = new MapFacade('map');
    this.markerStrategy = new MarkerViewStrategy(this.facade);
    this.heatmapStrategy = new HeatmapViewStrategy(this.facade);
    this.currentStrategy = this.markerStrategy;

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
    this.currentStrategy.render(this.markers);
  }

  /**
   * Toggle between marker view and heatmap view (Strategy Pattern).
   * Returns true if heatmap mode is now active.
   */
  toggleMapMode(): boolean {
    this.currentStrategy.clear();
    if (this.currentStrategy === this.markerStrategy) {
      this.currentStrategy = this.heatmapStrategy;
    } else {
      this.currentStrategy = this.markerStrategy;
    }
    this.currentStrategy.render(this.markers);
    return this.currentStrategy.getName() === 'heatmap';
  }

  /** Legacy shim so the inline <script> in index.html still works. */
  toggleHeatmap(): boolean {
    return this.toggleMapMode();
  }

  // ─── Validation / dispute ────────────────────────────────────────────────

  async vote(markerId: string, type: 'validate'): Promise<void> {
    const token = localStorage.getItem('token');
    if (!token) { this.showToast('Lütfen giriş yapın.', 'error'); return; }

    const res = await fetch(`${API}/api/validations/${markerId}/${type}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      await this.loadMarkers();
      this.showToast(data.message, 'success');
    } else if (res.status === 401) {
      this.handleSessionExpired();
    } else {
      this.showToast(data.error, 'error');
    }
  }

  /** Open the dispute modal for the given marker. */
  openDisputeModal(markerId: string): void {
    this.pendingDisputeMarkerId = markerId;
    const modal = document.getElementById('dispute-modal') as HTMLElement;
    if (modal) {
      // Reset form
      (document.getElementById('dispute-reason') as HTMLSelectElement).value = '';
      (document.getElementById('dispute-explanation') as HTMLTextAreaElement).value = '';
      modal.style.display = 'flex';
    }
  }

  /** Called by mapPage when the dispute form is submitted. */
  async submitDispute(): Promise<void> {
    const markerId = this.pendingDisputeMarkerId;
    if (!markerId) return;

    const token = localStorage.getItem('token');
    if (!token) { this.showToast('Lütfen giriş yapın.', 'error'); return; }

    const reason = (document.getElementById('dispute-reason') as HTMLSelectElement).value;
    if (!reason) {
      this.showToast('Lütfen bir itiraz nedeni seçin.', 'error');
      return;
    }

    const explanation = (document.getElementById('dispute-explanation') as HTMLTextAreaElement).value.trim();

    const res = await fetch(`${API}/api/validations/${markerId}/dispute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason, explanation: explanation || undefined }),
    });

    const data = await res.json();

    if (res.ok) {
      this.closeDisputeModal();
      await this.loadMarkers();
      this.showToast(data.message, 'success');
    } else if (res.status === 401) {
      this.closeDisputeModal();
      this.handleSessionExpired();
    } else {
      this.showToast(data.error || 'İtiraz gönderilemedi.', 'error');
    }
  }

  closeDisputeModal(): void {
    const modal = document.getElementById('dispute-modal') as HTMLElement;
    if (modal) modal.style.display = 'none';
    this.pendingDisputeMarkerId = null;
  }

  // ─── Add marker ─────────────────────────────────────────────────────────

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

    // Client-side image validation
    const imageInput = document.getElementById('marker-image') as HTMLInputElement;
    const imageFile = imageInput?.files?.[0] ?? null;

    if (imageFile) {
      if (!ALLOWED_MIME_TYPES.has(imageFile.type)) {
        this.showToast('Yalnızca JPEG veya PNG dosyası ekleyebilirsiniz.', 'error');
        return;
      }
      if (imageFile.size > MAX_IMAGE_SIZE_BYTES) {
        this.showToast('Fotoğraf boyutu 5 MB\'ı geçemez.', 'error');
        return;
      }
    }

    // Use FormData to support multipart (image + JSON fields)
    const formData = new FormData();
    formData.append('lat', String(this.selectedLat));
    formData.append('lng', String(this.selectedLng));
    formData.append('description', description);
    formData.append('animalCount', String(animalCount));
    formData.append('size', size);
    formData.append('color', color);
    formData.append('earTagColor', earTagColor);
    formData.append('classification', classification);
    formData.append('address', this.selectedAddress);
    if (imageFile) formData.append('image', imageFile);

    const res = await fetch(`${API}/api/markers`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      this.closeModal();
      await this.loadMarkers();
      let msg = 'Marker eklendi! +10 puan kazandınız 🎉';
      if (data.imageWarning) msg += ` (Fotoğraf: ${data.imageWarning})`;
      this.showToast(msg, 'success');
    } else {
      const data = await res.json();
      if (res.status === 401) {
        this.handleSessionExpired();
      } else {
        this.showToast(data.error || 'Hata oluştu.', 'error');
      }
    }
  }

  // ─── Edit marker ─────────────────────────────────────────────────────────

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

  // ─── Modal helpers ───────────────────────────────────────────────────────

  closeModal(): void {
    (document.getElementById('add-marker-modal') as HTMLElement).style.display = 'none';
    this.selectedLat = null;
    this.selectedLng = null;
    this.selectedAddress = '';
    const imageInput = document.getElementById('marker-image') as HTMLInputElement;
    if (imageInput) imageInput.value = '';
    const preview = document.getElementById('image-preview') as HTMLElement;
    if (preview) { preview.style.display = 'none'; (preview as HTMLImageElement).src = ''; }
  }

  // ─── Toast & session ────────────────────────────────────────────────────

  showToast(msg: string, type: 'success' | 'error'): void {
    const toast = document.getElementById('toast')!;
    toast.textContent = msg;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3500);
  }

  private handleSessionExpired(): void {
    localStorage.clear();
    this.showToast('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.', 'error');
    setTimeout(() => { window.location.href = '/login'; }, 2000);
  }
}
