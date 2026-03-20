import { Marker } from './types';

/**
 * Strategy Pattern: defines a family of interchangeable map rendering modes.
 * Concrete strategies (MarkerViewStrategy, HeatmapViewStrategy) implement
 * this contract so that MapView can switch between modes without knowing
 * the rendering details (OCP – open for extension, closed for modification).
 */
export interface IMapViewStrategy {
  /** Render markers using this strategy's visual representation. */
  render(markers: Marker[]): void;
  /** Remove this strategy's visual elements from the map. */
  clear(): void;
  /** Human-readable name, useful for UI toggling. */
  getName(): 'markers' | 'heatmap';
}
