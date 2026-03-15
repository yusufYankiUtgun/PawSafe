import { MapFacade } from '../facade/MapFacade';
import { Marker } from '../interfaces/types';

const API = '';

export class MapView {
  private facade: MapFacade;
  private markers: Marker[] = [];
  private selectedLat: number | null = null;
  private selectedLng: number | null = null;

  constructor() {
    this.facade = new MapFacade('map');
    this.facade.onMapClick((lat, lng) => this.onMapClick(lat, lng));
  }

  private onMapClick(lat: number, lng: number): void {
    const token = localStorage.getItem('token');
    if (!token) return;
    this.selectedLat = lat;
    this.selectedLng = lng;
    (document.getElementById('add-marker-modal') as HTMLElement).style.display = 'flex';
    (document.getElementById('coord-preview') as HTMLElement).textContent =
      `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }

  async loadMarkers(): Promise<void> {
    const res = await fetch(`${API}/api/markers`);
    this.markers = await res.json();
    this.facade.clearMarkers();
    this.markers.forEach(m => this.addMarkerToMap(m));
  }

  private addMarkerToMap(m: Marker): void {
    const danger: 'low' | 'medium' | 'high' =
      m.disputeCount > m.validationCount ? 'low' :
      m.validationCount >= 3 ? 'high' : 'medium';

    const popup = this.buildPopup(m);
    this.facade.addMarker(m.id, m.lat, m.lng, popup, danger);
  }

  private buildPopup(m: Marker): string {
    const token = localStorage.getItem('token');
    const actionButtons = token ? `
      <div class="popup-actions">
        <button class="btn-validate" onclick="window.mapView.vote('${m.id}','validate')">✅ Doğrula</button>
        <button class="btn-dispute" onclick="window.mapView.vote('${m.id}','dispute')">⚠️ İtiraz</button>
      </div>` : '';

    return `
      <div class="marker-popup">
        <img src="${m.imageUrl}" alt="marker" onerror="this.src='/images/dogs/dog1.jpg'"/>
        <h3>${m.description || 'Sahipsiz Hayvan'}</h3>
        <p class="popup-meta">
          <span>👤 ${m.reporterName}</span>
          <span>📅 ${m.createdAt}</span>
        </p>
        <p class="popup-meta">
          <span>🐾 ${m.animalCount} hayvan</span>
          <span>✅ ${m.validationCount} | ⚠️ ${m.disputeCount}</span>
        </p>
        ${actionButtons}
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
    } else {
      this.showToast(data.error, 'error');
    }
  }

  async addMarker(description: string, animalCount: number): Promise<void> {
    if (this.selectedLat === null || this.selectedLng === null) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const res = await fetch(`${API}/api/markers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        lat: this.selectedLat,
        lng: this.selectedLng,
        description,
        animalCount,
      }),
    });

    if (res.ok) {
      this.closeModal();
      await this.loadMarkers();
      this.showToast('Marker eklendi!', 'success');
    }
  }

  closeModal(): void {
    (document.getElementById('add-marker-modal') as HTMLElement).style.display = 'none';
    this.selectedLat = null;
    this.selectedLng = null;
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    const toast = document.getElementById('toast')!;
    toast.textContent = msg;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
}
