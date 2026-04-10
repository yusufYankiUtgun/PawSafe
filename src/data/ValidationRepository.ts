import * as mysql from 'mysql2/promise';
import { Validation } from '../interfaces/types';
import { mockValidations } from './mockData';

function rowToValidation(r: any): Validation {
  return {
    id:          r.id,
    markerId:    r.marker_id,
    userId:      r.user_id,
    type:        r.type,
    createdAt:   r.created_at,
    reason:      r.reason    ?? undefined,
    explanation: r.explanation ?? undefined,
  };
}

export class ValidationRepository {
  private validations: Validation[] = [];

  constructor(private pool: mysql.Pool | null = null) {
    if (!pool) {
      this.validations = [...mockValidations];
    }
  }

  async getAll(): Promise<Validation[]> {
    if (!this.pool) return [...this.validations];
    const [rows] = await this.pool.execute('SELECT * FROM validations');
    return (rows as any[]).map(rowToValidation);
  }

  async hasVoted(markerId: string, userId: string): Promise<boolean> {
    if (!this.pool) {
      return this.validations.some(v => v.markerId === markerId && v.userId === userId);
    }
    const [rows] = await this.pool.execute(
      'SELECT 1 FROM validations WHERE marker_id = ? AND user_id = ? LIMIT 1',
      [markerId, userId],
    );
    return (rows as any[]).length > 0;
  }

  /**
   * Persists a validation record.  id and createdAt are generated here if
   * not provided, so callers do not need to supply them.
   */
  async save(
    data: Omit<Validation, 'id' | 'createdAt'> & Partial<Pick<Validation, 'id' | 'createdAt'>>,
  ): Promise<Validation> {
    const validation: Validation = {
      id:          data.id        || `v${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt:   data.createdAt || new Date().toISOString(),
      markerId:    data.markerId,
      userId:      data.userId,
      type:        data.type,
      reason:      data.reason,
      explanation: data.explanation,
    };

    if (!this.pool) {
      this.validations.push(validation);
      return validation;
    }

    await this.pool.execute(
      `INSERT INTO validations (id, marker_id, user_id, type, created_at, reason, explanation)
       VALUES (?,?,?,?,?,?,?)`,
      [
        validation.id, validation.markerId, validation.userId,
        validation.type, validation.createdAt,
        validation.reason ?? null, validation.explanation ?? null,
      ],
    );
    return validation;
  }

  async getByMarkerId(markerId: string): Promise<Validation[]> {
    if (!this.pool) return this.validations.filter(v => v.markerId === markerId);
    const [rows] = await this.pool.execute(
      'SELECT * FROM validations WHERE marker_id = ?',
      [markerId],
    );
    return (rows as any[]).map(rowToValidation);
  }
}
