
'use server';

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

const convertTimestampToString = (timestampField: unknown): string | undefined => {
  if (!timestampField) return undefined;
  if (timestampField instanceof Timestamp) { 
    return timestampField.toDate().toISOString();
  }
  if (typeof timestampField === 'string') {
    return timestampField;
  }
  if (timestampField instanceof Date) {
    return timestampField.toISOString();
  }
  console.warn('[saleService] Unexpected timestamp format:', timestampField);
  return undefined; 
};


export async function addSale(saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'saleDate' | 'status'>): Promise<Sale> {
  try {
    const batch = writeBatch(db);
    const newSaleRef = doc(salesCollectionRef); 

    const cleanedSaleItems = saleData.items.map(item => {
      if (!item.productId || typeof item.productId !== 'string' || item.productId.trim() === '') {
        if (Number(item.qty) > 0) { 
          console.error(`[saleService] addSale: Invalid or missing productId for item: ${item.itemName}`);
          throw new Error(`Product ID is missing or invalid for item "${item.itemName}". Sale cannot be processed.`);
        }
      }
      const qtyAsNumber = Number(item.qty);
      if (isNaN(qtyAsNumber)) {
        console.error(`[saleService] addSale: Invalid quantity for item: ${item.itemName} (value: ${item.qty})`);
        throw new Error(`Quantity for item "${item.itemName}" is not a valid number. Sale cannot be processed.`);
      }
      
      return { 
        productId: item.productId,
        itemCode: item.itemCode || (item.productId ? item.productId.substring(0,8).toUpperCase() : 'N/A'),
        itemName: item.itemName,
        qty: qtyAsNumber,
        unit: item.unit || 'pcs',
        priceUnit: Number(item.priceUnit),
        discount: Number(item.discount || 0),
        taxApplied: Number(item.taxApplied || 0),
        total: Number(item.total),
      };
    }).filter(item => item.qty > 0); 

    if (cleanedSaleItems.length === 0 && saleData.totalItems > 0) {
        console.error("[saleService] addSale: No valid items with quantity > 0 to save.");
        throw new Error("No items with quantity greater than 0 to save.");
    }
    
    let saleStatus: Sale['status'] = 'Unknown';
    if (saleData.totalAmount <= 0 && cleanedSaleItems.length === 0) { // Handles zero total, zero items as completed (e.g. free service)
      saleStatus = 'Completed';
    } else if (saleData.amountReceived >= saleData.totalAmount) {
      saleStatus = 'Completed';
    } else if (saleData.amountReceived > 0 && saleData.amountReceived < saleData.totalAmount) {
      saleStatus = 'PartiallyPaid';
    } else if (saleData.amountReceived === 0 && saleData.totalAmount > 0) {
      saleStatus = 'PendingPayment';
    } else {
      saleStatus = 'PendingPayment'; // Default for edge cases or zero total amount with items.
    }


    const saleDocumentData = {
        customerId: saleData.customerId,
        customerName: saleData.customerName,
        items: cleanedSaleItems, 
        subTotal: saleData.subTotal,
        totalDiscount: saleData.totalDiscount,
        totalTax: saleData.totalTax,
        roundOff: saleData.roundOff,
        totalAmount: saleData.totalAmount,
        totalItems: cleanedSaleItems.length, 
        totalQuantity: cleanedSaleItems.reduce((sum, item) => sum + item.qty, 0), 
        payments: saleData.payments.map(p => ({ 
          mode: p.mode, 
          amount: Number(p.amount),
          paymentDate: new Date().toISOString() // Add payment date for new payments
        })),
        amountReceived: saleData.amountReceived,
        paymentMode: saleData.paymentMode,
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
        console.warn(`[saleService] Skipping stock update for item "${item.itemName}" due to missing productId.`);
        continue;
      }
      if (isNaN(item.qty) || item.qty === 0) { 
        console.warn(`[saleService] Skipping stock update for item "${item.itemName}" due to invalid or zero quantity: ${item.qty}.`);
        continue;
      }
      const productRef = doc(productsCollectionRef, item.productId);
      batch.update(productRef, { 
        stock: increment(-item.qty) 
      });
    }
    
    // Update customer's totalSpent and lastPurchase
    if (saleData.customerId && saleData.totalAmount > 0) {
        const customerRef = doc(db, 'customers', saleData.customerId);
        batch.update(customerRef, {
            totalSpent: increment(saleData.totalAmount),
            lastPurchase: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    }


    await batch.commit();

    const nowISO = new Date().toISOString();
    return { 
      id: newSaleRef.id,
      customerId: saleData.customerId,
      customerName: saleData.customerName,
      items: cleanedSaleItems,
      subTotal: saleData.subTotal,
      totalDiscount: saleData.totalDiscount,
      totalTax: saleData.totalTax,
      roundOff: saleData.roundOff,
      totalAmount: saleData.totalAmount,
      totalItems: cleanedSaleItems.length,
      totalQuantity: cleanedSaleItems.reduce((sum, item) => sum + item.qty, 0),
      payments: saleDocumentData.payments, // Return payments with added date
      amountReceived: saleData.amountReceived,
      paymentMode: saleData.paymentMode,
      changeGiven: saleData.changeGiven,
      status: saleStatus,
      notes: saleData.notes,
      saleDate: nowISO, 
      createdAt: nowISO, 
      updatedAt: nowISO 
    };

  } catch (error: any) {
    console.error("[saleService] Error in addSale service. Attempted raw saleData:", JSON.stringify(saleData, null, 2));
    console.error("[saleService] Full error object:", error); 
    
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
      payments: data.payments as SalePayment[],
      amountReceived: data.amountReceived,
      paymentMode: data.paymentMode,
      changeGiven: data.changeGiven,
      status: data.status as Sale['status'] || 'Unknown',
      notes: data.notes,
      saleDate: convertTimestampToString(data.saleDate)!, 
      createdAt: convertTimestampToString(data.createdAt),
      updatedAt: convertTimestampToString(data.updatedAt),
    };
    return sale;
  });
}

export async function getSalesByCustomerId(customerId: string): Promise<Sale[]> {
  if (!customerId) {
    console.warn("[saleService] getSalesByCustomerId: customerId is missing.");
    return [];
  }
  const q = query(salesCollectionRef, where("customerId", "==", customerId), orderBy('saleDate', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    return {
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
      payments: data.payments as SalePayment[],
      amountReceived: data.amountReceived,
      paymentMode: data.paymentMode,
      changeGiven: data.changeGiven,
      status: data.status as Sale['status'] || 'Unknown',
      notes: data.notes,
      saleDate: convertTimestampToString(data.saleDate)!,
      createdAt: convertTimestampToString(data.createdAt),
      updatedAt: convertTimestampToString(data.updatedAt),
    } as Sale;
  });
}

export async function returnSale(saleId: string, itemsToReturn: SaleItem[]): Promise<void> {
  if (!saleId || !itemsToReturn || itemsToReturn.length === 0) {
    console.error("[saleService] returnSale: Missing saleId or itemsToReturn.");
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
        console.warn(`[saleService] returnSale: Skipping stock increment for item "${item.itemName}" due to missing productId.`);
        continue;
      }
      const qtyToReturn = Number(item.qty);
      if (isNaN(qtyToReturn) || qtyToReturn <= 0) {
        console.warn(`[saleService] returnSale: Skipping stock increment for item "${item.itemName}" due to invalid or zero quantity: ${item.qty}.`);
        continue;
      }
      const productRef = doc(productsCollectionRef, item.productId);
      batch.update(productRef, {
        stock: increment(qtyToReturn),
      });
    }

    await batch.commit();
    console.log(`[saleService] Sale ${saleId} successfully marked as Returned and stock updated.`);
  } catch (error: any) {
    console.error(`[saleService] Error processing return for sale ${saleId}:`, error);
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

// Placeholder for adding further payments to an existing sale
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
  } else if (updatedAmountReceived <= 0) {
    newStatus = 'PendingPayment';
  }

  await updateDoc(saleRef, {
    payments: updatedPayments,
    amountReceived: updatedAmountReceived,
    status: newStatus,
    updatedAt: serverTimestamp(),
  });
}
