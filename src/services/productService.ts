
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
  Timestamp, // Ensured value import
  FieldValue, // For FieldValue.increment if used, though not directly here
  increment
} from 'firebase/firestore';

const productsCollectionRef = collection(db, 'products');

// Updated to be more robust and accept context for logging
const convertTimestampToString = (timestampField: unknown, fieldName?: string, docId?: string): string | undefined => {
  const context = fieldName && docId ? ` (Field: ${fieldName}, Doc: ${docId})` : '';
  if (!timestampField) return undefined;

  if (typeof (timestampField as any)?.toDate === 'function') {
    try {
      return (timestampField as { toDate: () => Date }).toDate().toISOString();
    } catch (e) {
      console.warn(`[productService] Error converting Firestore Timestamp to ISOString${context}:`, e, 'Raw value:', timestampField);
      return undefined;
    }
  }

  if (timestampField instanceof Date) {
    try {
      return timestampField.toISOString();
    } catch (e) {
      console.warn(`[productService] Error converting Date to ISOString${context}:`, e, 'Raw value:', timestampField);
      return undefined;
    }
  }

  if (typeof timestampField === 'string') {
    // Basic check for ISO string format
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(timestampField)) {
      return timestampField;
    } else if (fieldName === 'createdAt' || fieldName === 'updatedAt') {
        // If it's a timestamp field and not ISO, log warning and return undefined
        console.warn(`[productService] Field${context} is a string but not a valid ISO string:`, timestampField);
        return undefined;
    }
    // For other string fields that are not necessarily timestamps, return as is.
    // However, product type defines createdAt/updatedAt as string, implying ISO.
    return timestampField;
  }

  console.warn(`[productService] Unexpected timestamp format for field${context}:`, timestampField, 'Type:', typeof timestampField);
  return undefined;
};


export async function getProducts(): Promise<Product[]> {
  const q = query(productsCollectionRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  console.log(`[productService] getProducts: Fetched ${snapshot.docs.length} product documents from Firestore.`);

  return snapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    const docId = docSnapshot.id;
    // console.log(`[productService] getProducts: Raw data for product ${docId}:`, JSON.stringify(data));

    const product: Product = {
      id: docId,
      name: data.name ?? 'Unknown Product', // Default if name is missing
      category: data.category ?? 'Other',    // Default category
      price: typeof data.price === 'number' ? data.price : 0, // Default price
      stock: typeof data.stock === 'number' ? data.stock : 0, // Default stock
      image: data.image ?? '',
      hint: data.hint ?? '',
      createdAt: convertTimestampToString(data.createdAt, 'createdAt', docId),
      updatedAt: convertTimestampToString(data.updatedAt, 'updatedAt', docId),
    };
    // console.log(`[productService] getProducts: Mapped product ${docId}:`, JSON.stringify(product));
    return product;
  });
}

export async function addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  console.log('[productService] addProduct: Adding product:', productData);
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
  console.log('[productService] addProduct: Product added successfully:', newProduct);
  return newProduct;
}

export async function updateProduct(id: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  console.log(`[productService] updateProduct: Updating product ${id} with:`, productData);
  const productDoc = doc(db, 'products', id);
  await updateDoc(productDoc, {
    ...productData,
    updatedAt: serverTimestamp(),
  });
  console.log(`[productService] updateProduct: Product ${id} updated successfully.`);
}

export async function deleteProduct(id: string): Promise<void> {
  console.log(`[productService] deleteProduct: Deleting product ${id}.`);
  const productDoc = doc(db, 'products', id);
  await deleteDoc(productDoc);
  console.log(`[productService] deleteProduct: Product ${id} deleted successfully.`);
}

