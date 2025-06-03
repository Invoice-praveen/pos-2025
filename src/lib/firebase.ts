
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

// Explicitly check for environment variables
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

if (!apiKey || !messagingSenderId || !appId) {
  const missingVars = [];
  if (!apiKey) missingVars.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!messagingSenderId) missingVars.push("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  if (!appId) missingVars.push("NEXT_PUBLIC_FIREBASE_APP_ID");
  
  throw new Error(
    `Firebase configuration error: The following environment variables are missing or not configured: ${missingVars.join(', ')}. ` +
    "Please ensure they are set in your .env.local file and that you have RESTARTED your development server."
  );
}

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: "posapplication-461003.firebaseapp.com", // Derived from your project_id
  projectId: "posapplication-461003", // From your provided JSON
  storageBucket: "posapplication-461003.appspot.com", // Standard format derived from your project_id
  messagingSenderId: messagingSenderId,
  appId: appId,
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

db = getFirestore(app);
auth = getAuth(app);

export { app, db, auth };
