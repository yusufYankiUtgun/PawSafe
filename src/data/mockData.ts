import { Marker, User, Validation } from '../interfaces/types';

export const mockUsers: User[] = [
  { id: 'u1', username: 'mehmet_can', email: 'mehmet@example.com', password: '1234', trustScore: 24, role: 'user' },
  { id: 'u2', username: 'ayse_kaya', email: 'ayse@example.com', password: '1234', trustScore: 18, role: 'user' },
  { id: 'u3', username: 'ali_riza', email: 'ali@example.com', password: '1234', trustScore: 15, role: 'user' },
  { id: 'u4', username: 'fatma_oz', email: 'fatma@example.com', password: '1234', trustScore: 12, role: 'user' },
  { id: 'u5', username: 'hasan_dem', email: 'hasan@example.com', password: '1234', trustScore: 8, role: 'user' },
  { id: 'u6', username: 'zeynep_ak', email: 'zeynep@example.com', password: '1234', trustScore: 5, role: 'user' },
  { id: 'admin', username: 'admin', email: 'admin@pawsafe.com', password: 'admin123', trustScore: 0, role: 'admin' },
];

// All coordinates verified on Istanbul land areas
export const mockMarkers: Marker[] = [
  {
    id: 'm1', lat: 41.0135, lng: 28.9550,
    imageUrl: '',
    description: 'Eminönü yakınlarında 3 köpek görüldü. Yayalara yaklaşıyor, dikkatli olun.',
    reporterId: 'u1', reporterName: 'mehmet_can',
    validationCount: 7, disputeCount: 1, createdAt: '2026-04-10', animalCount: 3,
    size: 'large', color: 'kahverengi', earTagColor: 'sarı', classification: 'aggressive',
    address: 'Eminönü, Rüstempaşa Cad.',
  },
  {
    id: 'm2', lat: 41.0106, lng: 28.9640,
    imageUrl: '',
    description: 'Kapalıçarşı çıkışında büyük köpek grubu. Geceleri özellikle aktif.',
    reporterId: 'u2', reporterName: 'ayse_kaya',
    validationCount: 5, disputeCount: 0, createdAt: '2026-04-11', animalCount: 5,
    size: 'medium', color: 'siyah', earTagColor: 'mavi', classification: 'aggressive',
    address: 'Beyazıt, Kapalıçarşı Girişi',
  },
  {
    id: 'm3', lat: 41.0055, lng: 28.9765,
    imageUrl: '',
    description: 'Sultanahmet parkında iki köpek mevcut. Turistlere yaklaşıyor.',
    reporterId: 'u3', reporterName: 'ali_riza',
    validationCount: 3, disputeCount: 2, createdAt: '2026-04-12', animalCount: 2,
    size: 'medium', color: 'gri', earTagColor: 'kırmızı', classification: 'friendly',
    address: 'Sultanahmet, At Meydanı Cad.',
  },
  {
    id: 'm4', lat: 41.0182, lng: 28.9620,
    imageUrl: '',
    description: 'Beyazıt meydanında büyük ve agresif bir köpek. Çocuklara yaklaştı.',
    reporterId: 'u4', reporterName: 'fatma_oz',
    validationCount: 9, disputeCount: 0, createdAt: '2026-04-09', animalCount: 1,
    size: 'large', color: 'sarı', earTagColor: 'yok', classification: 'aggressive',
    address: 'Beyazıt, Ordu Cad.',
  },
  {
    id: 'm5', lat: 41.0298, lng: 28.9497,
    imageUrl: '',
    description: 'Fatih ilçesinde köpek sürüsü. Sabah saatlerinde aktif.',
    reporterId: 'u5', reporterName: 'hasan_dem',
    validationCount: 4, disputeCount: 1, createdAt: '2026-04-13', animalCount: 7,
    size: 'small', color: 'benekli', earTagColor: 'yeşil', classification: 'friendly',
    address: 'Fatih, Yavuz Selim Cad.',
  },
  {
    id: 'm6', lat: 41.0225, lng: 29.0148,
    imageUrl: '',
    description: 'Üsküdar merkez yakınında agresif köpekler. Sabah koşucuları dikkat etmeli.',
    reporterId: 'u1', reporterName: 'mehmet_can',
    validationCount: 6, disputeCount: 0, createdAt: '2026-04-08', animalCount: 4,
    size: 'large', color: 'siyah', earTagColor: 'sarı', classification: 'aggressive',
    address: 'Üsküdar, Hakimiyet-i Milliye Cad.',
  },
  {
    id: 'm7', lat: 40.9905, lng: 29.0270,
    imageUrl: '',
    description: 'Kadıköy çarşısında ısırma vakası rapor edildi. Bölgeden kaçınılması önerilir.',
    reporterId: 'u2', reporterName: 'ayse_kaya',
    validationCount: 11, disputeCount: 2, createdAt: '2026-04-07', animalCount: 2,
    size: 'medium', color: 'kahverengi', earTagColor: 'mavi', classification: 'aggressive',
    address: 'Kadıköy, Moda Cad.',
  },
  {
    id: 'm8', lat: 40.9978, lng: 28.8506,
    imageUrl: '',
    description: 'Bahçelievler parkında sakin köpekler. Bölge sakinleri tarafından besleniyor.',
    reporterId: 'u6', reporterName: 'zeynep_ak',
    validationCount: 2, disputeCount: 0, createdAt: '2026-04-14', animalCount: 3,
    size: 'small', color: 'beyaz', earTagColor: 'kırmızı', classification: 'friendly',
    address: 'Bahçelievler, Şenlikköy Cad.',
  },
];

export const mockValidations: Validation[] = [];
