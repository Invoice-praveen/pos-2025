
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

// Ensure you have these environment variables set in your .env.local file
// Example:
// NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
// NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "posapplication-461003.firebaseapp.com", // Derived from your project_id
  projectId: "posapplication-461003", // From your provided JSON
  storageBucket: "posapplication-461003.appspot.com", // Standard format derived from your project_id
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
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
