import { ISubject } from '../interfaces/ISubject';
import { IObserver } from '../interfaces/IObserver';
import { ValidationEvent } from '../interfaces/types';
import { ValidationRepository } from '../data/ValidationRepository';
import { MarkerRepository } from '../data/MarkerRepository';

export class ValidationService implements ISubject {
  private observers: IObserver[] = [];

  constructor(
    private validationRepo: ValidationRepository,
    private markerRepo: MarkerRepository
  ) {}

  subscribe(observer: IObserver): void {
    this.observers.push(observer);
  }

  unsubscribe(observer: IObserver): void {
    this.observers = this.observers.filter(o => o !== observer);
  }

  notify(event: ValidationEvent): void {
    this.observers.forEach(o => o.update(event));
  }

  validate(markerId: string, userId: string): { success: boolean; message: string } {
    if (this.validationRepo.hasVoted(markerId, userId)) {
      return { success: false, message: 'Zaten oy kullandınız.' };
    }

    const marker = this.markerRepo.getById(markerId);
    if (!marker) return { success: false, message: 'Marker bulunamadı.' };

    this.validationRepo.save({ markerId, userId, type: 'validate' });
    this.markerRepo.incrementValidation(markerId);

    this.notify({
      markerId,
      reporterId: marker.reporterId,
      validatorId: userId,
      validationType: 'validate',
    });

    return { success: true, message: 'Doğrulama başarılı.' };
  }

  dispute(markerId: string, userId: string): { success: boolean; message: string } {
    if (this.validationRepo.hasVoted(markerId, userId)) {
      return { success: false, message: 'Zaten oy kullandınız.' };
    }

    const marker = this.markerRepo.getById(markerId);
    if (!marker) return { success: false, message: 'Marker bulunamadı.' };

    this.validationRepo.save({ markerId, userId, type: 'dispute' });
    this.markerRepo.incrementDispute(markerId);

    this.notify({
      markerId,
      reporterId: marker.reporterId,
      validatorId: userId,
      validationType: 'dispute',
    });

    return { success: true, message: 'İtiraz kaydedildi.' };
  }
}
