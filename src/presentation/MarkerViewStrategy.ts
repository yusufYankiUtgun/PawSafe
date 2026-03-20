import { IMapViewStrategy } from '../interfaces/IMapViewStrategy';
import { Marker } from '../interfaces/types';
import { MapFacade } from '../facade/MapFacade';

const SIZE_LABELS: Record<string, string> = { small: 'Küçük', medium: 'Orta', large: 'Büyük' };
const CLASS_LABELS: Record<string, string> = { friendly: 'Zararsız', aggressive: 'Zararlı' };
const CLASS_COLORS: Record<string, string> = { friendly: '#2E7D32', aggressive: '#C62828' };

/**
 * Strategy: render each marker as a colour-coded pin popup.
 * Concrete Strategy in the Strategy Pattern (pairs with HeatmapViewStrategy).
 */
export class MarkerViewStrategy implements IMapViewStrategy {
  constructor(private facade: MapFacade) {}

  render(markers: Marker[]): void {
    this.facade.clearMarkers();
    markers.forEach(m => this.addOne(m));
  }

  clear(): void {
    this.facade.clearMarkers();
  }

  getName(): 'markers' {
    return 'markers';
  }

  /** Exposed so MapView can add individual markers without a full re-render. */
  addOne(m: Marker): void {
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

    const imageHtml = m.imageUrl
      ? `<img src="${m.imageUrl}" class="popup-image" alt="Köpek fotoğrafı" loading="lazy"/>`
      : '';

    const ownerActions = isOwner ? `
      <div class="popup-actions">
        <button class="btn-edit" onclick="window.mapView.openEditModal('${m.id}')">✏️ Düzenle</button>
        <button class="btn-delete-marker" onclick="window.mapView.deleteMarker('${m.id}')">🗑️ Sil</button>
      </div>` : '';

    const voteButtons = token && !isOwner ? `
      <div class="popup-actions">
        <button class="btn-validate" onclick="window.mapView.vote('${m.id}','validate')">✅ Doğrula</button>
        <button class="btn-dispute" onclick="window.mapView.openDisputeModal('${m.id}')">⚠️ İtiraz</button>
      </div>` : '';

    return `
      <div class="marker-popup">
        <div class="popup-header" style="background:${classColor}">
          <span class="popup-classification">${classLabel || 'Bilinmiyor'}</span>
          <span class="popup-animal-count">🐾 ${m.animalCount} hayvan</span>
        </div>
        ${imageHtml}
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
}
