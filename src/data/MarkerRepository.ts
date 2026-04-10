import * as mysql from 'mysql2/promise';
import { Marker } from '../interfaces/types';
import { mockMarkers } from './mockData';

function rowToMarker(r: any): Marker {
  return {
    id:              r.id,
    lat:             r.lat,
    lng:             r.lng,
    imageUrl:        r.image_url    ?? '',
    description:     r.description ?? '',
    reporterId:      r.reporter_id,
    reporterName:    r.reporter_name,
    validationCount: r.validation_count,
    disputeCount:    r.dispute_count,
    createdAt:       r.created_at,
    animalCount:     r.animal_count,
    size:            r.size          ?? undefined,
    color:           r.color         ?? undefined,
    earTagColor:     r.ear_tag_color ?? undefined,
    classification:  r.classification ?? undefined,
    address:         r.address       ?? undefined,
  };
}

export class MarkerRepository {
  private markers: Marker[] = [];

  constructor(private pool: mysql.Pool | null = null) {
    if (!pool) {
      this.markers = [...mockMarkers];
    }
  }

  async getAll(): Promise<Marker[]> {
    if (!this.pool) return [...this.markers];
    const [rows] = await this.pool.execute('SELECT * FROM markers');
    return (rows as any[]).map(rowToMarker);
  }

  async getById(id: string): Promise<Marker | undefined> {
    if (!this.pool) return this.markers.find(m => m.id === id);
    const [rows] = await this.pool.execute('SELECT * FROM markers WHERE id = ?', [id]);
    const r = (rows as any[])[0];
    return r ? rowToMarker(r) : undefined;
  }

  async save(marker: Marker): Promise<Marker> {
    if (!this.pool) {
      this.markers.push(marker);
      return marker;
    }
    await this.pool.execute(
      `INSERT INTO markers
         (id, lat, lng, image_url, description, reporter_id, reporter_name,
          validation_count, dispute_count, created_at, animal_count,
          size, color, ear_tag_color, classification, address)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        marker.id, marker.lat, marker.lng, marker.imageUrl || '',
        marker.description, marker.reporterId, marker.reporterName,
        marker.validationCount, marker.disputeCount, marker.createdAt,
        marker.animalCount,
        marker.size ?? null, marker.color ?? null, marker.earTagColor ?? null,
        marker.classification ?? null, marker.address ?? null,
      ],
    );
    return marker;
  }

  async update(id: string, fields: Partial<Marker>): Promise<Marker | undefined> {
    if (!this.pool) {
      const marker = this.markers.find(m => m.id === id);
      if (!marker) return undefined;
      Object.assign(marker, fields);
      return marker;
    }
    const sets: string[] = [];
    const vals: any[]    = [];
    const col: Record<string, string> = {
      description: 'description', animalCount: 'animal_count',
      size: 'size', color: 'color', earTagColor: 'ear_tag_color',
      classification: 'classification', imageUrl: 'image_url',
    };
    for (const [key, dbCol] of Object.entries(col)) {
      if (key in fields) { sets.push(`${dbCol} = ?`); vals.push((fields as any)[key] ?? null); }
    }
    if (!sets.length) return this.getById(id);
    vals.push(id);
    await this.pool.execute(`UPDATE markers SET ${sets.join(', ')} WHERE id = ?`, vals);
    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    if (!this.pool) {
      const idx = this.markers.findIndex(m => m.id === id);
      if (idx === -1) return false;
      this.markers.splice(idx, 1);
      return true;
    }
    const [result] = await this.pool.execute('DELETE FROM markers WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
  }

  async incrementValidation(id: string): Promise<void> {
    if (!this.pool) {
      const marker = this.markers.find(m => m.id === id);
      if (marker) marker.validationCount++;
      return;
    }
    await this.pool.execute('UPDATE markers SET validation_count = validation_count + 1 WHERE id = ?', [id]);
  }

  async incrementDispute(id: string): Promise<void> {
    if (!this.pool) {
      const marker = this.markers.find(m => m.id === id);
      if (marker) marker.disputeCount++;
      return;
    }
    await this.pool.execute('UPDATE markers SET dispute_count = dispute_count + 1 WHERE id = ?', [id]);
  }
}
