
'use server';

import { db } from '@/lib/firebase';
import type { Sale, SaleItem } from '@/types';
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  doc, 
  writeBatch,
  getDocs,
  query,
  orderBy,
  Timestamp,
  FieldValue
} from 'firebase/firestore';

const salesCollectionRef = collection(db, 'sales');
const productsCollectionRef = collection(db, 'products');

// Helper to convert Firestore Timestamp to ISO string or return string if already
const convertTimestampToString = (timestampField: unknown): string | undefined => {
  if (!timestampField) return undefined;
  if (timestampField instanceof Timestamp) { // Check if it's a Firestore Timestamp
    return timestampField.toDate().toISOString();
  }
  if (typeof timestampField === 'string') {
    // Could add validation here to ensure it's a valid ISO string if necessary
    return timestampField;
  }
  // If it's already a Date object (less likely from Firestore directly but good practice)
  if (timestampField instanceof Date) {
    return timestampField.toISOString();
  }
  console.warn('Unexpected timestamp format:', timestampField);
  return undefined; 
};


export async function addSale(saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'saleDate'>): Promise<Sale> {
  const batch = writeBatch(db);

  // 1. Prepare the new sale document
  const newSaleRef = doc(salesCollectionRef); // Auto-generate ID for the new sale
  batch.set(newSaleRef, {
    ...saleData,
    saleDate: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 2. Update stock for each product sold
  saleData.items.forEach((item: SaleItem) => {
    if (item.productId && item.qty > 0) {
      const productRef = doc(productsCollectionRef, item.productId);
      // Use FieldValue.increment to atomically decrement stock
      // This is safer against race conditions than reading, calculating, and writing.
      batch.update(productRef, { 
        stock: FieldValue.increment(-item.qty) 
      });
    }
  });

  // 3. Commit the batch
  await batch.commit();

  // For the object returned to the client, use serializable date placeholders.
  const nowISO = new Date().toISOString();
  return { 
    ...saleData, 
    id: newSaleRef.id, 
    saleDate: nowISO, 
    createdAt: nowISO, 
    updatedAt: nowISO 
  };
}

export async function getSales(): Promise<Sale[]> {
  const q = query(salesCollectionRef, orderBy('saleDate', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    const sale: Sale = {
      id: docSnapshot.id,
      customerId: data.customerId,
      customerName: data.customerName,
      items: data.items as SaleItem[],
      subTotal: data.subTotal,
      totalDiscount: data.totalDiscount,
      totalTax: data.totalTax,
      roundOff: data.roundOff,
      totalAmount: data.totalAmount,
      totalItems: data.totalItems,
      totalQuantity: data.totalQuantity,
      payments: data.payments,
      amountReceived: data.amountReceived,
      paymentMode: data.paymentMode,
      changeGiven: data.changeGiven,
      status: data.status,
      notes: data.notes,
      saleDate: convertTimestampToString(data.saleDate)!, // Assuming saleDate will always exist
      createdAt: convertTimestampToString(data.createdAt),
      updatedAt: convertTimestampToString(data.updatedAt),
    };
    return sale;
  });
}
