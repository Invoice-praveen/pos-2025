
import type { Timestamp } from 'firebase/firestore';

export interface Product {
  id?: string; // Optional: Firestore document ID
  name: string;
  sku?: string; // Stock Keeping Unit
  description?: string;
  category: string;
  price: number;
  stock: number;
  image?: string; // URL to the image
  hint?: string; // For placeholder image generation
  taxRate?: number; // e.g., 0.05 for 5%
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
  lastPurchase?: string; // ISO Date string
  createdAt?: string; // ISO Date string
  updatedAt?: string; // ISO Date string
}

export type ServiceType = 'Paid' | 'Free' | 'Internal' | 'Warranty';
export type ServiceStatus = 'Initiated' | 'Scheduled' | 'On Progress' | 'Pending Customer' | 'Completed' | 'Cancelled';

export interface Service {
  id?: string;
  serviceName: string;
  customerId: string; // ID of the customer
  customerName: string; // Denormalized for display
  description?: string;
  serviceType: ServiceType;
  status: ServiceStatus;
  cost?: number;
  serviceDate: string; // ISO Date string - when the service was requested/logged or scheduled
  completionDate?: string; // ISO Date string - when completed
  notes?: string;
  createdAt?: string; // ISO Date string
  updatedAt?: string; // ISO Date string
}


export interface SaleItem {
  productId: string;
  itemCode: string; // SKU
  itemName: string;
  description?: string; // Product description
  qty: number;
  unit: string;
  priceUnit: number;
  taxRate?: number; // Tax rate applied to this item (copied from product)
  taxApplied: number; // Calculated tax amount for this item
  discount: number; // Discount amount for this item line
  total: number; // (priceUnit * qty) - discount + taxApplied
}

export interface SalePayment {
  mode: string;
  amount: number;
  paymentDate?: string; // ISO Date string, optional for existing data
}

export interface Sale {
  id?: string;
  customerId: string;
  customerName: string; // Denormalized for easier display
  items: SaleItem[];
  subTotal: number; // Sum of (priceUnit * qty) for all items BEFORE item discounts and taxes
  totalItemDiscount: number; // Sum of all item-level discounts
  totalTax: number; // Sum of all item-level taxes
  roundOff: number;
  totalAmount: number; // subTotal - totalItemDiscount + totalTax + roundOff
  totalItems: number;
  totalQuantity: number;
  payments: SalePayment[];
  amountReceived: number;
  paymentMode: string; // Primary payment mode if single, or summary
  changeGiven: number;
  saleDate: string; // ISO Date string
  status: 'Completed' | 'PartiallyPaid' | 'PendingPayment' | 'Returned' | 'Cancelled' | 'Unknown';
  notes?: string;
  createdAt?: string; // ISO Date string   
  updatedAt?: string; // ISO Date string   
}

// Type for cart items, which might include temporary client-side state
export interface SalesCartItem extends SaleItem {
  stock: number; // To check against available stock
}

export interface CompanySettings {
  id?: string; // Should be a fixed ID like 'main'
  storeName: string;
  storeAddress: string;
  storePhone?: string;
  storeEmail?: string;
  storeWebsite?: string;
  logoUrl?: string;
  invoiceTagline?: string;
  defaultTaxRate?: number; // e.g., 0.05 for 5%
  receiptHeader?: string;
  receiptFooter?: string;
  invoiceTerms?: string;
  authorizedSignature?: string; // Name or title for signature line
  enableLowStockAlerts?: boolean; // App-specific setting
  updatedAt?: string; // ISO Date string
}

// ----- Purchase Module Types -----
export interface Supplier {
  id?: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseItem {
  productId: string; // ID of the product from inventory
  productName: string; // Denormalized for display
  sku?: string;
  qty: number;
  costPriceUnit: number; // Price paid to supplier per unit
  totalCost: number; // qty * costPriceUnit
}

export type PurchaseStatus = 'Draft' | 'Ordered' | 'Partially Received' | 'Completed' | 'Cancelled';
export type PurchasePaymentStatus = 'Unpaid' | 'PartiallyPaid' | 'Paid';

export interface Purchase {
  id?: string;
  supplierId: string;
  supplierName: string; // Denormalized
  items: PurchaseItem[];
  purchaseOrderNumber?: string; // Optional PO number
  purchaseDate: string; // ISO Date string
  expectedDeliveryDate?: string; // ISO Date string
  subTotal: number; // Sum of totalCost for all items
  shippingCost?: number;
  otherCharges?: number;
  totalAmount: number; // subTotal + shippingCost + otherCharges
  amountPaid: number;
  paymentStatus: PurchasePaymentStatus;
  status: PurchaseStatus;
  // Consider adding payments array similar to SalePayment if tracking multiple payments
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ----- Expense Module Types -----
export const expenseCategories = [
  "Rent", "Utilities", "Salaries", "Marketing", "Supplies", "Maintenance", 
  "Travel", "Software", "Bank Charges", "Office Expenses", "Other"
] as const; // `as const` makes it a readonly tuple for better type inference

export type ExpenseCategory = typeof expenseCategories[number];

export interface Expense {
  id?: string;
  expenseDate: string; // ISO Date string
  category: ExpenseCategory;
  amount: number;
  payee?: string; // Vendor or person paid
  description?: string;
  notes?: string; // Internal notes
  createdAt?: string; // ISO Date string
  updatedAt?: string; // ISO Date string
}

// ----- Voucher Module Types -----
export const voucherTypes = ["Credit Note", "Debit Note", "Journal Voucher", "Payment Voucher", "Receipt Voucher"] as const;
export type VoucherType = typeof voucherTypes[number];

export interface FinancialVoucher {
  id?: string;
  voucherDate: string; // ISO Date string
  voucherType: VoucherType;
  referenceNo?: string;
  partyType?: 'Customer' | 'Supplier' | 'Employee' | 'Other';
  partyId?: string; // ID of customer, supplier, etc.
  partyName?: string; // Denormalized name
  amount: number;
  description: string; // Reason for the voucher
  relatedTransactionId?: string; // e.g., Sale ID for a credit note
  notes?: string;
  createdAt?: string; // ISO Date string
  updatedAt?: string; // ISO Date string
}
