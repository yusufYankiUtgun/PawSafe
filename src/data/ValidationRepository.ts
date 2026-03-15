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

  save(validation: Validation): Validation {
    this.validations.push(validation);
    return validation;
  }

  getByMarkerId(markerId: string): Validation[] {
    return this.validations.filter(v => v.markerId === markerId);
  }
}
