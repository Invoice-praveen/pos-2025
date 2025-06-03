
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
  type Timestamp
} from 'firebase/firestore';

const productsCollectionRef = collection(db, 'products');

const convertTimestampToString = (timestampField: unknown): string | undefined => {
  if (!timestampField) return undefined;
  if (timestampField instanceof Timestamp) { // Check if it's already a Firestore Timestamp
    return timestampField.toDate().toISOString();
  }
  if (typeof (timestampField as any)?.toDate === 'function') { // Check for toDate method (duck typing for server-side resolved timestamps)
    return (timestampField as any).toDate().toISOString();
  }
  if (typeof timestampField === 'string') {
    return timestampField;
  }
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
    } as Product;
  });
}

export async function addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  const docRef = await addDoc(productsCollectionRef, {
    ...productData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const nowISO = new Date().toISOString();
  return {
    ...productData,
    id: docRef.id,
    createdAt: nowISO,
    updatedAt: nowISO
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
