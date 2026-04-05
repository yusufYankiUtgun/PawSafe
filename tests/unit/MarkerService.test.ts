/**
 * Unit tests for MarkerService (business layer).
 *
 * Verification: trust score award on creation, field mapping, delete/update delegation.
 * Validation:   users see the expected marker shape and counts after each operation.
 */

import { MarkerService } from '../../src/business/MarkerService';
import { MarkerRepository } from '../../src/data/MarkerRepository';
import { UserRepository } from '../../src/data/UserRepository';

function makeRepos() {
  const markerRepo = new MarkerRepository();
  const userRepo = new UserRepository();
  return { markerRepo, userRepo };
}

// ─── createMarker() ───────────────────────────────────────────────────────────

describe('MarkerService – createMarker()', () => {
  it('returns a marker with the supplied coordinates and reporter info', () => {
    const { markerRepo, userRepo } = makeRepos();
    const svc = new MarkerService(markerRepo, userRepo);

    const marker = svc.createMarker(
      41.01, 28.96, '', 'u1', 'mehmet_can', 'Test açıklaması', 2,
      'medium', 'siyah', 'yok', 'friendly', 'Test Sokak',
    );

    expect(marker.lat).toBe(41.01);
    expect(marker.lng).toBe(28.96);
    expect(marker.reporterId).toBe('u1');
    expect(marker.reporterName).toBe('mehmet_can');
    expect(marker.description).toBe('Test açıklaması');
    expect(marker.animalCount).toBe(2);
    expect(marker.size).toBe('medium');
    expect(marker.color).toBe('siyah');
    expect(marker.earTagColor).toBe('yok');
    expect(marker.classification).toBe('friendly');
    expect(marker.address).toBe('Test Sokak');
  });

  it('initialises validationCount and disputeCount at 0', () => {
    const { markerRepo, userRepo } = makeRepos();
    const svc = new MarkerService(markerRepo, userRepo);

    const marker = svc.createMarker(41.0, 29.0, '', 'u1', 'mehmet_can', '', 1);

    expect(marker.validationCount).toBe(0);
    expect(marker.disputeCount).toBe(0);
  });

  it('defaults animalCount to 1 when 0 is supplied', () => {
    const { markerRepo, userRepo } = makeRepos();
    const svc = new MarkerService(markerRepo, userRepo);

    const marker = svc.createMarker(41.0, 29.0, '', 'u1', 'mehmet_can', '', 0);

    expect(marker.animalCount).toBe(1);
  });

  it('awards POINTS_PER_MARKER (10) trust points to the reporter', () => {
    const { markerRepo, userRepo } = makeRepos();
    const svc = new MarkerService(markerRepo, userRepo);
    const scoreBefore = userRepo.getById('u1')!.trustScore;

    svc.createMarker(41.0, 29.0, '', 'u1', 'mehmet_can', '', 1);

    expect(userRepo.getById('u1')!.trustScore).toBe(scoreBefore + 10);
  });

  it('works correctly when no UserRepository is provided (no trust award)', () => {
    const { markerRepo } = makeRepos();
    const svc = new MarkerService(markerRepo);

    const marker = svc.createMarker(41.0, 29.0, '', 'u1', 'mehmet_can', '', 1);

    expect(marker).toBeDefined();
    expect(marker.id).toBeTruthy();
  });

  it('persists the new marker so getAll() includes it', () => {
    const { markerRepo, userRepo } = makeRepos();
    const svc = new MarkerService(markerRepo, userRepo);
    const countBefore = svc.getAll().length;

    svc.createMarker(41.0, 29.0, '', 'u2', 'ayse_kaya', '', 1);

    expect(svc.getAll().length).toBe(countBefore + 1);
  });
});

// ─── getAll() / getById() ─────────────────────────────────────────────────────

describe('MarkerService – getAll() / getById()', () => {
  it('getAll() returns the seeded mock markers', () => {
    const { markerRepo } = makeRepos();
    const svc = new MarkerService(markerRepo);

    expect(svc.getAll().length).toBeGreaterThan(0);
  });

  it('getById() returns the correct marker', () => {
    const { markerRepo } = makeRepos();
    const svc = new MarkerService(markerRepo);

    const marker = svc.getById('m1');
    expect(marker).toBeDefined();
    expect(marker!.id).toBe('m1');
  });

  it('getById() returns undefined for an unknown id', () => {
    const { markerRepo } = makeRepos();
    const svc = new MarkerService(markerRepo);

    expect(svc.getById('yok')).toBeUndefined();
  });
});

// ─── update() ─────────────────────────────────────────────────────────────────

describe('MarkerService – update()', () => {
  it('merges supplied fields into the existing marker', () => {
    const { markerRepo } = makeRepos();
    const svc = new MarkerService(markerRepo);

    const updated = svc.update('m1', { description: 'Yeni açıklama', animalCount: 5 });

    expect(updated).toBeDefined();
    expect(updated!.description).toBe('Yeni açıklama');
    expect(updated!.animalCount).toBe(5);
  });

  it('returns undefined when the marker does not exist', () => {
    const { markerRepo } = makeRepos();
    const svc = new MarkerService(markerRepo);

    expect(svc.update('olmayan', { description: 'X' })).toBeUndefined();
  });
});

// ─── delete() ─────────────────────────────────────────────────────────────────

describe('MarkerService – delete()', () => {
  it('removes the marker and returns true', () => {
    const { markerRepo } = makeRepos();
    const svc = new MarkerService(markerRepo);
    const countBefore = svc.getAll().length;

    const result = svc.delete('m1');

    expect(result).toBe(true);
    expect(svc.getAll().length).toBe(countBefore - 1);
    expect(svc.getById('m1')).toBeUndefined();
  });

  it('returns false for a non-existent marker', () => {
    const { markerRepo } = makeRepos();
    const svc = new MarkerService(markerRepo);

    expect(svc.delete('olmayan')).toBe(false);
  });
});
