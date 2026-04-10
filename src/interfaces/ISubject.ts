import { IObserver } from './IObserver';
import { ValidationEvent } from './types';

export interface ISubject {
  subscribe(observer: IObserver): void;
  unsubscribe(observer: IObserver): void;
  notify(event: ValidationEvent): Promise<void>;
}
