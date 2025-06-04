
'use server';

import { db, Timestamp } from '@/lib/firebase';
import type { CompanySettings } from '@/types';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

const SETTINGS_COLLECTION = 'company_settings';
const SETTINGS_DOC_ID = 'main'; // Single document for all settings
const SERVICE_NAME = 'settingsService';

const convertTimestampToString = (timestampField: unknown): string | undefined => {
  if (!timestampField) return undefined;
  if (typeof (timestampField as any)?.toDate === 'function') {
    return (timestampField as { toDate: () => Date }).toDate().toISOString();
  }
  if (timestampField instanceof Date) {
    return timestampField.toISOString();
  }
  if (typeof timestampField === 'string') {
    try {
      return new Date(timestampField).toISOString();
    } catch (e) { /* ignore */ }
  }
  return undefined;
};

export async function getCompanySettings(): Promise<CompanySettings | null> {
  try {
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    const docSnap = await getDoc(settingsDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // console.log(`[${SERVICE_NAME}] getCompanySettings: Raw data:`, data);
      const settings: CompanySettings = {
        id: docSnap.id,
        storeName: data.storeName || 'My Store',
        storeAddress: data.storeAddress || '123 Main St',
        storePhone: data.storePhone || '',
        storeEmail: data.storeEmail || '',
        storeWebsite: data.storeWebsite || '',
        logoUrl: data.logoUrl || '',
        invoiceTagline: data.invoiceTagline || '',
        defaultTaxRate: typeof data.defaultTaxRate === 'number' ? data.defaultTaxRate : 0,
        receiptHeader: data.receiptHeader || '',
        receiptFooter: data.receiptFooter || '',
        invoiceTerms: data.invoiceTerms || '',
        authorizedSignature: data.authorizedSignature || '',
        enableLowStockAlerts: typeof data.enableLowStockAlerts === 'boolean' ? data.enableLowStockAlerts : true,
        updatedAt: convertTimestampToString(data.updatedAt),
      };
      // console.log(`[${SERVICE_NAME}] getCompanySettings: Mapped settings:`, settings);
      return settings;
    } else {
      console.log(`[${SERVICE_NAME}] getCompanySettings: No settings document found. Returning null.`);
      return null; // Or return default settings
    }
  } catch (error) {
    console.error(`[${SERVICE_NAME}] Error fetching company settings:`, error);
    throw new Error('Failed to fetch company settings.');
  }
}

export async function updateCompanySettings(settingsData: Partial<Omit<CompanySettings, 'id' | 'updatedAt'>>): Promise<void> {
  try {
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    const payload: any = { ...settingsData };

    // Ensure numeric fields are numbers
    if (typeof settingsData.defaultTaxRate === 'string') {
      payload.defaultTaxRate = parseFloat(settingsData.defaultTaxRate) / 100;
      if (isNaN(payload.defaultTaxRate)) payload.defaultTaxRate = 0;
    } else if (typeof settingsData.defaultTaxRate === 'number') {
      payload.defaultTaxRate = settingsData.defaultTaxRate; // Assume it's already in decimal format if number
    }


    await setDoc(settingsDocRef, {
      ...payload,
      updatedAt: serverTimestamp(),
    }, { merge: true }); // Use merge:true to create if not exists or update existing
    console.log(`[${SERVICE_NAME}] updateCompanySettings: Settings updated successfully.`);
  } catch (error) {
    console.error(`[${SERVICE_NAME}] Error updating company settings:`, error);
    throw new Error('Failed to update company settings.');
  }
}
