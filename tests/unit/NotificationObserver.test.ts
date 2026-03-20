/**
 * Unit tests for NotificationObserver.
 * Verifies dispute reason is surfaced in the notification message.
 */

import { NotificationObserver } from '../../src/business/NotificationObserver';
import { ValidationEvent } from '../../src/interfaces/types';

describe('NotificationObserver', () => {
  it('creates a success notification on validate event', () => {
    const obs = new NotificationObserver();
    const event: ValidationEvent = {
      markerId: 'm1', reporterId: 'u1',
      validatorId: 'u2', validationType: 'validate',
    };
    obs.update(event);

    const notes = obs.getForUser('u1');
    const latest = notes[notes.length - 1];
    expect(latest.type).toBe('success');
    expect(latest.read).toBe(false);
  });

  it('creates an error notification on dispute event with reason label', () => {
    const obs = new NotificationObserver();
    const event: ValidationEvent = {
      markerId: 'm1', reporterId: 'u1',
      validatorId: 'u3', validationType: 'dispute',
      reason: 'false_report', explanation: 'wrong animal',
    };
    obs.update(event);

    const notes = obs.getForUser('u1');
    const latest = notes[notes.length - 1];
    expect(latest.type).toBe('error');
    expect(latest.message).toMatch(/yanlış ihbar/i);
  });

  it('markRead sets read=true', () => {
    const obs = new NotificationObserver();
    const event: ValidationEvent = {
      markerId: 'm1', reporterId: 'u1',
      validatorId: 'u4', validationType: 'validate',
    };
    obs.update(event);
    const notes = obs.getForUser('u1');
    const latest = notes[notes.length - 1];

    obs.markRead(latest.id);
    expect(obs.getForUser('u1').find(n => n.id === latest.id)!.read).toBe(true);
  });
});
