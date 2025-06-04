
'use client';

import { auth, db } from '@/lib/firebase';
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
} from 'firebase/firestore';

const productsCollectionRef = collection(db, 'products');
const SERVICE_NAME = 'productService';

// Robust timestamp conversion helper
const convertTimestampToString = (timestampField: unknown, fieldName?: string, docId?: string): string | undefined => {
  const context = fieldName && docId ? ` (Field: ${fieldName}, Doc: ${docId})` : (fieldName ? ` (Field: ${fieldName})` : '');
  
  if (timestampField === null || typeof timestampField === 'undefined') {
    return undefined;
  }

  if (typeof (timestampField as any)?.toDate === 'function') { // Firestore Timestamp or similar
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

  if (timestampField instanceof Date) { // Native JavaScript Date
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

  if (typeof timestampField === 'string') { // Date string
    try {
      const d = new Date(timestampField);
      if (isNaN(d.getTime())) {
        // console.warn(`[${SERVICE_NAME}] Invalid date string encountered${context}:`, timestampField);
        // Don't treat all strings as dates, only valid ones. If it was intended as a date, this will return undefined.
        return undefined;
      }
      return d.toISOString();
    } catch (e) {
      // console.warn(`[${SERVICE_NAME}] Error processing string as date${context}:`, e, 'Raw value:', timestampField);
      return undefined;
    }
  }
  
  if (typeof timestampField === 'number') { // Numeric timestamp (ms since epoch)
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
  console.log(auth.currentUser, "CUrrent User")
  console.log(`[${SERVICE_NAME}] getProducts: Attempting to fetch products.`);
  const q = query(productsCollectionRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  const fetchedDocCount = snapshot.docs.length;
  console.log(`[${SERVICE_NAME}] getProducts: Fetched ${fetchedDocCount} product documents from Firestore.`);

  if (fetchedDocCount === 0 && !process.env.JEST_WORKER_ID) { // Avoid spamming logs during tests
      console.warn(`[${SERVICE_NAME}] getProducts: No documents returned from Firestore. This could be due to:
      1. The 'products' collection is empty.
      2. Firestore security rules are preventing reads.
      3. The 'orderBy("createdAt", ...)' clause is filtering out documents that do not have a 'createdAt' field, or where 'createdAt' is not a Firestore Timestamp.`);
  }

  const products = snapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    const docId = docSnapshot.id;
    // console.log(`[${SERVICE_NAME}] getProducts: Raw data for product ${docId}:`, JSON.stringify(data, null, 2));
    
    const createdAtStr = convertTimestampToString(data.createdAt, 'createdAt', docId);
    if (!createdAtStr && fetchedDocCount > 0 && !process.env.JEST_WORKER_ID) { 
        console.warn(`[${SERVICE_NAME}] getProducts: Product ${docId} has a missing or invalid 'createdAt' field, which is used for ordering. This document might have been excluded by the orderBy query if the field type was incompatible.`);
    }

    const product: Product = {
      id: docId,
      name: data.name ?? 'Unknown Product',
      sku: data.sku ?? '',
      description: data.description ?? '',
      category: data.category ?? 'Other',
      price: typeof data.price === 'number' ? data.price : 0,
      stock: typeof data.stock === 'number' ? data.stock : 0,
      image: data.image ?? '',
      hint: data.hint ?? '',
      taxRate: typeof data.taxRate === 'number' ? data.taxRate : 0,
      createdAt: createdAtStr,
      updatedAt: convertTimestampToString(data.updatedAt, 'updatedAt', docId),
    };
    // console.log(`[${SERVICE_NAME}] getProducts: Mapped product ${docId}:`, JSON.stringify(product, null, 2));
    return product;
  });
  console.log(`[${SERVICE_NAME}] getProducts: Returning ${products.length} mapped products to the client.`);
  return products;
}

export async function addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  console.log(`[${SERVICE_NAME}] addProduct: Adding product:`, productData);
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
  console.log(`[${SERVICE_NAME}] addProduct: Product added successfully with ID ${docRef.id}. Client-side representation:`, newProduct);
  return newProduct;
}

export async function updateProduct(id: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  console.log(`[${SERVICE_NAME}] updateProduct: Updating product ${id} with:`, productData);
  if (!id) {
    console.error(`[${SERVICE_NAME}] updateProduct: Product ID is missing.`);
    throw new Error("Product ID is required for update.");
  }
  const productDoc = doc(db, 'products', id);
  await updateDoc(productDoc, {
    ...productData,
    updatedAt: serverTimestamp(),
  });
  console.log(`[${SERVICE_NAME}] updateProduct: Product ${id} updated successfully.`);
}

export async function deleteProduct(id: string): Promise<void> {
  console.log(`[${SERVICE_NAME}] deleteProduct: Deleting product ${id}.`);
  if (!id) {
    console.error(`[${SERVICE_NAME}] deleteProduct: Product ID is missing.`);
    throw new Error("Product ID is required for deletion.");
  }
  const productDoc = doc(db, 'products', id);
  await deleteDoc(productDoc);
  console.log(`[${SERVICE_NAME}] deleteProduct: Product ${id} deleted successfully.`);
}
