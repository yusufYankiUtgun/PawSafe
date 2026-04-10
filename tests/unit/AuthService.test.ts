/**
 * Unit tests for AuthService (business layer).
 *
 * Verification: token format, duplicate-email guard, password exclusion.
 * Validation:   register/login/getUserFromToken behave as users expect.
 */

import { AuthService } from '../../src/business/AuthService';
import { UserRepository } from '../../src/data/UserRepository';

function makeSvc() {
  const userRepo = new UserRepository();
  const svc = new AuthService(userRepo);
  return { svc, userRepo };
}

// ─── register() ───────────────────────────────────────────────────────────────

describe('AuthService – register()', () => {
  it('returns a user (without password) and a token on success', async () => {
    const { svc } = makeSvc();
    const result = await svc.register('yeni@example.com', 'yeni_kullanici', 'sifre123');

    expect(result).not.toBeNull();
    expect(result!.user.email).toBe('yeni@example.com');
    expect(result!.user.username).toBe('yeni_kullanici');
    expect((result!.user as any).password).toBeUndefined();
    expect(typeof result!.token).toBe('string');
  });

  it('returns null when the e-mail is already registered', async () => {
    const { svc } = makeSvc();
    await svc.register('tekrar@example.com', 'kullanici1', 'abc');

    const second = await svc.register('tekrar@example.com', 'kullanici2', 'xyz');

    expect(second).toBeNull();
  });

  it('new user starts with trustScore 0 and role "user"', async () => {
    const { svc } = makeSvc();
    const result = await svc.register('taze@example.com', 'taze_kul', 'pass');

    expect(result!.user.trustScore).toBe(0);
    expect(result!.user.role).toBe('user');
  });

  it('generated token follows mock-token-{userId} pattern', async () => {
    const { svc } = makeSvc();
    const result = await svc.register('token@example.com', 'token_kul', 'pass');

    expect(result!.token).toMatch(/^mock-token-u\d+$/);
  });
});

// ─── login() ──────────────────────────────────────────────────────────────────

describe('AuthService – login()', () => {
  it('returns user and token for correct credentials', async () => {
    const { svc } = makeSvc();
    // mehmet@example.com / 1234 exists in mockData
    const result = await svc.login('mehmet@example.com', '1234');

    expect(result).not.toBeNull();
    expect(result!.user.username).toBe('mehmet_can');
    expect((result!.user as any).password).toBeUndefined();
    expect(result!.token).toBe('mock-token-u1');
  });

  it('returns null for a wrong password', async () => {
    const { svc } = makeSvc();
    const result = await svc.login('mehmet@example.com', 'yanlis_sifre');

    expect(result).toBeNull();
  });

  it('returns null for an unknown e-mail', async () => {
    const { svc } = makeSvc();
    const result = await svc.login('yok@example.com', '1234');

    expect(result).toBeNull();
  });

  it('admin can log in with correct credentials', async () => {
    const { svc } = makeSvc();
    const result = await svc.login('admin@pawsafe.com', 'admin123');

    expect(result).not.toBeNull();
    expect(result!.user.role).toBe('admin');
  });
});

// ─── getUserFromToken() ───────────────────────────────────────────────────────

describe('AuthService – getUserFromToken()', () => {
  it('returns the matching user for a valid token', async () => {
    const { svc } = makeSvc();
    const user = await svc.getUserFromToken('mock-token-u1');

    expect(user).not.toBeNull();
    expect(user!.id).toBe('u1');
  });

  it('returns null for an empty string', async () => {
    const { svc } = makeSvc();
    expect(await svc.getUserFromToken('')).toBeNull();
  });

  it('returns null for a token that does not start with mock-token-', async () => {
    const { svc } = makeSvc();
    expect(await svc.getUserFromToken('Bearer tamamen-yanlis')).toBeNull();
  });

  it('returns null when the userId encoded in the token does not exist', async () => {
    const { svc } = makeSvc();
    expect(await svc.getUserFromToken('mock-token-olmayan-kullanici')).toBeNull();
  });
});
