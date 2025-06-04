
'use server';

import { db } from '@/lib/firebase';
import type { Expense, ExpenseCategory } from '@/types';
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

const expensesCollectionRef = collection(db, 'expenses');
const SERVICE_NAME = 'expenseService';

const convertTimestampToString = (timestampField: unknown, fieldName?: string, docId?: string): string | undefined => {
  const context = fieldName && docId ? ` (Field: ${fieldName}, Doc: ${docId})` : '';
  if (!timestampField) return undefined;
  if (typeof (timestampField as any)?.toDate === 'function') { // Firestore Timestamp
    return (timestampField as Timestamp).toDate().toISOString();
  }
  if (timestampField instanceof Date) { // JavaScript Date
    return timestampField.toISOString();
  }
  if (typeof timestampField === 'string') { // ISO String
    try {
      return new Date(timestampField).toISOString();
    } catch (e) { return undefined; }
  }
  console.warn(`[${SERVICE_NAME}] Unexpected timestamp format${context}:`, timestampField);
  return undefined;
};

export async function getExpenses(): Promise<Expense[]> {
  console.log(`[${SERVICE_NAME}] getExpenses: Attempting to fetch expenses.`);
  const q = query(expensesCollectionRef, orderBy('expenseDate', 'desc'));
  const snapshot = await getDocs(q);
  console.log(`[${SERVICE_NAME}] getExpenses: Fetched ${snapshot.docs.length} expense documents.`);
  
  return snapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    const docId = docSnapshot.id;
    const expense: Expense = {
      id: docId,
      expenseDate: convertTimestampToString(data.expenseDate, 'expenseDate', docId)!,
      category: data.category as ExpenseCategory,
      amount: data.amount,
      payee: data.payee,
      description: data.description,
      notes: data.notes,
      createdAt: convertTimestampToString(data.createdAt, 'createdAt', docId),
      updatedAt: convertTimestampToString(data.updatedAt, 'updatedAt', docId),
    };
    return expense;
  });
}

export async function addExpense(expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'expenseDate'> & { expenseDate: Date }): Promise<Expense> {
  const docRef = await addDoc(expensesCollectionRef, {
    ...expenseData,
    expenseDate: Timestamp.fromDate(expenseData.expenseDate), // Store as Firestore Timestamp
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const nowISO = new Date().toISOString();
  return { 
    ...expenseData, 
    id: docRef.id, 
    expenseDate: expenseData.expenseDate.toISOString(),
    createdAt: nowISO, 
    updatedAt: nowISO,
  }; 
}

export async function updateExpense(id: string, expenseData: Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'expenseDate'> & { expenseDate?: Date }>): Promise<void> {
  const expenseDoc = doc(db, 'expenses', id);
  const updatePayload: any = { ...expenseData };

  if (expenseData.expenseDate) {
    updatePayload.expenseDate = Timestamp.fromDate(expenseData.expenseDate);
  }
  
  await updateDoc(expenseDoc, {
    ...updatePayload,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteExpense(id: string): Promise<void> {
  const expenseDoc = doc(db, 'expenses', id);
  await deleteDoc(expenseDoc);
}
