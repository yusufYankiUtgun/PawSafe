import { Marker } from '../interfaces/types';
import { MarkerRepository } from '../data/MarkerRepository';
import { getRandomDogImage } from '../config/imageConfig';

export class MarkerService {
  constructor(private markerRepo: MarkerRepository) {}

  createMarker(
    lat: number,
    lng: number,
    imageUrl: string,
    userId: string,
    username: string,
    description: string,
    animalCount: number
  ): Marker {
    const marker: Marker = {
      id: `m${Date.now()}`,
      lat,
      lng,
      imageUrl: imageUrl || getRandomDogImage(),
      description,
      reporterId: userId,
      reporterName: username,
      validationCount: 0,
      disputeCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      animalCount: animalCount || 1,
    };
    return this.markerRepo.save(marker);
  }

  getAll(): Marker[] {
    return this.markerRepo.getAll();
  }

  getById(id: string): Marker | undefined {
    return this.markerRepo.getById(id);
  }

  delete(id: string): boolean {
    return this.markerRepo.delete(id);
  }
}
