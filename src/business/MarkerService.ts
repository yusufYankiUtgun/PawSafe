import { Marker, DogSize, DogColor, EarTagColor, DogClassification } from '../interfaces/types';
import { MarkerRepository } from '../data/MarkerRepository';
import { UserRepository } from '../data/UserRepository';

const POINTS_PER_MARKER = 10;

export class MarkerService {
  constructor(
    private markerRepo: MarkerRepository,
    private userRepo?: UserRepository,
  ) {}

  async createMarker(
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
  ): Promise<Marker> {
    const marker: Marker = {
      id: `m${Date.now()}`,
      lat,
      lng,
      imageUrl: '',
      description,
      reporterId:      userId,
      reporterName:    username,
      validationCount: 0,
      disputeCount:    0,
      createdAt: new Date().toISOString().split('T')[0],
      animalCount: animalCount || 1,
      size,
      color,
      earTagColor,
      classification,
      address,
    };
    const saved = await this.markerRepo.save(marker);
    if (this.userRepo) {
      await this.userRepo.addTrustScore(userId, POINTS_PER_MARKER);
    }
    return saved;
  }

  async update(id: string, fields: Partial<Marker>): Promise<Marker | undefined> {
    return this.markerRepo.update(id, fields);
  }

  async getAll(): Promise<Marker[]> {
    return this.markerRepo.getAll();
  }

  async getById(id: string): Promise<Marker | undefined> {
    return this.markerRepo.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    return this.markerRepo.delete(id);
  }
}
