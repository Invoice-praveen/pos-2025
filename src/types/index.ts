
import type { Timestamp } from 'firebase/firestore';

export interface Product {
  id?: string; // Optional: Firestore document ID
  name: string;
  category: string;
  price: number;
  stock: number;
  image?: string; // URL to the image
  hint?: string; // For placeholder image generation
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Customer {
  id?: string; // Optional: Firestore document ID
  name: string;
  email: string;
  phone?: string;
  avatar?: string; // URL to avatar
  hint?: string;
  totalSpent?: number;
  lastPurchase?: string | Timestamp; // Consider using Timestamp for dates
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Service {
  id?: string;
  serviceName: string;
  customer: string; // Could be customer ID or name
  date: string | Timestamp;
  type: 'Paid' | 'Free' | 'Internal' | 'Warranty';
  status: 'Pending' | 'Scheduled' | 'Completed' | 'Cancelled';
  cost: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Add other types like Sale, OrderItem etc. as needed
