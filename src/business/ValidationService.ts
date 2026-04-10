import { ISubject } from '../interfaces/ISubject';
import { IObserver } from '../interfaces/IObserver';
import { ValidationEvent, DisputeReason } from '../interfaces/types';
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

  async notify(event: ValidationEvent): Promise<void> {
    await Promise.all(this.observers.map(o => o.update(event)));
  }

  async validate(markerId: string, userId: string): Promise<{ success: boolean; message: string }> {
    if (await this.validationRepo.hasVoted(markerId, userId)) {
      return { success: false, message: 'Zaten oy kullandınız.' };
    }

    const marker = await this.markerRepo.getById(markerId);
    if (!marker) return { success: false, message: 'Marker bulunamadı.' };

    await this.validationRepo.save({ markerId, userId, type: 'validate' });
    await this.markerRepo.incrementValidation(markerId);

    await this.notify({
      markerId,
      reporterId:     marker.reporterId,
      validatorId:    userId,
      validationType: 'validate',
    });

    return { success: true, message: 'Doğrulama başarılı.' };
  }

  /**
   * Record a dispute against a marker.
   *
   * @param markerId     – the marker being disputed
   * @param userId       – the user disputing
   * @param reason       – mandatory dispute reason category
   * @param explanation  – optional free-text explanation
   */
  async dispute(
    markerId: string,
    userId: string,
    reason: DisputeReason,
    explanation?: string,
  ): Promise<{ success: boolean; message: string }> {
    if (await this.validationRepo.hasVoted(markerId, userId)) {
      return { success: false, message: 'Zaten oy kullandınız.' };
    }

    const marker = await this.markerRepo.getById(markerId);
    if (!marker) return { success: false, message: 'Marker bulunamadı.' };

    await this.validationRepo.save({ markerId, userId, type: 'dispute', reason, explanation });
    await this.markerRepo.incrementDispute(markerId);

    await this.notify({
      markerId,
      reporterId:     marker.reporterId,
      validatorId:    userId,
      validationType: 'dispute',
      reason,
      explanation,
    });

    return { success: true, message: 'İtiraz kaydedildi.' };
  }
}
