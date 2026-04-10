import { User } from '../interfaces/types';
import { UserRepository } from '../data/UserRepository';

export class AuthService {
  constructor(private userRepo: UserRepository) {}

  async register(
    email: string,
    username: string,
    password: string
  ): Promise<{ user: Omit<User, 'password'>; token: string } | null> {
    const existing = await this.userRepo.getByEmail(email);
    if (existing) return null;

    const newUser: User = {
      id: `u${Date.now()}`,
      username,
      email,
      password,
      trustScore: 0,
      role: 'user',
    };

    await this.userRepo.save(newUser);
    const token = `mock-token-${newUser.id}`;
    const { password: _, ...safeUser } = newUser;
    return { user: safeUser, token };
  }

  async login(
    email: string,
    password: string
  ): Promise<{ user: Omit<User, 'password'>; token: string } | null> {
    const user = await this.userRepo.getByEmail(email);
    if (!user || user.password !== password) return null;

    const token = `mock-token-${user.id}`;
    const { password: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  async getUserFromToken(token: string): Promise<User | null> {
    if (!token || !token.startsWith('mock-token-')) return null;
    const userId = token.replace('mock-token-', '');
    return (await this.userRepo.getById(userId)) || null;
  }
}
