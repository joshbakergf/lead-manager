import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

// Firebase configuration for interactive-call-script project
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAA2d549XgCJDF5QVpsqHXwQBG9iTHEbtk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "interactive-call-script.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "interactive-call-script",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "interactive-call-script.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "388701133207",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:388701133207:web:e14a4d5faa41f3efb50cd2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  hd: 'go-forth.com', // Restrict to go-forth.com domain
  prompt: 'select_account'
});

// Connect to Firestore emulator in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectFirestoreEmulator(db, 'localhost', 8080);
}

// Helper to convert Google credential to Firebase
export const signInWithGoogleCredential = async (googleCredential: string) => {
  const credential = GoogleAuthProvider.credential(googleCredential);
  return signInWithCredential(auth, credential);
};

export default app;