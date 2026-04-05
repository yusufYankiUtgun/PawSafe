/**
 * Unit tests for MarkerRepository (data layer).
 *
 * Verification: every public method delegates to the in-memory store correctly.
 * Validation:   counts increment atomically; delete removes exactly one entry.
 */

import { MarkerRepository } from '../../src/data/MarkerRepository';
import { Marker } from '../../src/interfaces/types';

function makeRepo() {
  return new MarkerRepository();
}

const SAMPLE_MARKER: Marker = {
  id: 'm_test',
  lat: 41.0,
  lng: 29.0,
  imageUrl: '',
  description: 'Test marker',
  reporterId: 'u1',
  reporterName: 'mehmet_can',
  validationCount: 0,
  disputeCount: 0,
  createdAt: '2026-04-15',
  animalCount: 1,
  size: 'medium',
  color: 'siyah',
  earTagColor: 'yok',
  classification: 'friendly',
};

// ─── getAll() ─────────────────────────────────────────────────────────────────

describe('MarkerRepository – getAll()', () => {
  it('returns all 8 seeded mock markers', () => {
    const repo = makeRepo();
    expect(repo.getAll().length).toBe(8);
  });

  it('returns a shallow copy — modifying the result does not affect the store', () => {
    const repo = makeRepo();
    const first = repo.getAll();
    first.pop();
    expect(repo.getAll().length).toBe(8);
  });
});

// ─── getById() ────────────────────────────────────────────────────────────────

describe('MarkerRepository – getById()', () => {
  it('returns the correct marker for a known id', () => {
    const repo = makeRepo();
    const marker = repo.getById('m1');

    expect(marker).toBeDefined();
    expect(marker!.reporterName).toBe('mehmet_can');
  });

  it('returns undefined for an unknown id', () => {
    const repo = makeRepo();
    expect(repo.getById('yok')).toBeUndefined();
  });
});

// ─── save() ───────────────────────────────────────────────────────────────────

describe('MarkerRepository – save()', () => {
  it('persists the marker and makes it retrievable via getById()', () => {
    const repo = makeRepo();
    repo.save(SAMPLE_MARKER);

    const found = repo.getById('m_test');
    expect(found).toBeDefined();
    expect(found!.description).toBe('Test marker');
  });

  it('increases the total marker count by 1', () => {
    const repo = makeRepo();
    const before = repo.getAll().length;

    repo.save(SAMPLE_MARKER);

    expect(repo.getAll().length).toBe(before + 1);
  });
});

// ─── update() ─────────────────────────────────────────────────────────────────

describe('MarkerRepository – update()', () => {
  it('merges supplied fields into the existing marker', () => {
    const repo = makeRepo();
    const updated = repo.update('m1', { description: 'Güncellendi', animalCount: 10 });

    expect(updated).toBeDefined();
    expect(updated!.description).toBe('Güncellendi');
    expect(updated!.animalCount).toBe(10);
  });

  it('does not overwrite fields that were not supplied', () => {
    const repo = makeRepo();
    const before = repo.getById('m1')!.lat;

    repo.update('m1', { description: 'Sadece açıklama değişti' });

    expect(repo.getById('m1')!.lat).toBe(before);
  });

  it('returns undefined when the marker id does not exist', () => {
    const repo = makeRepo();
    expect(repo.update('olmayan', { description: 'X' })).toBeUndefined();
  });
});

// ─── delete() ─────────────────────────────────────────────────────────────────

describe('MarkerRepository – delete()', () => {
  it('removes the marker and returns true', () => {
    const repo = makeRepo();
    const countBefore = repo.getAll().length;

    const result = repo.delete('m1');

    expect(result).toBe(true);
    expect(repo.getAll().length).toBe(countBefore - 1);
    expect(repo.getById('m1')).toBeUndefined();
  });

  it('returns false and does not change the count for a non-existent id', () => {
    const repo = makeRepo();
    const countBefore = repo.getAll().length;

    const result = repo.delete('olmayan');

    expect(result).toBe(false);
    expect(repo.getAll().length).toBe(countBefore);
  });
});

// ─── incrementValidation() / incrementDispute() ───────────────────────────────

describe('MarkerRepository – incrementValidation()', () => {
  it('increments validationCount by 1', () => {
    const repo = makeRepo();
    const before = repo.getById('m1')!.validationCount;

    repo.incrementValidation('m1');

    expect(repo.getById('m1')!.validationCount).toBe(before + 1);
  });

  it('is a no-op for an unknown marker id', () => {
    const repo = makeRepo();
    // Should not throw
    expect(() => repo.incrementValidation('olmayan')).not.toThrow();
  });
});

describe('MarkerRepository – incrementDispute()', () => {
  it('increments disputeCount by 1', () => {
    const repo = makeRepo();
    const before = repo.getById('m1')!.disputeCount;

    repo.incrementDispute('m1');

    expect(repo.getById('m1')!.disputeCount).toBe(before + 1);
  });

  it('is a no-op for an unknown marker id', () => {
    const repo = makeRepo();
    expect(() => repo.incrementDispute('olmayan')).not.toThrow();
  });

  it('incrementValidation and incrementDispute are independent counters', () => {
    const repo = makeRepo();
    repo.incrementValidation('m2');
    repo.incrementDispute('m2');

    const marker = repo.getById('m2')!;
    // mock value was 5 validations and 0 disputes
    expect(marker.validationCount).toBe(6);
    expect(marker.disputeCount).toBe(1);
  });
});
