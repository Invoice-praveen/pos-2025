
'use server';

import { db } from '@/lib/firebase';
import type { Customer } from '@/types';
import { 
  collection, 
  getDocs, 
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

const customersCollectionRef = collection(db, 'customers');

export async function getCustomers(): Promise<Customer[]> {
  const q = query(customersCollectionRef, orderBy('createdAt', 'desc')); // Order by creation date, newest first
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Customer));
}

export async function addCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalSpent' | 'lastPurchase'>): Promise<Customer> {
  const docRef = await addDoc(customersCollectionRef, {
    ...customerData,
    totalSpent: 0, // Initialize totalSpent
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  // For client-side, we can't resolve serverTimestamp, so return what we have or refetch.
  // For simplicity, we return the input data with the new ID.
  return { ...customerData, id: docRef.id, totalSpent: 0 }; 
}

export async function updateCustomer(id: string, customerData: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  const customerDoc = doc(db, 'customers', id);
  await updateDoc(customerDoc, {
    ...customerData,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  const customerDoc = doc(db, 'customers', id);
  await deleteDoc(customerDoc);
}
