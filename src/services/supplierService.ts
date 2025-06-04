
'use client';

import { db } from '@/lib/firebase';
import type { Supplier } from '@/types';
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

const suppliersCollectionRef = collection(db, 'suppliers');
const SERVICE_NAME = 'supplierService';

// Robust timestamp conversion helper (copied from customerService for consistency)
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
        return undefined;
      }
      return d.toISOString();
    } catch (e) {
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


export async function getSuppliers(): Promise<Supplier[]> {
  console.log(`[${SERVICE_NAME}] getSuppliers: Attempting to fetch suppliers.`);
  const q = query(suppliersCollectionRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  console.log(`[${SERVICE_NAME}] getSuppliers: Fetched ${snapshot.docs.length} supplier documents from Firestore.`);
  
  return snapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    const docId = docSnapshot.id;
    const supplier: Supplier = {
      id: docSnapshot.id,
      name: data.name,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,
      address: data.address,
      notes: data.notes,
      createdAt: convertTimestampToString(data.createdAt, 'createdAt', docId),
      updatedAt: convertTimestampToString(data.updatedAt, 'updatedAt', docId),
    };
    return supplier;
  });
}

export async function addSupplier(supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
  const docRef = await addDoc(suppliersCollectionRef, {
    ...supplierData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const nowISO = new Date().toISOString();
  return { 
    ...supplierData, 
    id: docRef.id, 
    createdAt: nowISO, 
    updatedAt: nowISO,
  }; 
}

export async function updateSupplier(id: string, supplierData: Partial<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  const supplierDoc = doc(db, 'suppliers', id);
  await updateDoc(supplierDoc, {
    ...supplierData,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSupplier(id: string): Promise<void> {
  const supplierDoc = doc(db, 'suppliers', id);
  await deleteDoc(supplierDoc);
}
