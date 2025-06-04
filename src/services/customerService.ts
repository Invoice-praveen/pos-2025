
'use client';

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
  Timestamp
} from 'firebase/firestore';

const customersCollectionRef = collection(db, 'customers');
const SERVICE_NAME = 'customerService';

// Robust timestamp conversion helper
const convertTimestampToString = (timestampField: unknown, fieldName?: string, docId?: string): string | undefined => {
  const context = fieldName && docId ? ` (Field: ${fieldName}, Doc: ${docId})` : (fieldName ? ` (Field: ${fieldName})` : '');
  
  if (timestampField === null || typeof timestampField === 'undefined') {
    return undefined;
  }

  if (typeof (timestampField as any)?.toDate === 'function') {
    try {
      const dateObj = (timestampField as { toDate: () => Date }).toDate();
      if (isNaN(dateObj.getTime())) {
        console.warn(`[${SERVICE_NAME}] convertTimestampToString${context}: toDate() resulted in an invalid Date object. Raw value:`, timestampField);
        return undefined;
      }
      return dateObj.toISOString();
    } catch (e) {
      console.warn(`[${SERVICE_NAME}] Error converting Firestore Timestamp/toDate() to ISOString${context}:`, e, 'Raw value:', timestampField);
      return undefined;
    }
  }

  if (timestampField instanceof Date) {
    try {
      if (isNaN(timestampField.getTime())) {
        console.warn(`[${SERVICE_NAME}] Invalid native Date object encountered${context}:`, timestampField);
        return undefined;
      }
      return timestampField.toISOString();
    } catch (e) {
      console.warn(`[${SERVICE_NAME}] Error converting native Date to ISOString${context}:`, e, 'Raw value:', timestampField);
      return undefined;
    }
  }

  if (typeof timestampField === 'string') {
    try {
      const d = new Date(timestampField);
      if (isNaN(d.getTime())) {
        console.warn(`[${SERVICE_NAME}] Invalid date string encountered${context}:`, timestampField);
        return undefined;
      }
      return d.toISOString();
    } catch (e) {
      console.warn(`[${SERVICE_NAME}] Error processing string as date${context}:`, e, 'Raw value:', timestampField);
      return undefined;
    }
  }
  
  if (typeof timestampField === 'number') {
    try {
      const d = new Date(timestampField);
      if (isNaN(d.getTime())) {
        console.warn(`[${SERVICE_NAME}] Invalid number (timestamp in ms) encountered${context}:`, timestampField);
        return undefined;
      }
      return d.toISOString();
    } catch (e) {
      console.warn(`[${SERVICE_NAME}] Error converting number (timestamp in ms) to ISOString${context}:`, e, 'Raw value:', timestampField);
      return undefined;
    }
  }

  console.warn(`[${SERVICE_NAME}] Unexpected timestamp format${context}:`, timestampField, 'Type:', typeof timestampField);
  return undefined;
};


export async function getCustomers(): Promise<Customer[]> {
  console.log(`[${SERVICE_NAME}] getCustomers: Attempting to fetch customers.`);
  const q = query(customersCollectionRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  console.log(`[${SERVICE_NAME}] getCustomers: Fetched ${snapshot.docs.length} customer documents from Firestore.`);
  
  return snapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    const docId = docSnapshot.id;
    // console.log(`[${SERVICE_NAME}] getCustomers: Raw data for customer ${docId}:`, JSON.stringify(data));
    const customer: Customer = {
      id: docSnapshot.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      avatar: data.avatar,
      hint: data.hint,
      totalSpent: data.totalSpent || 0,
      createdAt: convertTimestampToString(data.createdAt, 'createdAt', docId),
      updatedAt: convertTimestampToString(data.updatedAt, 'updatedAt', docId),
      lastPurchase: convertTimestampToString(data.lastPurchase, 'lastPurchase', docId),
    };
    // console.log(`[${SERVICE_NAME}] getCustomers: Mapped customer ${docId}:`, JSON.stringify(customer));
    return customer;
  });
}

export async function addCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalSpent' | 'lastPurchase'>): Promise<Customer> {
  const docRef = await addDoc(customersCollectionRef, {
    ...customerData,
    totalSpent: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastPurchase: null,
  });
  const nowISO = new Date().toISOString();
  return { 
    ...customerData, 
    id: docRef.id, 
    totalSpent: 0, 
    createdAt: nowISO, 
    updatedAt: nowISO,
    lastPurchase: undefined,
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
