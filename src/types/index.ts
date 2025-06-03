
import type { Timestamp } from 'firebase/firestore';

export interface Product {
  id?: string; // Optional: Firestore document ID
  name: string;
  category: string;
  price: number;
  stock: number;
  image?: string; // URL to the image
  hint?: string; // For placeholder image generation
  createdAt?: string; 
  updatedAt?: string; 
}

export interface Customer {
  id?: string; // Optional: Firestore document ID
  name: string;
  email: string;
  phone?: string;
  avatar?: string; // URL to avatar
  hint?: string;
  totalSpent?: number;
  lastPurchase?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Service {
  id?: string;
  serviceName: string;
  customer: string; // Could be customer ID or name
  date: string; 
  type: 'Paid' | 'Free' | 'Internal' | 'Warranty';
  status: 'Pending' | 'Scheduled' | 'Completed' | 'Cancelled';
  cost: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaleItem {
  productId: string;
  itemCode: string;
  itemName: string;
  qty: number;
  unit: string;
  priceUnit: number;
  discount: number;
  taxApplied: number;
  total: number;
}

export interface SalePayment {
  mode: string;
  amount: number;
}

export interface Sale {
  id?: string;
  customerId: string;
  customerName: string; // Denormalized for easier display
  items: SaleItem[];
  subTotal: number;
  totalDiscount: number;
  totalTax: number;
  roundOff: number;
  totalAmount: number;
  totalItems: number;
  totalQuantity: number;
  payments: SalePayment[];
  amountReceived: number;
  paymentMode: string; // Primary payment mode if single, or summary
  changeGiven: number;
  saleDate: string; 
  status?: 'Completed' | 'PartiallyPaid' | 'Pending' | 'Returned'; // Added 'Returned'
  notes?: string;
  createdAt?: string;    
  updatedAt?: string;    
}

// Type for cart items, which might include temporary client-side state
export interface SalesCartItem extends SaleItem {
  stock: number; // To check against available stock
}

