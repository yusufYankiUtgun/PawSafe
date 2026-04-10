/**
 * Unit tests for UserRepository (data layer).
 *
 * Verification: CRUD operations, trust score mutations, leaderboard ordering.
 * Validation:   password and email are excluded from the leaderboard; admin is filtered out.
 */

import { UserRepository } from '../../src/data/UserRepository';
import { User } from '../../src/interfaces/types';

function makeRepo() {
  return new UserRepository();
}

const NEW_USER: User = {
  id: 'u_test',
  username: 'test_user',
  email: 'test@test.com',
  password: 'gizli',
  trustScore: 0,
  role: 'user',
};

// ─── getAll() ─────────────────────────────────────────────────────────────────

describe('UserRepository – getAll()', () => {
  it('returns all seeded mock users', async () => {
    const repo = makeRepo();
    const users = await repo.getAll();
    // 6 regular + 1 admin in mockData
    expect(users.length).toBe(7);
  });

  it('returns a copy — mutating the result does not affect the store', async () => {
    const repo = makeRepo();
    const first = await repo.getAll();
    first.pop();
    expect((await repo.getAll()).length).toBe(7);
  });
});

// ─── getById() ────────────────────────────────────────────────────────────────

describe('UserRepository – getById()', () => {
  it('returns the correct user for a known id', async () => {
    const repo = makeRepo();
    const user = await repo.getById('u1');

    expect(user).toBeDefined();
    expect(user!.username).toBe('mehmet_can');
  });

  it('returns undefined for an unknown id', async () => {
    const repo = makeRepo();
    expect(await repo.getById('yok')).toBeUndefined();
  });
});

// ─── getByEmail() ─────────────────────────────────────────────────────────────

describe('UserRepository – getByEmail()', () => {
  it('returns the correct user for a known e-mail', async () => {
    const repo = makeRepo();
    const user = await repo.getByEmail('ayse@example.com');

    expect(user).toBeDefined();
    expect(user!.id).toBe('u2');
  });

  it('returns undefined for an unknown e-mail', async () => {
    const repo = makeRepo();
    expect(await repo.getByEmail('yok@example.com')).toBeUndefined();
  });
});

// ─── save() ───────────────────────────────────────────────────────────────────

describe('UserRepository – save()', () => {
  it('persists the new user and makes it retrievable', async () => {
    const repo = makeRepo();
    await repo.save(NEW_USER);

    const found = await repo.getById('u_test');
    expect(found).toBeDefined();
    expect(found!.username).toBe('test_user');
  });

  it('increases the total user count by 1', async () => {
    const repo = makeRepo();
    const before = (await repo.getAll()).length;

    await repo.save(NEW_USER);

    expect((await repo.getAll()).length).toBe(before + 1);
  });
});

// ─── incrementTrustScore() ────────────────────────────────────────────────────

describe('UserRepository – incrementTrustScore()', () => {
  it('increments by exactly 1 and returns the new score', async () => {
    const repo = makeRepo();
    const before = (await repo.getById('u1'))!.trustScore;

    const newScore = await repo.incrementTrustScore('u1');

    expect(newScore).toBe(before + 1);
    expect((await repo.getById('u1'))!.trustScore).toBe(before + 1);
  });

  it('returns 0 and does not throw for an unknown userId', async () => {
    const repo = makeRepo();
    expect(await repo.incrementTrustScore('olmayan')).toBe(0);
  });
});

// ─── addTrustScore() ──────────────────────────────────────────────────────────

describe('UserRepository – addTrustScore()', () => {
  it('adds the specified points and returns the new total', async () => {
    const repo = makeRepo();
    const before = (await repo.getById('u2'))!.trustScore; // 18

    const newScore = await repo.addTrustScore('u2', 10);

    expect(newScore).toBe(before + 10);
    expect((await repo.getById('u2'))!.trustScore).toBe(before + 10);
  });

  it('returns 0 for an unknown userId', async () => {
    const repo = makeRepo();
    expect(await repo.addTrustScore('olmayan', 50)).toBe(0);
  });
});

// ─── getLeaderboard() ─────────────────────────────────────────────────────────

describe('UserRepository – getLeaderboard()', () => {
  it('returns users sorted by trustScore descending', async () => {
    const repo = makeRepo();
    const board = await repo.getLeaderboard();

    for (let i = 1; i < board.length; i++) {
      expect(board[i - 1].trustScore).toBeGreaterThanOrEqual(board[i].trustScore);
    }
  });

  it('excludes admins from the leaderboard', async () => {
    const repo = makeRepo();
    const board = await repo.getLeaderboard();

    expect(board.some(u => u.role === 'admin')).toBe(false);
  });

  it('does not expose password or email fields', async () => {
    const repo = makeRepo();
    const board = await repo.getLeaderboard();

    board.forEach(u => {
      expect((u as any).password).toBeUndefined();
      expect((u as any).email).toBeUndefined();
    });
  });

  it('top entry is mehmet_can (trustScore 24)', async () => {
    const repo = makeRepo();
    const top = (await repo.getLeaderboard())[0];

    expect(top.username).toBe('mehmet_can');
    expect(top.trustScore).toBe(24);
  });
});
