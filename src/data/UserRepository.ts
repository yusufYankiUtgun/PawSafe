import { User } from '../interfaces/types';
import { mockUsers } from './mockData';

export class UserRepository {
  private users: User[] = mockUsers.map(u => ({ ...u }));

  getAll(): User[] {
    return [...this.users];
  }

  getById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getByEmail(email: string): User | undefined {
    return this.users.find(u => u.email === email);
  }

  save(user: User): User {
    this.users.push(user);
    return user;
  }

  incrementTrustScore(userId: string): number {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.trustScore++;
      return user.trustScore;
    }
    return 0;
  }

  addTrustScore(userId: string, points: number): number {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.trustScore += points;
      return user.trustScore;
    }
    return 0;
  }

  getLeaderboard(): Omit<User, 'password' | 'email'>[] {
    return [...this.users]
      .filter(u => u.role !== 'admin')
      .sort((a, b) => b.trustScore - a.trustScore)
      .map(({ password, email, ...u }) => u);
  }
}
