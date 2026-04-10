import { IObserver } from '../interfaces/IObserver';
import { ValidationEvent } from '../interfaces/types';
import { UserRepository } from '../data/UserRepository';

export class LeaderboardObserver implements IObserver {
  private lastUpdate: number = Date.now();

  constructor(private userRepo: UserRepository) {}

  async update(_event: ValidationEvent): Promise<void> {
    this.lastUpdate = Date.now();
  }

  async rerank(): Promise<{ userId: string; username: string; trustScore: number; role: string }[]> {
    return (await this.userRepo.getLeaderboard()).map(u => ({
      userId:     u.id,
      username:   u.username,
      trustScore: u.trustScore,
      role:       u.role,
    }));
  }

  getLastUpdate(): number {
    return this.lastUpdate;
  }
}
