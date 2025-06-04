
'use client';

import { db } from '@/lib/firebase';
import type { Purchase, PurchaseItem, Supplier, PurchaseStatus, PurchasePaymentStatus } from '@/types';
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
  Timestamp,
  writeBatch,
  increment,
  where,
  getDoc // Added getDoc here
} from 'firebase/firestore';

const purchasesCollectionRef = collection(db, 'purchases');
const productsCollectionRef = collection(db, 'products');
const suppliersCollectionRef = collection(db, 'suppliers');
const SERVICE_NAME = 'purchaseService';

// Timestamp conversion (ensure consistency with other services)
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
        return undefined; 
      }
      return d.toISOString();
    } catch (e) {
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


export async function getPurchases(): Promise<Purchase[]> {
  console.log(`[${SERVICE_NAME}] getPurchases: Attempting to fetch purchases.`);
  const q = query(purchasesCollectionRef, orderBy('purchaseDate', 'desc'));
  const snapshot = await getDocs(q);
  console.log(`[${SERVICE_NAME}] getPurchases: Fetched ${snapshot.docs.length} purchase documents.`);
  
  return snapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    const docId = docSnapshot.id;
    const purchase: Purchase = {
      id: docId,
      supplierId: data.supplierId,
      supplierName: data.supplierName || 'N/A', // Ensure supplierName exists
      items: data.items as PurchaseItem[],
      purchaseOrderNumber: data.purchaseOrderNumber,
      purchaseDate: convertTimestampToString(data.purchaseDate, 'purchaseDate', docId)!,
      expectedDeliveryDate: convertTimestampToString(data.expectedDeliveryDate, 'expectedDeliveryDate', docId),
      subTotal: data.subTotal || 0,
      shippingCost: data.shippingCost || 0,
      otherCharges: data.otherCharges || 0,
      totalAmount: data.totalAmount || 0,
      amountPaid: data.amountPaid || 0,
      paymentStatus: data.paymentStatus || 'Unpaid',
      status: data.status as PurchaseStatus || 'Draft',
      notes: data.notes,
      createdAt: convertTimestampToString(data.createdAt, 'createdAt', docId),
      updatedAt: convertTimestampToString(data.updatedAt, 'updatedAt', docId),
    };
    return purchase;
  });
}

export async function addPurchase(
  purchaseData: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt' | 'items' | 'supplierName' | 'paymentStatus'>, 
  itemsData: PurchaseItem[] // Changed name to avoid conflict with 'items' in purchaseData if any
): Promise<Purchase> {
  console.log(`[${SERVICE_NAME}] addPurchase: Adding purchase order with data:`, purchaseData, "and items:", itemsData);
  
  const batch = writeBatch(db);
  const newPurchaseRef = doc(purchasesCollectionRef);

  const supplierDocSnap = await getDoc(doc(suppliersCollectionRef, purchaseData.supplierId));
  if (!supplierDocSnap.exists()) {
    throw new Error(`Supplier with ID ${purchaseData.supplierId} not found.`);
  }
  const supplierName = supplierDocSnap.data()?.name || 'Unknown Supplier';

  let paymentStatus: PurchasePaymentStatus = 'Unpaid';
  if (purchaseData.amountPaid >= purchaseData.totalAmount && purchaseData.totalAmount > 0) {
    paymentStatus = 'Paid';
  } else if (purchaseData.amountPaid > 0 && purchaseData.amountPaid < purchaseData.totalAmount) {
    paymentStatus = 'PartiallyPaid';
  }

  const purchaseToSave: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'> = {
    ...purchaseData,
    supplierName: supplierName,
    items: itemsData,
    paymentStatus: paymentStatus,
    purchaseDate: purchaseData.purchaseDate ? new Date(purchaseData.purchaseDate).toISOString() : new Date().toISOString(),
    expectedDeliveryDate: purchaseData.expectedDeliveryDate ? new Date(purchaseData.expectedDeliveryDate).toISOString() : undefined,
    // Timestamps will be set by serverTimestamp
  };

  batch.set(newPurchaseRef, {
    ...purchaseToSave,
    purchaseDate: purchaseData.purchaseDate ? new Date(purchaseData.purchaseDate) : serverTimestamp(),
    expectedDeliveryDate: purchaseData.expectedDeliveryDate ? new Date(purchaseData.expectedDeliveryDate) : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (purchaseData.status === 'Ordered' || purchaseData.status === 'Completed') {
    for (const item of itemsData) {
      if (item.productId && item.qty > 0) {
        const productRef = doc(productsCollectionRef, item.productId);
        batch.update(productRef, { stock: increment(item.qty) });
        console.log(`[${SERVICE_NAME}] addPurchase: Queued stock increment for product ${item.productId} by ${item.qty}.`);
      }
    }
  }
  
  await batch.commit();
  console.log(`[${SERVICE_NAME}] addPurchase: Purchase order ${newPurchaseRef.id} committed.`);
  
  const nowISO = new Date().toISOString();
  return { 
    ...purchaseToSave, 
    id: newPurchaseRef.id, 
    createdAt: nowISO, 
    updatedAt: nowISO 
  };
}

export async function updatePurchaseStatusAndPayment(
  purchaseId: string,
  status: PurchaseStatus,
  amountPaid: number,
  items: PurchaseItem[] // Pass items to update stock if status changes to completed/ordered
): Promise<void> {
  console.log(`[${SERVICE_NAME}] updatePurchaseStatusAndPayment: Updating PO ${purchaseId} to status ${status}, amountPaid ${amountPaid}.`);
  const purchaseRef = doc(purchasesCollectionRef, purchaseId);
  const purchaseSnap = await getDoc(purchaseRef);

  if (!purchaseSnap.exists()) {
    throw new Error(`Purchase order with ID ${purchaseId} not found.`);
  }
  const currentPurchaseData = purchaseSnap.data() as Purchase;

  const batch = writeBatch(db);
  
  let newPaymentStatus: PurchasePaymentStatus = currentPurchaseData.paymentStatus;
  if (amountPaid >= currentPurchaseData.totalAmount && currentPurchaseData.totalAmount > 0) {
    newPaymentStatus = 'Paid';
  } else if (amountPaid > 0 && amountPaid < currentPurchaseData.totalAmount) {
    newPaymentStatus = 'PartiallyPaid';
  } else if (amountPaid <= 0 && currentPurchaseData.totalAmount > 0) {
    newPaymentStatus = 'Unpaid';
  }

  const updatePayload: Partial<Purchase> & {updatedAt: any} = { // Ensure updatedAt type matches serverTimestamp
    status,
    amountPaid,
    paymentStatus: newPaymentStatus,
    updatedAt: serverTimestamp(), 
  };

  // If moving to 'Ordered' or 'Completed' and it wasn't already in a stock-updated state
  const stockUpdateNeeded = 
    (status === 'Ordered' || status === 'Completed') &&
    (currentPurchaseData.status !== 'Ordered' && currentPurchaseData.status !== 'Completed');

  if (stockUpdateNeeded) {
    console.log(`[${SERVICE_NAME}] updatePurchaseStatusAndPayment: Stock update needed for PO ${purchaseId}.`);
    for (const item of items) {
      if (item.productId && item.qty > 0) {
        const productRef = doc(productsCollectionRef, item.productId);
        batch.update(productRef, { stock: increment(item.qty) });
        console.log(`[${SERVICE_NAME}] updatePurchaseStatusAndPayment: Queued stock increment for product ${item.productId} by ${item.qty}.`);
      }
    }
  }
  
  batch.update(purchaseRef, updatePayload);
  await batch.commit();
  console.log(`[${SERVICE_NAME}] updatePurchaseStatusAndPayment: PO ${purchaseId} updated successfully.`);
}

export async function deletePurchase(purchaseId: string): Promise<void> {
  console.log(`[${SERVICE_NAME}] deletePurchase: Attempting to delete purchase order ${purchaseId}.`);
  if (!purchaseId) {
    console.error(`[${SERVICE_NAME}] deletePurchase: Purchase ID is missing.`);
    throw new Error("Purchase ID is required for deletion.");
  }
  // IMPORTANT: Consider if stock should be reversed here.
  // For simplicity, this version directly deletes the PO document.
  // A "cancel" operation might be more appropriate for reversing stock.
  const purchaseDoc = doc(db, 'purchases', purchaseId);
  await deleteDoc(purchaseDoc);
  console.log(`[${SERVICE_NAME}] deletePurchase: Purchase order ${purchaseId} deleted successfully.`);
}
