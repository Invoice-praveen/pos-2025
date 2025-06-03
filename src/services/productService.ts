
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
  deleteDoc
} from 'firebase/firestore';

const productsCollectionRef = collection(db, 'products');

export async function getProducts(): Promise<Product[]> {
  const q = query(productsCollectionRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
}

export async function addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  const docRef = await addDoc(productsCollectionRef, {
    ...productData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { ...productData, id: docRef.id, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }; // Approximate, serverTimestamp resolves on server
}

export async function updateProduct(id: string, productData: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<void> {
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
