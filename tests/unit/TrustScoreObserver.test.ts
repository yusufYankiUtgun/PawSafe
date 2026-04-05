/**
 * Unit tests for TrustScoreObserver (business layer).
 *
 * Verification: trust score increments only on 'validate' events.
 * Validation:   reporter score is unchanged when a dispute occurs.
 */

import { TrustScoreObserver } from '../../src/business/TrustScoreObserver';
import { UserRepository } from '../../src/data/UserRepository';
import { ValidationEvent } from '../../src/interfaces/types';

function makeObs() {
  const userRepo = new UserRepository();
  const obs = new TrustScoreObserver(userRepo);
  return { obs, userRepo };
}

describe('TrustScoreObserver – update()', () => {
  it('increments the reporter\'s trust score by 1 on a "validate" event', () => {
    const { obs, userRepo } = makeObs();
    const scoreBefore = userRepo.getById('u1')!.trustScore;
    const event: ValidationEvent = {
      markerId: 'm1', reporterId: 'u1',
      validatorId: 'u2', validationType: 'validate',
    };

    obs.update(event);

    expect(userRepo.getById('u1')!.trustScore).toBe(scoreBefore + 1);
  });

  it('does NOT change the trust score on a "dispute" event', () => {
    const { obs, userRepo } = makeObs();
    const scoreBefore = userRepo.getById('u1')!.trustScore;
    const event: ValidationEvent = {
      markerId: 'm1', reporterId: 'u1',
      validatorId: 'u3', validationType: 'dispute',
      reason: 'spam',
    };

    obs.update(event);

    expect(userRepo.getById('u1')!.trustScore).toBe(scoreBefore);
  });

  it('accumulates trust score across multiple validate events', () => {
    const { obs, userRepo } = makeObs();
    const scoreBefore = userRepo.getById('u2')!.trustScore;
    const event = (validatorId: string): ValidationEvent => ({
      markerId: 'm1', reporterId: 'u2',
      validatorId, validationType: 'validate',
    });

    obs.update(event('u1'));
    obs.update(event('u3'));
    obs.update(event('u4'));

    expect(userRepo.getById('u2')!.trustScore).toBe(scoreBefore + 3);
  });

  it('is a no-op when the reporterId does not exist in the repository', () => {
    const { obs, userRepo } = makeObs();
    const event: ValidationEvent = {
      markerId: 'm1', reporterId: 'olmayan-kullanici',
      validatorId: 'u1', validationType: 'validate',
    };

    // Should not throw
    expect(() => obs.update(event)).not.toThrow();
  });
});
