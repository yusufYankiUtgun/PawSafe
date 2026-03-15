import { Marker, User, Validation } from '../interfaces/types';
import { getSeededDogImage } from '../config/imageConfig';

export const mockUsers: User[] = [
  { id: 'u1', username: 'mehmet_can', email: 'mehmet@example.com', password: '1234', trustScore: 24, role: 'user' },
  { id: 'u2', username: 'ayse_kaya', email: 'ayse@example.com', password: '1234', trustScore: 18, role: 'user' },
  { id: 'u3', username: 'ali_riza', email: 'ali@example.com', password: '1234', trustScore: 15, role: 'user' },
  { id: 'u4', username: 'fatma_oz', email: 'fatma@example.com', password: '1234', trustScore: 12, role: 'user' },
  { id: 'u5', username: 'hasan_dem', email: 'hasan@example.com', password: '1234', trustScore: 8, role: 'user' },
  { id: 'u6', username: 'zeynep_ak', email: 'zeynep@example.com', password: '1234', trustScore: 5, role: 'user' },
  { id: 'admin', username: 'admin', email: 'admin@pawsafe.com', password: 'admin123', trustScore: 0, role: 'admin' },
];

export const mockMarkers: Marker[] = [
  {
    id: 'm1', lat: 41.0082, lng: 28.9784,
    imageUrl: getSeededDogImage(0),
    description: 'Eminönü yakınlarında 3 saldırgan köpek görüldü. Yayalara saldırıyor, dikkatli olun!',
    reporterId: 'u1', reporterName: 'mehmet_can',
    validationCount: 7, disputeCount: 1, createdAt: '2026-04-10', animalCount: 3,
  },
  {
    id: 'm2', lat: 41.0150, lng: 28.9650,
    imageUrl: getSeededDogImage(1),
    description: 'Kapalıçarşı civarında büyük köpek grubu. Geceleri özellikle tehlikeli.',
    reporterId: 'u2', reporterName: 'ayse_kaya',
    validationCount: 5, disputeCount: 0, createdAt: '2026-04-11', animalCount: 5,
  },
  {
    id: 'm3', lat: 41.0200, lng: 28.9900,
    imageUrl: getSeededDogImage(2),
    description: 'Sultanahmet parkında agresif köpekler mevcut. Turistlere yaklaşıyor.',
    reporterId: 'u3', reporterName: 'ali_riza',
    validationCount: 3, disputeCount: 2, createdAt: '2026-04-12', animalCount: 2,
  },
  {
    id: 'm4', lat: 41.0050, lng: 28.9600,
    imageUrl: getSeededDogImage(3),
    description: 'Beyazıt meydanında büyük ve agresif bir köpek. Çocuklara yaklaştı.',
    reporterId: 'u4', reporterName: 'fatma_oz',
    validationCount: 9, disputeCount: 0, createdAt: '2026-04-09', animalCount: 1,
  },
  {
    id: 'm5', lat: 41.0300, lng: 28.9550,
    imageUrl: getSeededDogImage(4),
    description: 'Fatih ilçesinde köpek sürüsü. Sabah saatlerinde aktif ve saldırgan.',
    reporterId: 'u5', reporterName: 'hasan_dem',
    validationCount: 4, disputeCount: 1, createdAt: '2026-04-13', animalCount: 7,
  },
  {
    id: 'm6', lat: 40.9850, lng: 29.0100,
    imageUrl: getSeededDogImage(5),
    description: 'Üsküdar sahilinde agresif köpekler. Sabah koşucuları dikkat etmeli!',
    reporterId: 'u1', reporterName: 'mehmet_can',
    validationCount: 6, disputeCount: 0, createdAt: '2026-04-08', animalCount: 4,
  },
  {
    id: 'm7', lat: 41.0400, lng: 29.0050,
    imageUrl: getSeededDogImage(6),
    description: 'Kadıköy çarşısında ısırma vakası rapor edildi. Bölgeden kaçınılması önerilir.',
    reporterId: 'u2', reporterName: 'ayse_kaya',
    validationCount: 11, disputeCount: 2, createdAt: '2026-04-07', animalCount: 2,
  },
  {
    id: 'm8', lat: 41.0120, lng: 29.0200,
    imageUrl: getSeededDogImage(7),
    description: 'Moda sahilinde köpek grubu. Akşam saatlerinde tehlikeli.',
    reporterId: 'u6', reporterName: 'zeynep_ak',
    validationCount: 2, disputeCount: 0, createdAt: '2026-04-14', animalCount: 3,
  },
];

export const mockValidations: Validation[] = [];
