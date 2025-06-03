
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
  serverTimestamp,
  type Timestamp // Import Timestamp type
} from 'firebase/firestore';

const customersCollectionRef = collection(db, 'customers');

// Helper to convert Firestore Timestamp to ISO string or return string if already
const convertTimestampToString = (timestampField: unknown): string | undefined => {
  if (!timestampField) return undefined;
  if (typeof (timestampField as Timestamp).toDate === 'function') {
    return (timestampField as Timestamp).toDate().toISOString();
  }
  if (typeof timestampField === 'string') {
    return timestampField;
  }
  return undefined; // Or throw an error if an unexpected type is received
};


export async function getCustomers(): Promise<Customer[]> {
  const q = query(customersCollectionRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    // Explicitly construct the Customer object to ensure type compliance and serialization
    const customer: Customer = {
      id: docSnapshot.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      avatar: data.avatar,
      hint: data.hint,
      totalSpent: data.totalSpent || 0,
      createdAt: convertTimestampToString(data.createdAt),
      updatedAt: convertTimestampToString(data.updatedAt),
      lastPurchase: convertTimestampToString(data.lastPurchase),
    };
    return customer;
  });
}

export async function addCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalSpent' | 'lastPurchase'>): Promise<Customer> {
  const docRef = await addDoc(customersCollectionRef, {
    ...customerData,
    totalSpent: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  // Return a serializable representation. Firestore Timestamps won't resolve on client immediately.
  // The client will refetch or rely on optimistic updates.
  return { 
    ...customerData, 
    id: docRef.id, 
    totalSpent: 0, 
    // For createdAt/updatedAt, it's better to let the client refetch or use optimistic value (e.g. new Date().toISOString())
    // For simplicity, returning undefined here, actual values will come from getCustomers after invalidation.
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString(),
  }; 
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
