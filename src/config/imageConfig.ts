// IMAGE_MODE controls where marker images come from.
// 'mock'   → local dog photos from /images/dogs/ (default, presentation mode)
// 'random' → placedog.net random dog photos (requires internet, no local files)
//
// To switch: change the value below manually. Nothing else needs to change.
export const IMAGE_MODE: 'mock' | 'random' = 'mock';

export const MOCK_DOG_IMAGES = [
  '/images/dogs/dog1.jpg',
  '/images/dogs/dog2.jpg',
  '/images/dogs/dog3.jpg',
  '/images/dogs/dog4.jpg',
  '/images/dogs/dog5.jpg',
  '/images/dogs/dog6.jpg',
  '/images/dogs/dog7.jpg',
  '/images/dogs/dog8.jpg',
];

export function getRandomDogImage(): string {
  if (IMAGE_MODE === 'mock') {
    const idx = Math.floor(Math.random() * MOCK_DOG_IMAGES.length);
    return MOCK_DOG_IMAGES[idx];
  }
  return `https://placedog.net/400/300?random`;
}

export function getSeededDogImage(seed: number): string {
  if (IMAGE_MODE === 'mock') {
    return MOCK_DOG_IMAGES[seed % MOCK_DOG_IMAGES.length];
  }
  return `https://placedog.net/400/300?id=${(seed % 8) + 1}`;
}
