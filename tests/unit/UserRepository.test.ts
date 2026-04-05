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
  it('returns all seeded mock users', () => {
    const repo = makeRepo();
    const users = repo.getAll();
    // 6 regular + 1 admin in mockData
    expect(users.length).toBe(7);
  });

  it('returns a copy — mutating the result does not affect the store', () => {
    const repo = makeRepo();
    const first = repo.getAll();
    first.pop();
    expect(repo.getAll().length).toBe(7);
  });
});

// ─── getById() ────────────────────────────────────────────────────────────────

describe('UserRepository – getById()', () => {
  it('returns the correct user for a known id', () => {
    const repo = makeRepo();
    const user = repo.getById('u1');

    expect(user).toBeDefined();
    expect(user!.username).toBe('mehmet_can');
  });

  it('returns undefined for an unknown id', () => {
    const repo = makeRepo();
    expect(repo.getById('yok')).toBeUndefined();
  });
});

// ─── getByEmail() ─────────────────────────────────────────────────────────────

describe('UserRepository – getByEmail()', () => {
  it('returns the correct user for a known e-mail', () => {
    const repo = makeRepo();
    const user = repo.getByEmail('ayse@example.com');

    expect(user).toBeDefined();
    expect(user!.id).toBe('u2');
  });

  it('returns undefined for an unknown e-mail', () => {
    const repo = makeRepo();
    expect(repo.getByEmail('yok@example.com')).toBeUndefined();
  });
});

// ─── save() ───────────────────────────────────────────────────────────────────

describe('UserRepository – save()', () => {
  it('persists the new user and makes it retrievable', () => {
    const repo = makeRepo();
    repo.save(NEW_USER);

    expect(repo.getById('u_test')).toBeDefined();
    expect(repo.getById('u_test')!.username).toBe('test_user');
  });

  it('increases the total user count by 1', () => {
    const repo = makeRepo();
    const before = repo.getAll().length;

    repo.save(NEW_USER);

    expect(repo.getAll().length).toBe(before + 1);
  });
});

// ─── incrementTrustScore() ────────────────────────────────────────────────────

describe('UserRepository – incrementTrustScore()', () => {
  it('increments by exactly 1 and returns the new score', () => {
    const repo = makeRepo();
    const before = repo.getById('u1')!.trustScore;

    const newScore = repo.incrementTrustScore('u1');

    expect(newScore).toBe(before + 1);
    expect(repo.getById('u1')!.trustScore).toBe(before + 1);
  });

  it('returns 0 and does not throw for an unknown userId', () => {
    const repo = makeRepo();
    expect(repo.incrementTrustScore('olmayan')).toBe(0);
  });
});

// ─── addTrustScore() ──────────────────────────────────────────────────────────

describe('UserRepository – addTrustScore()', () => {
  it('adds the specified points and returns the new total', () => {
    const repo = makeRepo();
    const before = repo.getById('u2')!.trustScore; // 18

    const newScore = repo.addTrustScore('u2', 10);

    expect(newScore).toBe(before + 10);
    expect(repo.getById('u2')!.trustScore).toBe(before + 10);
  });

  it('returns 0 for an unknown userId', () => {
    const repo = makeRepo();
    expect(repo.addTrustScore('olmayan', 50)).toBe(0);
  });
});

// ─── getLeaderboard() ─────────────────────────────────────────────────────────

describe('UserRepository – getLeaderboard()', () => {
  it('returns users sorted by trustScore descending', () => {
    const repo = makeRepo();
    const board = repo.getLeaderboard();

    for (let i = 1; i < board.length; i++) {
      expect(board[i - 1].trustScore).toBeGreaterThanOrEqual(board[i].trustScore);
    }
  });

  it('excludes admins from the leaderboard', () => {
    const repo = makeRepo();
    const board = repo.getLeaderboard();

    expect(board.some(u => u.role === 'admin')).toBe(false);
  });

  it('does not expose password or email fields', () => {
    const repo = makeRepo();
    const board = repo.getLeaderboard();

    board.forEach(u => {
      expect((u as any).password).toBeUndefined();
      expect((u as any).email).toBeUndefined();
    });
  });

  it('top entry is mehmet_can (trustScore 24)', () => {
    const repo = makeRepo();
    const top = repo.getLeaderboard()[0];

    expect(top.username).toBe('mehmet_can');
    expect(top.trustScore).toBe(24);
  });
});
