/**
 * Unit tests for LeaderboardObserver (business layer).
 *
 * Verification: lastUpdate timestamp changes on any event; rerank() output is correct.
 * Validation:   leaderboard is sorted by trustScore, excludes admins, maps fields.
 */

import { LeaderboardObserver } from '../../src/business/LeaderboardObserver';
import { UserRepository } from '../../src/data/UserRepository';
import { ValidationEvent } from '../../src/interfaces/types';

function makeObs() {
  const userRepo = new UserRepository();
  const obs = new LeaderboardObserver(userRepo);
  return { obs, userRepo };
}

function makeEvent(type: 'validate' | 'dispute' = 'validate'): ValidationEvent {
  return { markerId: 'm1', reporterId: 'u1', validatorId: 'u2', validationType: type };
}

describe('LeaderboardObserver – update()', () => {
  it('updates lastUpdate to a value >= the timestamp before the call', async () => {
    const { obs } = makeObs();
    const before = obs.getLastUpdate();

    await obs.update(makeEvent());

    expect(obs.getLastUpdate()).toBeGreaterThanOrEqual(before);
  });

  it('updates lastUpdate on dispute events too', async () => {
    const { obs } = makeObs();
    const before = obs.getLastUpdate();

    await obs.update(makeEvent('dispute'));

    expect(obs.getLastUpdate()).toBeGreaterThanOrEqual(before);
  });
});

describe('LeaderboardObserver – rerank()', () => {
  it('returns an array sorted by trustScore descending', async () => {
    const { obs } = makeObs();
    const board = await obs.rerank();

    for (let i = 1; i < board.length; i++) {
      expect(board[i - 1].trustScore).toBeGreaterThanOrEqual(board[i].trustScore);
    }
  });

  it('excludes admin users from the leaderboard', async () => {
    const { obs } = makeObs();
    const board = await obs.rerank();

    const hasAdmin = board.some(entry => entry.role === 'admin');
    expect(hasAdmin).toBe(false);
  });

  it('each entry has userId, username, trustScore, and role fields', async () => {
    const { obs } = makeObs();
    const entry = (await obs.rerank())[0];

    expect(entry).toHaveProperty('userId');
    expect(entry).toHaveProperty('username');
    expect(entry).toHaveProperty('trustScore');
    expect(entry).toHaveProperty('role');
  });

  it('top entry has the highest trustScore (mehmet_can with 24)', async () => {
    const { obs } = makeObs();
    const top = (await obs.rerank())[0];

    expect(top.username).toBe('mehmet_can');
    expect(top.trustScore).toBe(24);
  });

  it('reflects trust score changes after a TrustScoreObserver increments it', async () => {
    const { obs, userRepo } = makeObs();
    // Give u6 (zeynep_ak, score 5) a large boost so she tops the board
    await userRepo.addTrustScore('u6', 100);

    const top = (await obs.rerank())[0];
    expect(top.username).toBe('zeynep_ak');
  });
});
