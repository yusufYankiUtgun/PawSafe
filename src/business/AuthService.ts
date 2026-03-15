import { User } from '../interfaces/types';
import { UserRepository } from '../data/UserRepository';

export class AuthService {
  constructor(private userRepo: UserRepository) {}

  register(
    email: string,
    username: string,
    password: string
  ): { user: Omit<User, 'password'>; token: string } | null {
    const existing = this.userRepo.getByEmail(email);
    if (existing) return null;

    const newUser: User = {
      id: `u${Date.now()}`,
      username,
      email,
      password,
      trustScore: 0,
      role: 'user',
    };

    this.userRepo.save(newUser);
    const token = `mock-token-${newUser.id}`;
    const { password: _, ...safeUser } = newUser;
    return { user: safeUser, token };
  }

  login(
    email: string,
    password: string
  ): { user: Omit<User, 'password'>; token: string } | null {
    const user = this.userRepo.getByEmail(email);
    if (!user || user.password !== password) return null;

    const token = `mock-token-${user.id}`;
    const { password: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  getUserFromToken(token: string): User | null {
    if (!token || !token.startsWith('mock-token-')) return null;
    const userId = token.replace('mock-token-', '');
    return this.userRepo.getById(userId) || null;
  }
}
