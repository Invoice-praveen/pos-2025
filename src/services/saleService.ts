
'use server';

import { db } from '@/lib/firebase';
import type { Sale } from '@/types';
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  // doc, writeBatch // For stock updates in future
} from 'firebase/firestore';
// import type { Product } from '@/types';

const salesCollectionRef = collection(db, 'sales');
// const productsCollectionRef = collection(db, 'products');

export async function addSale(saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'saleDate'>): Promise<Sale> {
  
  // TODO: Implement stock update logic using Firestore transactions for atomicity
  // This would involve:
  // 1. Reading current stock for each product in the sale.
  // 2. Checking if enough stock exists.
  // 3. Decrementing stock for each product.
  // 4. Saving the sale document.
  // All these operations should be in a single transaction (batch write).
  // For now, we just save the sale.

  const docRef = await addDoc(salesCollectionRef, {
    ...saleData,
    saleDate: serverTimestamp(), // Use server timestamp for sale date
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { 
    ...saleData, 
    id: docRef.id, 
    saleDate: serverTimestamp() as any, // This will be resolved by the server
    createdAt: serverTimestamp() as any, 
    updatedAt: serverTimestamp() as any 
  };
}

// Future functions:
// export async function getSales(): Promise<Sale[]> { ... }
// export async function getSaleById(id: string): Promise<Sale | null> { ... }
