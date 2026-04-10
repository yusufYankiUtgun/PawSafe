import { ValidationEvent } from './types';

export interface IObserver {
  update(event: ValidationEvent): Promise<void>;
}
