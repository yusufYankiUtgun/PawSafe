import { IObserver } from '../interfaces/IObserver';
import { ValidationEvent } from '../interfaces/types';
import { UserRepository } from '../data/UserRepository';

export class TrustScoreObserver implements IObserver {
  constructor(private userRepo: UserRepository) {}

  async update(event: ValidationEvent): Promise<void> {
    if (event.validationType === 'validate') {
      await this.userRepo.incrementTrustScore(event.reporterId);
    }
  }
}
