import { IObserver } from '../interfaces/IObserver';
import { ValidationEvent } from '../interfaces/types';
import { UserRepository } from '../data/UserRepository';

export class TrustScoreObserver implements IObserver {
  constructor(private userRepo: UserRepository) {}

  update(event: ValidationEvent): void {
    if (event.validationType === 'validate') {
      this.userRepo.incrementTrustScore(event.reporterId);
    }
  }
}
