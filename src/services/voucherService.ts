
'use server';

import { db } from '@/lib/firebase';
import type { FinancialVoucher, VoucherType } from '@/types'; // Ensure correct import path and types
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

const vouchersCollectionRef = collection(db, 'financial_vouchers');
const SERVICE_NAME = 'voucherService';

// Robust timestamp conversion helper
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

export async function getVouchers(): Promise<FinancialVoucher[]> {
  console.log(`[${SERVICE_NAME}] getVouchers: Placeholder - Not implemented yet.`);
  // TODO: Implement fetching logic
  // const q = query(vouchersCollectionRef, orderBy('voucherDate', 'desc'));
  // const snapshot = await getDocs(q);
  // return snapshot.docs.map(docSnapshot => { /* ... mapping ... */ });
  return Promise.resolve([]); // Placeholder
}

export async function addVoucher(voucherData: Omit<FinancialVoucher, 'id' | 'createdAt' | 'updatedAt' | 'voucherDate'> & { voucherDate: Date }): Promise<FinancialVoucher> {
  console.log(`[${SERVICE_NAME}] addVoucher: Placeholder - Not implemented yet. Data:`, voucherData);
  // TODO: Implement adding logic
  // const docRef = await addDoc(vouchersCollectionRef, {
  //   ...voucherData,
  //   voucherDate: Timestamp.fromDate(voucherData.voucherDate),
  //   createdAt: serverTimestamp(),
  //   updatedAt: serverTimestamp(),
  // });
  // const nowISO = new Date().toISOString();
  // return { ...voucherData, id: docRef.id, voucherDate: voucherData.voucherDate.toISOString(), createdAt: nowISO, updatedAt: nowISO };
  
  // Placeholder response
  const nowISO = new Date().toISOString();
  return Promise.resolve({
    ...voucherData,
    id: 'mock-voucher-id-' + Date.now(),
    voucherDate: voucherData.voucherDate.toISOString(),
    createdAt: nowISO,
    updatedAt: nowISO,
  });
}

export async function updateVoucher(id: string, voucherData: Partial<Omit<FinancialVoucher, 'id' | 'createdAt' | 'updatedAt' | 'voucherDate'> & { voucherDate?: Date }>): Promise<void> {
  console.log(`[${SERVICE_NAME}] updateVoucher: Placeholder - Not implemented yet. ID: ${id}, Data:`, voucherData);
  // TODO: Implement update logic
  // const voucherDoc = doc(db, 'financial_vouchers', id);
  // const updatePayload: any = { ...voucherData };
  // if (voucherData.voucherDate) {
  //   updatePayload.voucherDate = Timestamp.fromDate(voucherData.voucherDate);
  // }
  // await updateDoc(voucherDoc, { ...updatePayload, updatedAt: serverTimestamp() });
  return Promise.resolve(); // Placeholder
}

export async function deleteVoucher(id: string): Promise<void> {
  console.log(`[${SERVICE_NAME}] deleteVoucher: Placeholder - Not implemented yet. ID: ${id}`);
  // TODO: Implement delete logic
  // const voucherDoc = doc(db, 'financial_vouchers', id);
  // await deleteDoc(voucherDoc);
  return Promise.resolve(); // Placeholder
}
