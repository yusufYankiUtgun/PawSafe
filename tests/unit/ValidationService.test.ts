/**
 * Unit tests for ValidationService (business layer).
 *
 * Verification focus:
 *  – Did we build the logic right? (duplicate-vote prevention, observer notify)
 *
 * Validation focus:
 *  – Does validate/dispute behave as users expect?
 */

import { ValidationService } from '../../src/business/ValidationService';
import { ValidationRepository } from '../../src/data/ValidationRepository';
import { MarkerRepository } from '../../src/data/MarkerRepository';
import { IObserver } from '../../src/interfaces/IObserver';
import { ValidationEvent } from '../../src/interfaces/types';

// ─── Test fixtures ────────────────────────────────────────────────────────────

function makeRepos() {
  const markerRepo = new MarkerRepository();
  const validationRepo = new ValidationRepository();
  return { markerRepo, validationRepo };
}

/** Spy observer that records all events it receives. */
class SpyObserver implements IObserver {
  events: ValidationEvent[] = [];
  update(event: ValidationEvent) {
    this.events.push(event);
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ValidationService – validate()', () => {
  it('returns success and notifies observers for a fresh vote', () => {
    const { markerRepo, validationRepo } = makeRepos();
    const svc = new ValidationService(validationRepo, markerRepo);
    const spy = new SpyObserver();
    svc.subscribe(spy);

    // m1 is one of the mock markers seeded in MarkerRepository
    const result = svc.validate('m1', 'u6');

    expect(result.success).toBe(true);
    expect(spy.events).toHaveLength(1);
    expect(spy.events[0].validationType).toBe('validate');
    expect(spy.events[0].markerId).toBe('m1');
  });

  it('prevents duplicate validate vote by the same user', () => {
    const { markerRepo, validationRepo } = makeRepos();
    const svc = new ValidationService(validationRepo, markerRepo);
    const spy = new SpyObserver();
    svc.subscribe(spy);

    svc.validate('m1', 'u6');
    const second = svc.validate('m1', 'u6');

    expect(second.success).toBe(false);
    expect(second.message).toMatch(/zaten oy/i);
    // Observer must NOT be called twice
    expect(spy.events).toHaveLength(1);
  });

  it('increments the marker validationCount', () => {
    const { markerRepo, validationRepo } = makeRepos();
    const svc = new ValidationService(validationRepo, markerRepo);
    const before = markerRepo.getById('m1')!.validationCount;

    svc.validate('m1', 'u6');

    expect(markerRepo.getById('m1')!.validationCount).toBe(before + 1);
  });

  it('returns failure for a non-existent marker', () => {
    const { markerRepo, validationRepo } = makeRepos();
    const svc = new ValidationService(validationRepo, markerRepo);

    const result = svc.validate('does-not-exist', 'u1');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/bulunamadı/i);
  });
});

describe('ValidationService – dispute()', () => {
  it('records a dispute with reason and notifies observers', () => {
    const { markerRepo, validationRepo } = makeRepos();
    const svc = new ValidationService(validationRepo, markerRepo);
    const spy = new SpyObserver();
    svc.subscribe(spy);

    const result = svc.dispute('m2', 'u6', 'false_report', 'Gördüğüm köpek değil');

    expect(result.success).toBe(true);
    expect(spy.events).toHaveLength(1);
    const evt = spy.events[0];
    expect(evt.validationType).toBe('dispute');
    expect(evt.reason).toBe('false_report');
    expect(evt.explanation).toBe('Gördüğüm köpek değil');
  });

  it('prevents a user from both validating and disputing the same marker', () => {
    const { markerRepo, validationRepo } = makeRepos();
    const svc = new ValidationService(validationRepo, markerRepo);

    svc.validate('m3', 'u6');
    const dispute = svc.dispute('m3', 'u6', 'spam');

    expect(dispute.success).toBe(false);
    expect(dispute.message).toMatch(/zaten oy/i);
  });

  it('increments the marker disputeCount', () => {
    const { markerRepo, validationRepo } = makeRepos();
    const svc = new ValidationService(validationRepo, markerRepo);
    const before = markerRepo.getById('m1')!.disputeCount;

    svc.dispute('m1', 'u6', 'duplicate');

    expect(markerRepo.getById('m1')!.disputeCount).toBe(before + 1);
  });

  it('observer unsubscribe stops notifications', () => {
    const { markerRepo, validationRepo } = makeRepos();
    const svc = new ValidationService(validationRepo, markerRepo);
    const spy = new SpyObserver();
    svc.subscribe(spy);
    svc.unsubscribe(spy);

    svc.validate('m1', 'u6');

    expect(spy.events).toHaveLength(0);
  });
});
