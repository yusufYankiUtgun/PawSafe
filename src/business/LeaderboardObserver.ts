import { IObserver } from '../interfaces/IObserver';
import { ValidationEvent } from '../interfaces/types';
import { UserRepository } from '../data/UserRepository';

export class LeaderboardObserver implements IObserver {
  private lastUpdate: number = Date.now();

  constructor(private userRepo: UserRepository) {}

  update(event: ValidationEvent): void {
    this.lastUpdate = Date.now();
  }

  rerank(): { userId: string; username: string; trustScore: number; role: string }[] {
    return this.userRepo.getLeaderboard();
  }

  getLastUpdate(): number {
    return this.lastUpdate;
  }
}
