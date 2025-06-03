
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
  Timestamp // Changed from "type Timestamp" to value import
} from 'firebase/firestore';

const productsCollectionRef = collection(db, 'products');

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
      // Not a valid date string, might be some other string field
      console.warn('[productService] Non-date string encountered in timestamp field:', timestampField);
      return undefined; // Or handle as an error
    }
  }
  if (timestampField instanceof Date) { // Handle native JS Date objects
    return timestampField.toISOString();
  }
  console.warn('[productService] Unexpected timestamp format:', timestampField);
  return undefined;
};


export async function getProducts(): Promise<Product[]> {
  const q = query(productsCollectionRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      name: data.name,
      category: data.category,
      price: data.price,
      stock: data.stock,
      image: data.image,
      hint: data.hint,
      createdAt: convertTimestampToString(data.createdAt),
      updatedAt: convertTimestampToString(data.updatedAt),
    } as Product; // Cast as Product, ensure all fields align
  });
}

export async function addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  const docRef = await addDoc(productsCollectionRef, {
    ...productData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const nowISO = new Date().toISOString();
  // Return a serializable version immediately
  return {
    ...productData,
    id: docRef.id,
    createdAt: nowISO, // Placeholder, actual value will be from Firestore
    updatedAt: nowISO  // Placeholder
  };
}

export async function updateProduct(id: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  const productDoc = doc(db, 'products', id);
  await updateDoc(productDoc, {
    ...productData,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  const productDoc = doc(db, 'products', id);
  await deleteDoc(productDoc);
}
