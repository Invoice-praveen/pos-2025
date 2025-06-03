
'use server';

import { db } from '@/lib/firebase';
import type { Product } from '@/types';
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  increment
} from 'firebase/firestore';

const productsCollectionRef = collection(db, 'products');
const SERVICE_NAME = 'productService';

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


export async function getProducts(): Promise<Product[]> {
  console.log(`[${SERVICE_NAME}] getProducts: Attempting to fetch products.`);
  const q = query(productsCollectionRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  console.log(`[${SERVICE_NAME}] getProducts: Fetched ${snapshot.docs.length} product documents from Firestore.`);

  return snapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    const docId = docSnapshot.id;
    // console.log(`[${SERVICE_NAME}] getProducts: Raw data for product ${docId}:`, JSON.stringify(data));

    const product: Product = {
      id: docId,
      name: data.name ?? 'Unknown Product',
      category: data.category ?? 'Other',
      price: typeof data.price === 'number' ? data.price : 0,
      stock: typeof data.stock === 'number' ? data.stock : 0,
      image: data.image ?? '',
      hint: data.hint ?? '',
      createdAt: convertTimestampToString(data.createdAt, 'createdAt', docId),
      updatedAt: convertTimestampToString(data.updatedAt, 'updatedAt', docId),
    };
    // console.log(`[${SERVICE_NAME}] getProducts: Mapped product ${docId}:`, JSON.stringify(product));
    return product;
  });
}

export async function addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  // console.log(`[${SERVICE_NAME}] addProduct: Adding product:`, productData);
  const docRef = await addDoc(productsCollectionRef, {
    ...productData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const nowISO = new Date().toISOString();
  const newProduct = {
    ...productData,
    id: docRef.id,
    createdAt: nowISO, 
    updatedAt: nowISO
  };
  // console.log(`[${SERVICE_NAME}] addProduct: Product added successfully:`, newProduct);
  return newProduct;
}

export async function updateProduct(id: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  // console.log(`[${SERVICE_NAME}] updateProduct: Updating product ${id} with:`, productData);
  const productDoc = doc(db, 'products', id);
  await updateDoc(productDoc, {
    ...productData,
    updatedAt: serverTimestamp(),
  });
  // console.log(`[${SERVICE_NAME}] updateProduct: Product ${id} updated successfully.`);
}

export async function deleteProduct(id: string): Promise<void> {
  // console.log(`[${SERVICE_NAME}] deleteProduct: Deleting product ${id}.`);
  const productDoc = doc(db, 'products', id);
  await deleteDoc(productDoc);
  // console.log(`[${SERVICE_NAME}] deleteProduct: Product ${id} deleted successfully.`);
}
