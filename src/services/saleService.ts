
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
  increment // Changed: Import increment directly
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
    return timestampField;
  }
  if (timestampField instanceof Date) {
    return timestampField.toISOString();
  }
  console.warn('[saleService] Unexpected timestamp format:', timestampField);
  return undefined; 
};


export async function addSale(saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'saleDate'>): Promise<Sale> {
  try {
    const batch = writeBatch(db);
    const newSaleRef = doc(salesCollectionRef); // Auto-generate ID

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
        payments: saleData.payments.map(p => ({ mode: p.mode, amount: Number(p.amount) })),
        amountReceived: saleData.amountReceived,
        paymentMode: saleData.paymentMode,
        changeGiven: saleData.changeGiven,
        status: saleData.status,
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
      if (isNaN(item.qty) || item.qty === 0) { // Also skip if qty is not a valid number or zero
        console.warn(`[saleService] Skipping stock update for item "${item.itemName}" due to invalid or zero quantity: ${item.qty}.`);
        continue;
      }
      const productRef = doc(productsCollectionRef, item.productId);
      batch.update(productRef, { 
        stock: increment(-item.qty) // Changed: Use imported increment function
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
      payments: saleData.payments,
      amountReceived: saleData.amountReceived,
      paymentMode: saleData.paymentMode,
      changeGiven: saleData.changeGiven,
      status: saleData.status,
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
      payments: data.payments,
      amountReceived: data.amountReceived,
      paymentMode: data.paymentMode,
      changeGiven: data.changeGiven,
      status: data.status,
      notes: data.notes,
      saleDate: convertTimestampToString(data.saleDate)!, 
      createdAt: convertTimestampToString(data.createdAt),
      updatedAt: convertTimestampToString(data.updatedAt),
    };
    return sale;
  });
}
