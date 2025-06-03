
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
  Timestamp // Import Timestamp as a value
} from 'firebase/firestore';

const customersCollectionRef = collection(db, 'customers');

// Helper to convert Firestore Timestamp to ISO string or return string if already
const convertTimestampToString = (timestampField: unknown): string | undefined => {
  if (!timestampField) return undefined;
  // Check if it's a Firestore Timestamp object
  if (timestampField instanceof Timestamp || (typeof (timestampField as any)?.toDate === 'function')) {
    return (timestampField as Timestamp).toDate().toISOString();
  }
  // If it's already a string (e.g., from a previous serialization)
  if (typeof timestampField === 'string') {
     try {
      // Validate if it's a valid ISO string, then return it
      new Date(timestampField).toISOString();
      return timestampField;
    } catch (e) {
      console.warn('[customerService] Non-date string encountered in timestamp field:', timestampField);
      return undefined;
    }
  }
  if (timestampField instanceof Date) { // Handle native JS Date objects
    return timestampField.toISOString();
  }
  console.warn('[customerService] Unexpected timestamp format:', timestampField);
  return undefined;
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
    lastPurchase: null, // Initialize lastPurchase, can be updated later
  });
  // Return a serializable representation.
  const nowISO = new Date().toISOString();
  return { 
    ...customerData, 
    id: docRef.id, 
    totalSpent: 0, 
    createdAt: nowISO, 
    updatedAt: nowISO,
    lastPurchase: undefined, // Or null, client will get actual on next fetch
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
