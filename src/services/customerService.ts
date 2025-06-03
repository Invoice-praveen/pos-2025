
'use server';

import { db } from '@/lib/firebase';
import type { Customer } from '@/types';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy 
} from 'firebase/firestore';

const customersCollectionRef = collection(db, 'customers');

export async function getCustomers(): Promise<Customer[]> {
  const q = query(customersCollectionRef, orderBy('name', 'asc')); // Order by name
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Customer));
}

// Add functions for addCustomer, updateCustomer, deleteCustomer as needed
