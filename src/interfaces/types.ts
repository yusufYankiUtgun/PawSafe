export interface Marker {
  id: string;
  lat: number;
  lng: number;
  imageUrl: string;
  description: string;
  reporterId: string;
  reporterName: string;
  validationCount: number;
  disputeCount: number;
  createdAt: string;
  animalCount: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  trustScore: number;
  role: 'user' | 'admin';
}

export interface Validation {
  id: string;
  markerId: string;
  userId: string;
  type: 'validate' | 'dispute';
  createdAt: string;
}

export interface ValidationEvent {
  markerId: string;
  reporterId: string;
  validationType: 'validate' | 'dispute';
  validatorId: string;
}

export interface Score {
  userId: string;
  username: string;
  trustScore: number;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'success' | 'error' | 'info';
  createdAt: string;
  read: boolean;
}
