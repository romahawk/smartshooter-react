import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(cfg);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const signInAnon = () => signInAnonymously(auth);
export const signOutUser = () => signOut(auth);
export const authReady = () => new Promise((r) => onAuthStateChanged(auth, () => r(true)));
