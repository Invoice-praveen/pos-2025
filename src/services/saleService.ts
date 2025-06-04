
'use client';

import { db } from '@/lib/firebase';
import type { Sale, SaleItem, SalePayment } from '@/types';
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
  increment, 
  updateDoc,
  where
} from 'firebase/firestore';

const salesCollectionRef = collection(db, 'sales');
const productsCollectionRef = collection(db, 'products');
const customersCollectionRef = collection(db, 'customers');
const SERVICE_NAME = 'saleService';

// Robust timestamp conversion helper
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
        // console.warn(`[${SERVICE_NAME}] Invalid date string encountered${context}:`, timestampField);
        return undefined; 
      }
      return d.toISOString();
    } catch (e) {
      // console.warn(`[${SERVICE_NAME}] Error processing string as date${context}:`, e, 'Raw value:', timestampField);
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


export async function addSale(saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'saleDate' | 'status'>): Promise<Sale> {
  try {
    const batch = writeBatch(db);
    const newSaleRef = doc(salesCollectionRef); 

    const cleanedSaleItems: SaleItem[] = saleData.items.map(item => {
      if (!item.productId || typeof item.productId !== 'string' || item.productId.trim() === '') {
        if (Number(item.qty) > 0) { 
          console.error(`[${SERVICE_NAME}] addSale: Invalid or missing productId for item: ${item.itemName}`);
          throw new Error(`Product ID is missing or invalid for item "${item.itemName}". Sale cannot be processed.`);
        }
      }
      const qtyAsNumber = Number(item.qty);
      if (isNaN(qtyAsNumber)) {
        console.error(`[${SERVICE_NAME}] addSale: Invalid quantity for item: ${item.itemName} (value: ${item.qty})`);
        throw new Error(`Quantity for item "${item.itemName}" is not a valid number. Sale cannot be processed.`);
      }
      
      return { 
        productId: item.productId,
        itemCode: item.itemCode || (item.productId ? item.productId.substring(0,8).toUpperCase() : 'N/A'), // SKU
        itemName: item.itemName,
        description: item.description || '',
        qty: qtyAsNumber,
        unit: item.unit || 'pcs',
        priceUnit: Number(item.priceUnit),
        taxRate: Number(item.taxRate || 0),
        taxApplied: Number(item.taxApplied || 0),
        discount: Number(item.discount || 0),
        total: Number(item.total),
      };
    }).filter(item => item.qty > 0); 

    if (cleanedSaleItems.length === 0 && saleData.totalItems > 0) {
        console.error(`[${SERVICE_NAME}] addSale: No valid items with quantity > 0 to save.`);
        throw new Error("No items with quantity greater than 0 to save.");
    }
    
    let saleStatus: Sale['status'] = 'Unknown';
    if (saleData.totalAmount <= 0 && cleanedSaleItems.length === 0) {
      saleStatus = 'Completed'; // Or perhaps 'Cancelled' or 'Void' if it's an empty bill
    } else if (saleData.amountReceived >= saleData.totalAmount) {
      saleStatus = 'Completed';
    } else if (saleData.amountReceived > 0 && saleData.amountReceived < saleData.totalAmount) {
      saleStatus = 'PartiallyPaid';
    } else if (saleData.amountReceived === 0 && saleData.totalAmount > 0) {
      saleStatus = 'PendingPayment';
    } else { // This case should ideally not be hit if logic above is sound
      saleStatus = 'PendingPayment'; 
    }

    const saleDocumentData = {
        customerId: saleData.customerId,
        customerName: saleData.customerName,
        items: cleanedSaleItems, 
        subTotal: saleData.subTotal,
        totalItemDiscount: saleData.totalItemDiscount,
        totalTax: saleData.totalTax,
        roundOff: saleData.roundOff,
        totalAmount: saleData.totalAmount,
        totalItems: cleanedSaleItems.length, 
        totalQuantity: cleanedSaleItems.reduce((sum, item) => sum + item.qty, 0), 
        payments: saleData.payments.map(p => ({ 
          mode: p.mode, 
          amount: Number(p.amount),
          paymentDate: p.paymentDate || new Date().toISOString() 
        })),
        amountReceived: saleData.amountReceived,
        paymentMode: saleData.paymentMode, // Consider making this an array if multiple payments at creation
        changeGiven: saleData.changeGiven,
        status: saleStatus,
        notes: saleData.notes || '',
        saleDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    batch.set(newSaleRef, saleDocumentData);

    for (const item of cleanedSaleItems) {
      if (!item.productId) {
        console.warn(`[${SERVICE_NAME}] addSale: Skipping stock update for item "${item.itemName}" due to missing productId.`);
        continue;
      }
      if (isNaN(item.qty) || item.qty === 0) { 
        console.warn(`[${SERVICE_NAME}] addSale: Skipping stock update for item "${item.itemName}" due to invalid or zero quantity: ${item.qty}.`);
        continue;
      }
      const productRef = doc(productsCollectionRef, item.productId);
      batch.update(productRef, { 
        stock: increment(-item.qty) 
      });
    }
    
    if (saleData.customerId && saleData.totalAmount > 0) { // Only update customer if there's a sale value
        const customerRef = doc(customersCollectionRef, saleData.customerId);
        batch.update(customerRef, {
            totalSpent: increment(saleData.totalAmount - saleData.totalItemDiscount + saleData.totalTax), // Actual amount paid by customer for items
            lastPurchase: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    }

    await batch.commit();

    const nowISO = new Date().toISOString();
    return { 
      id: newSaleRef.id,
      ...saleData, // Spread the original data
      items: cleanedSaleItems, // Use cleaned items
      status: saleStatus, // Use determined status
      payments: saleDocumentData.payments, // Use processed payments
      saleDate: nowISO, 
      createdAt: nowISO, 
      updatedAt: nowISO 
    };

  } catch (error: any) {
    console.error(`[${SERVICE_NAME}] Error in addSale service. Attempted raw saleData:`, JSON.stringify(saleData, null, 2));
    console.error(`[${SERVICE_NAME}] Full error object:`, error); 
    
    let errorMessage = 'Unknown error occurred while saving sale.';
    if (error.message) {
      errorMessage = error.message;
    }
    if (error.code) { 
      errorMessage = `Firestore error (${error.code}): ${errorMessage}`;
    }
    throw new Error(errorMessage);
  }
}

export async function getSales(): Promise<Sale[]> {
  console.log(`[${SERVICE_NAME}] getSales: Attempting to fetch sales.`);
  const q = query(salesCollectionRef, orderBy('saleDate', 'desc'));
  const snapshot = await getDocs(q);
  console.log(`[${SERVICE_NAME}] getSales: Fetched ${snapshot.docs.length} sale documents from Firestore.`);

  return snapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    const docId = docSnapshot.id;
    const sale: Sale = {
      id: docSnapshot.id,
      customerId: data.customerId,
      customerName: data.customerName,
      items: (data.items || []).map((item: any) => ({ ...item, taxRate: item.taxRate || 0, description: item.description || '' })) as SaleItem[], 
      subTotal: data.subTotal,
      totalItemDiscount: data.totalItemDiscount || 0, // Default to 0 if undefined
      totalTax: data.totalTax,
      roundOff: data.roundOff,
      totalAmount: data.totalAmount,
      totalItems: data.totalItems,
      totalQuantity: data.totalQuantity,
      payments: (data.payments as SalePayment[] || []).map(p => ({
          ...p, 
          paymentDate: convertTimestampToString(p.paymentDate, 'paymentDate in payments array', docId)
      })),
      amountReceived: data.amountReceived,
      paymentMode: data.paymentMode,
      changeGiven: data.changeGiven,
      status: data.status as Sale['status'] || 'Unknown',
      notes: data.notes,
      saleDate: convertTimestampToString(data.saleDate, 'saleDate', docId)!, 
      createdAt: convertTimestampToString(data.createdAt, 'createdAt', docId),
      updatedAt: convertTimestampToString(data.updatedAt, 'updatedAt', docId),
    };
    return sale;
  });
}

export async function getSalesByCustomerId(customerId: string): Promise<Sale[]> {
  if (!customerId) {
    console.warn(`[${SERVICE_NAME}] getSalesByCustomerId: customerId is missing.`);
    return [];
  }
  console.log(`[${SERVICE_NAME}] getSalesByCustomerId: Attempting to fetch sales for customer ${customerId}.`);
  const q = query(salesCollectionRef, where("customerId", "==", customerId), orderBy('saleDate', 'desc'));
  const snapshot = await getDocs(q);
  console.log(`[${SERVICE_NAME}] getSalesByCustomerId: Fetched ${snapshot.docs.length} sales for customer ${customerId}.`);
  
  return snapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    const docId = docSnapshot.id;
    return {
      id: docSnapshot.id,
      customerId: data.customerId,
      customerName: data.customerName,
      items: (data.items || []).map((item: any) => ({ ...item, taxRate: item.taxRate || 0, description: item.description || '' })) as SaleItem[],
      subTotal: data.subTotal,
      totalItemDiscount: data.totalItemDiscount || 0,
      totalTax: data.totalTax,
      roundOff: data.roundOff,
      totalAmount: data.totalAmount,
      totalItems: data.totalItems,
      totalQuantity: data.totalQuantity,
      payments: (data.payments as SalePayment[] || []).map(p => ({
          ...p, 
          paymentDate: convertTimestampToString(p.paymentDate, 'paymentDate in payments array', docId)
      })),
      amountReceived: data.amountReceived,
      paymentMode: data.paymentMode,
      changeGiven: data.changeGiven,
      status: data.status as Sale['status'] || 'Unknown',
      notes: data.notes,
      saleDate: convertTimestampToString(data.saleDate, 'saleDate', docId)!,
      createdAt: convertTimestampToString(data.createdAt, 'createdAt', docId),
      updatedAt: convertTimestampToString(data.updatedAt, 'updatedAt', docId),
    } as Sale;
  });
}

export async function returnSale(saleId: string, itemsToReturn: SaleItem[]): Promise<void> {
  if (!saleId || !itemsToReturn || itemsToReturn.length === 0) {
    console.error(`[${SERVICE_NAME}] returnSale: Missing saleId or itemsToReturn.`);
    throw new Error("Missing saleId or items to return.");
  }

  try {
    const batch = writeBatch(db);
    const saleRef = doc(salesCollectionRef, saleId);

    batch.update(saleRef, {
      status: 'Returned',
      updatedAt: serverTimestamp(),
    });

    for (const item of itemsToReturn) {
      if (!item.productId || typeof item.productId !== 'string' || item.productId.trim() === '') {
        console.warn(`[${SERVICE_NAME}] returnSale: Skipping stock increment for item "${item.itemName}" due to missing productId.`);
        continue;
      }
      const qtyToReturn = Number(item.qty);
      if (isNaN(qtyToReturn) || qtyToReturn <= 0) {
        console.warn(`[${SERVICE_NAME}] returnSale: Skipping stock increment for item "${item.itemName}" due to invalid or zero quantity: ${item.qty}.`);
        continue;
      }
      const productRef = doc(productsCollectionRef, item.productId);
      batch.update(productRef, {
        stock: increment(qtyToReturn),
      });
    }

    // Note: Reversing customer's totalSpent on return can be complex. 
    // For now, we are not adjusting customer's totalSpent. This might need business logic decision.

    await batch.commit();
    console.log(`[${SERVICE_NAME}] Sale ${saleId} successfully marked as Returned and stock updated.`);
  } catch (error: any) {
    console.error(`[${SERVICE_NAME}] Error processing return for sale ${saleId}:`, error);
    let errorMessage = `Failed to process return for sale ${saleId}.`;
    if (error.message) {
      errorMessage += ` Error: ${error.message}`;
    }
    if (error.code) {
      errorMessage = `Firestore error (${error.code}): ${errorMessage}`;
    }
    throw new Error(errorMessage);
  }
}

export async function addPaymentToSale(
  saleId: string, 
  newPayment: SalePayment,
  currentTotalAmount: number,
  currentAmountReceived: number,
  currentPayments: SalePayment[]
): Promise<void> {
  if (!saleId || !newPayment) {
    throw new Error("Sale ID and new payment details are required.");
  }

  const saleRef = doc(db, 'sales', saleId);
  
  const updatedAmountReceived = currentAmountReceived + newPayment.amount;
  const updatedPayments = [...currentPayments, { ...newPayment, paymentDate: new Date().toISOString() }];
  
  let newStatus: Sale['status'] = 'PartiallyPaid';
  if (updatedAmountReceived >= currentTotalAmount) {
    newStatus = 'Completed';
  } else if (updatedAmountReceived <= 0 && currentTotalAmount > 0) { 
    newStatus = 'PendingPayment';
  } else if (currentTotalAmount <= 0 ) { 
     newStatus = 'Completed';
  }

  // Update customer's totalSpent when a new payment is made
  const saleDocSnapshot = await getDocs(query(salesCollectionRef, where("__name__", "==", saleId)));
  if (!saleDocSnapshot.empty) {
    const saleData = saleDocSnapshot.docs[0].data() as Sale;
    if (saleData.customerId) {
      const customerRef = doc(customersCollectionRef, saleData.customerId);
      await updateDoc(customerRef, {
        totalSpent: increment(newPayment.amount), // Increment by the new payment amount
        lastPurchase: serverTimestamp(), // Update last purchase/payment date
        updatedAt: serverTimestamp()
      });
    }
  }


  await updateDoc(saleRef, {
    payments: updatedPayments,
    amountReceived: updatedAmountReceived,
    status: newStatus,
    updatedAt: serverTimestamp(),
  });
}
