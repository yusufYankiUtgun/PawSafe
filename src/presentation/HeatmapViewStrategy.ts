import { IMapViewStrategy } from '../interfaces/IMapViewStrategy';
import { Marker } from '../interfaces/types';
import { MapFacade } from '../facade/MapFacade';

/**
 * Strategy: render markers as a heatmap overlay.
 * Concrete Strategy in the Strategy Pattern (pairs with MarkerViewStrategy).
 *
 * When this strategy is active:
 *  – Individual map pins are hidden.
 *  – Marker coordinates are fed to leaflet.heat weighted by validation count.
 *  – Switching back to MarkerViewStrategy restores normal pins.
 */
export class HeatmapViewStrategy implements IMapViewStrategy {
  constructor(private facade: MapFacade) {}

  render(markers: Marker[]): void {
    // Hide individual markers
    this.facade.clearMarkers();

    // Weight each point by its validation count (higher = hotter)
    const points: [number, number, number][] = markers.map(m => [
      m.lat,
      m.lng,
      Math.max(0.3, Math.min(1.0, m.validationCount / 10)),
    ]);
    this.facade.updateHeatmap(points);
    this.facade.showHeatmap();
  }

  clear(): void {
    this.facade.hideHeatmap();
  }

  getName(): 'heatmap' {
    return 'heatmap';
  }
}
