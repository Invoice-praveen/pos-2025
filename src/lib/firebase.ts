
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore, Timestamp } from "firebase/firestore"; // Imported Timestamp as a value
import { getAuth, type Auth } from "firebase/auth";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

const missingVars: string[] = [];
if (!apiKey) missingVars.push("NEXT_PUBLIC_FIREBASE_API_KEY");
if (!authDomain) missingVars.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
if (!projectId) missingVars.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
if (!storageBucket) missingVars.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
if (!messagingSenderId) missingVars.push("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
if (!appId) missingVars.push("NEXT_PUBLIC_FIREBASE_APP_ID");


if (missingVars.length > 0) {
  const warningMessage =
    `WARNING: Firebase is using placeholder credentials for some/all config values because ` +
    `the following environment variables were not found: ${missingVars.join(', ')}. ` +
    "Please set these in your .env.local file and RESTART your development server " +
    "for Firebase to work correctly. App will attempt to initialize with placeholders which will likely fail.";
  console.warn(warningMessage);
}

const firebaseConfig = {
  apiKey: apiKey || "PLACEHOLDER_API_KEY",
  authDomain: authDomain || "PLACEHOLDER_AUTH_DOMAIN",
  projectId: projectId || "PLACEHOLDER_PROJECT_ID",
  storageBucket: storageBucket || "PLACEHOLDER_STORAGE_BUCKET",
  messagingSenderId: messagingSenderId || "PLACEHOLDER_MESSAGING_SENDER_ID",
  appId: appId || "PLACEHOLDER_APP_ID",
};


let app: FirebaseApp;
let db: Firestore;
let authInstance: Auth; // Renamed to avoid conflict with Auth type import

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

db = getFirestore(app);
authInstance = getAuth(app); // Use renamed variable

export { app, db, authInstance as auth, Timestamp }; // Export Timestamp if needed elsewhere, or remove if not
