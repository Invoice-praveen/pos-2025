
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

// --- IMPORTANT ---
// The configuration below attempts to use environment variables.
// If they are not found, it falls back to TEMPORARY PLACEHOLDERS.
// You MUST create a .env.local file in the root of your project
// and add your actual Firebase project credentials for the app to work.
//
// Example .env.local content:
// NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_actual_messaging_sender_id
// NEXT_PUBLIC_FIREBASE_APP_ID=your_actual_app_id
//
// If placeholders are used, Firebase initialization will likely fail with
// an "auth/invalid-api-key" or similar error.
// --- IMPORTANT ---

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY_PLACEHOLDER";
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID_PLACEHOLDER";
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID_PLACEHOLDER";

if (apiKey === "YOUR_API_KEY_PLACEHOLDER" || messagingSenderId === "YOUR_MESSAGING_SENDER_ID_PLACEHOLDER" || appId === "YOUR_APP_ID_PLACEHOLDER") {
  console.warn(
    "WARNING: Firebase is using placeholder credentials because environment variables " +
    "(NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, NEXT_PUBLIC_FIREBASE_APP_ID) " +
    "were not found. Please set these in your .env.local file and RESTART your development server " +
    "for Firebase to work correctly."
  );
}

// const firebaseConfig = {
//   apiKey: apiKey,
//   authDomain: "posapplication-461003.firebaseapp.com", // Derived from your project_id
//   projectId: "posapplication-461003", // From your provided JSON
//   storageBucket: "posapplication-461003.appspot.com", // Standard format derived from your project_id
//   messagingSenderId: messagingSenderId,
//   appId: appId,
// };

const firebaseConfig = {
  apiKey: "AIzaSyBPwKRkzy3DtQBQPAk0h8jSdDWsdwls_Ug",
  authDomain: "todoapp-12c66.firebaseapp.com",
  databaseURL: "https://todoapp-12c66.firebaseio.com",
  projectId: "todoapp-12c66",
  storageBucket: "todoapp-12c66.firebasestorage.app",
  messagingSenderId: "174300667087",
  appId: "1:174300667087:web:b6925a4793e94bd6506bba",
  measurementId: "G-6GHEGV9MZF"
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
