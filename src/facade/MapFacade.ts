import * as L from 'leaflet';

// leaflet-heat is loaded via CDN; access through global L
declare const HeatmapLayerFactory: any;

export class MapFacade {
  private map: L.Map;
  private markers: Map<string, L.Marker> = new Map();
  private heatLayer: any = null;
  private heatVisible = false;

  constructor(containerId: string, center: [number, number] = [41.015, 28.979], zoom: number = 12) {
    this.map = L.map(containerId, { center, zoom });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);
  }

  addMarker(
    id: string,
    lat: number,
    lng: number,
    popupContent: string,
    dangerLevel: 'low' | 'medium' | 'high' = 'medium'
  ): void {
    const colorMap = { low: '#4CAF50', medium: '#FF9800', high: '#F44336' };
    const color = colorMap[dangerLevel];

    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:36px;height:36px;border-radius:50% 50% 50% 0;
        background:${color};border:3px solid #fff;
        box-shadow:0 2px 8px rgba(0,0,0,0.4);
        transform:rotate(-45deg);
        display:flex;align-items:center;justify-content:center;
      "><span style="transform:rotate(45deg);font-size:16px;">🐾</span></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    });

    const marker = L.marker([lat, lng], { icon })
      .addTo(this.map)
      .bindPopup(popupContent, { maxWidth: 320, className: 'paw-popup' });

    this.markers.set(id, marker);
  }

  removeMarker(id: string): void {
    const m = this.markers.get(id);
    if (m) {
      this.map.removeLayer(m);
      this.markers.delete(id);
    }
  }

  openPopup(id: string): void {
    this.markers.get(id)?.openPopup();
  }

  clearMarkers(): void {
    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers.clear();
  }

  fitBounds(coords: [number, number][]): void {
    if (coords.length === 0) return;
    this.map.fitBounds(L.latLngBounds(coords));
  }

  onMapClick(handler: (lat: number, lng: number) => void): void {
    this.map.on('click', (e: L.LeafletMouseEvent) => handler(e.latlng.lat, e.latlng.lng));
  }

  updateHeatmap(points: [number, number, number][]): void {
    const L_any = L as any;
    if (this.heatLayer) {
      this.map.removeLayer(this.heatLayer);
      this.heatLayer = null;
    }
    if (typeof L_any.heatLayer === 'function') {
      this.heatLayer = L_any.heatLayer(points, {
        radius: 35,
        blur: 20,
        maxZoom: 17,
        gradient: { 0.4: '#2196F3', 0.65: '#FF9800', 1.0: '#F44336' },
      });
      if (this.heatVisible) {
        this.heatLayer.addTo(this.map);
      }
    }
  }

  toggleHeatmap(): boolean {
    if (!this.heatLayer) return false;
    if (this.heatVisible) {
      this.map.removeLayer(this.heatLayer);
      this.heatVisible = false;
    } else {
      this.heatLayer.addTo(this.map);
      this.heatVisible = true;
    }
    return this.heatVisible;
  }

  getMap(): L.Map {
    return this.map;
  }
}
