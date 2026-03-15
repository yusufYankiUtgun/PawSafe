import { Marker } from '../interfaces/types';
import { mockMarkers } from './mockData';

export class MarkerRepository {
  private markers: Marker[] = [...mockMarkers];

  getAll(): Marker[] {
    return [...this.markers];
  }

  getById(id: string): Marker | undefined {
    return this.markers.find(m => m.id === id);
  }

  save(marker: Marker): Marker {
    this.markers.push(marker);
    return marker;
  }

  delete(id: string): boolean {
    const idx = this.markers.findIndex(m => m.id === id);
    if (idx === -1) return false;
    this.markers.splice(idx, 1);
    return true;
  }

  incrementValidation(id: string): void {
    const marker = this.markers.find(m => m.id === id);
    if (marker) marker.validationCount++;
  }

  incrementDispute(id: string): void {
    const marker = this.markers.find(m => m.id === id);
    if (marker) marker.disputeCount++;
  }
}
