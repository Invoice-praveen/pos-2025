
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

// Helper to convert Firestore Timestamp to ISO string or return string if already
const convertTimestampToString = (timestampField: unknown): string | undefined => {
  if (!timestampField) return undefined;
  if (typeof (timestampField as Timestamp).toDate === 'function') {
    return (timestampField as Timestamp).toDate().toISOString();
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
    createdAt: nowISO, // Return ISO string for client
    updatedAt: nowISO  // Return ISO string for client
  }; 
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
