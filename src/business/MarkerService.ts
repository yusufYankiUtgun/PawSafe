import { Marker, DogSize, DogColor, EarTagColor, DogClassification } from '../interfaces/types';
import { MarkerRepository } from '../data/MarkerRepository';
import { UserRepository } from '../data/UserRepository';

const POINTS_PER_MARKER = 10;

export class MarkerService {
  constructor(
    private markerRepo: MarkerRepository,
    private userRepo?: UserRepository,
  ) {}

  createMarker(
    lat: number,
    lng: number,
    imageUrl: string,
    userId: string,
    username: string,
    description: string,
    animalCount: number,
    size?: DogSize,
    color?: DogColor,
    earTagColor?: EarTagColor,
    classification?: DogClassification,
    address?: string,
  ): Marker {
    const marker: Marker = {
      id: `m${Date.now()}`,
      lat,
      lng,
      imageUrl: '',
      description,
      reporterId: userId,
      reporterName: username,
      validationCount: 0,
      disputeCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      animalCount: animalCount || 1,
      size,
      color,
      earTagColor,
      classification,
      address,
    };
    const saved = this.markerRepo.save(marker);
    this.userRepo?.addTrustScore(userId, POINTS_PER_MARKER);
    return saved;
  }

  update(id: string, fields: Partial<Marker>): Marker | undefined {
    return this.markerRepo.update(id, fields);
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
