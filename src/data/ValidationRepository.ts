import { Validation } from '../interfaces/types';
import { mockValidations } from './mockData';

export class ValidationRepository {
  private validations: Validation[] = [...mockValidations];

  getAll(): Validation[] {
    return [...this.validations];
  }

  hasVoted(markerId: string, userId: string): boolean {
    return this.validations.some(v => v.markerId === markerId && v.userId === userId);
  }

  /**
   * Persists a validation record.  id and createdAt are generated here if
   * not provided, so callers do not need to supply them.
   */
  save(data: Omit<Validation, 'id' | 'createdAt'> & Partial<Pick<Validation, 'id' | 'createdAt'>>): Validation {
    const validation: Validation = {
      id: data.id || `v${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: data.createdAt || new Date().toISOString(),
      markerId: data.markerId,
      userId: data.userId,
      type: data.type,
      reason: data.reason,
      explanation: data.explanation,
    };
    this.validations.push(validation);
    return validation;
  }

  getByMarkerId(markerId: string): Validation[] {
    return this.validations.filter(v => v.markerId === markerId);
  }
}
