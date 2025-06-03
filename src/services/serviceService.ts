
'use server';

import { db } from '@/lib/firebase';
import type { Service, ServiceStatus, ServiceType } from '@/types'; // Ensure correct import path and types
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
  where
} from 'firebase/firestore';

const servicesCollectionRef = collection(db, 'services');
const SERVICE_NAME = 'serviceService';

// Robust timestamp conversion helper (copied from other services for consistency)
const convertTimestampToString = (timestampField: unknown, fieldName?: string, docId?: string): string | undefined => {
  const context = fieldName && docId ? ` (Field: ${fieldName}, Doc: ${docId})` : (fieldName ? ` (Field: ${fieldName})` : '');
  
  if (timestampField === null || typeof timestampField === 'undefined') {
    return undefined;
  }

  if (typeof (timestampField as any)?.toDate === 'function') {
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

  if (timestampField instanceof Date) {
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

  if (typeof timestampField === 'string') {
    try {
      const d = new Date(timestampField);
      if (isNaN(d.getTime())) {
        // console.warn(`[${SERVICE_NAME}] Invalid date string encountered${context}:`, timestampField);
        return undefined;
      }
      return d.toISOString(); // Return as ISO string if it's a valid date string
    } catch (e) {
      // console.warn(`[${SERVICE_NAME}] Error processing string as date${context}:`, e, 'Raw value:', timestampField);
      return undefined; // Not a valid date string
    }
  }
  
  if (typeof timestampField === 'number') {
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


export async function getServices(): Promise<Service[]> {
  console.log(`[${SERVICE_NAME}] getServices: Attempting to fetch services.`);
  const q = query(servicesCollectionRef, orderBy('serviceDate', 'desc'));
  const snapshot = await getDocs(q);
  console.log(`[${SERVICE_NAME}] getServices: Fetched ${snapshot.docs.length} service documents from Firestore.`);
  
  return snapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    const docId = docSnapshot.id;
    const service: Service = {
      id: docSnapshot.id,
      serviceName: data.serviceName,
      customerId: data.customerId,
      customerName: data.customerName,
      description: data.description,
      serviceType: data.serviceType as ServiceType,
      status: data.status as ServiceStatus,
      cost: data.cost,
      serviceDate: convertTimestampToString(data.serviceDate, 'serviceDate', docId)!,
      completionDate: convertTimestampToString(data.completionDate, 'completionDate', docId),
      notes: data.notes,
      createdAt: convertTimestampToString(data.createdAt, 'createdAt', docId),
      updatedAt: convertTimestampToString(data.updatedAt, 'updatedAt', docId),
    };
    return service;
  });
}

export async function addService(serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'completionDate'>): Promise<Service> {
  const docRef = await addDoc(servicesCollectionRef, {
    ...serviceData,
    cost: serviceData.cost || 0, // Ensure cost is a number
    serviceDate: serviceData.serviceDate ? new Date(serviceData.serviceDate) : serverTimestamp(), // Store as Firestore Timestamp or Date
    completionDate: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const nowISO = new Date().toISOString();
  return { 
    ...serviceData, 
    id: docRef.id, 
    cost: serviceData.cost || 0,
    serviceDate: serviceData.serviceDate || nowISO, // Return ISO string
    createdAt: nowISO, 
    updatedAt: nowISO,
    completionDate: undefined,
  }; 
}

export async function updateService(id: string, serviceData: Partial<Omit<Service, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  const serviceDoc = doc(db, 'services', id);
  const updatePayload: any = { ...serviceData };

  if (serviceData.serviceDate) {
    updatePayload.serviceDate = new Date(serviceData.serviceDate);
  }
  if (serviceData.completionDate) {
    updatePayload.completionDate = new Date(serviceData.completionDate);
  } else if (serviceData.status === 'Completed' && !serviceData.completionDate) {
    updatePayload.completionDate = serverTimestamp(); // Set completion date if status is completed and not already set
  }
  
  await updateDoc(serviceDoc, {
    ...updatePayload,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteService(id: string): Promise<void> {
  const serviceDoc = doc(db, 'services', id);
  await deleteDoc(serviceDoc);
}
