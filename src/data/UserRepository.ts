import * as mysql from 'mysql2/promise';
import { User } from '../interfaces/types';
import { mockUsers } from './mockData';

function rowToUser(r: any): User {
  return {
    id:         r.id,
    username:   r.username,
    email:      r.email,
    password:   r.password,
    trustScore: r.trust_score,
    role:       r.role,
  };
}

export class UserRepository {
  private users: User[] = [];

  constructor(private pool: mysql.Pool | null = null) {
    if (!pool) {
      this.users = mockUsers.map(u => ({ ...u }));
    }
  }

  async getAll(): Promise<User[]> {
    if (!this.pool) return [...this.users];
    const [rows] = await this.pool.execute('SELECT * FROM users');
    return (rows as any[]).map(rowToUser);
  }

  async getById(id: string): Promise<User | undefined> {
    if (!this.pool) return this.users.find(u => u.id === id);
    const [rows] = await this.pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    const r = (rows as any[])[0];
    return r ? rowToUser(r) : undefined;
  }

  async getByEmail(email: string): Promise<User | undefined> {
    if (!this.pool) return this.users.find(u => u.email === email);
    const [rows] = await this.pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    const r = (rows as any[])[0];
    return r ? rowToUser(r) : undefined;
  }

  async save(user: User): Promise<User> {
    if (!this.pool) {
      this.users.push(user);
      return user;
    }
    await this.pool.execute(
      'INSERT INTO users (id, username, email, password, trust_score, role) VALUES (?,?,?,?,?,?)',
      [user.id, user.username, user.email, user.password, user.trustScore, user.role],
    );
    return user;
  }

  async incrementTrustScore(userId: string): Promise<number> {
    if (!this.pool) {
      const user = this.users.find(u => u.id === userId);
      if (user) { user.trustScore++; return user.trustScore; }
      return 0;
    }
    await this.pool.execute('UPDATE users SET trust_score = trust_score + 1 WHERE id = ?', [userId]);
    const [rows] = await this.pool.execute('SELECT trust_score FROM users WHERE id = ?', [userId]);
    return (rows as any[])[0]?.trust_score ?? 0;
  }

  async addTrustScore(userId: string, points: number): Promise<number> {
    if (!this.pool) {
      const user = this.users.find(u => u.id === userId);
      if (user) { user.trustScore += points; return user.trustScore; }
      return 0;
    }
    await this.pool.execute('UPDATE users SET trust_score = trust_score + ? WHERE id = ?', [points, userId]);
    const [rows] = await this.pool.execute('SELECT trust_score FROM users WHERE id = ?', [userId]);
    return (rows as any[])[0]?.trust_score ?? 0;
  }

  async getLeaderboard(): Promise<Omit<User, 'password' | 'email'>[]> {
    if (!this.pool) {
      return [...this.users]
        .filter(u => u.role !== 'admin')
        .sort((a, b) => b.trustScore - a.trustScore)
        .map(({ password, email, ...u }) => u);
    }
    const [rows] = await this.pool.execute(
      'SELECT id, username, trust_score, role FROM users WHERE role != ? ORDER BY trust_score DESC',
      ['admin'],
    );
    return (rows as any[]).map(r => ({
      id:         r.id,
      username:   r.username,
      trustScore: r.trust_score,
      role:       r.role,
    }));
  }
}
