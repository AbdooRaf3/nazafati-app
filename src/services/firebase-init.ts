
import { getApps, getApp, initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, initializeFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config';

export const initializeFirebase = async (): Promise<{ app: FirebaseApp; auth: Auth; db: Firestore }> => {
  let app: FirebaseApp;
  let auth: Auth;
  let db: Firestore;

  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    
    try {
      db = initializeFirestore(app, {
        cacheSizeBytes: 50 * 1024 * 1024,
        ignoreUndefinedProperties: true
      });
    } catch (error) {
      console.warn('Failed to initialize Firestore with custom settings, using default settings:', error);
      db = getFirestore(app);
    }
    
    if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
      try {
        connectAuthEmulator(auth, 'http://localhost:9099');
        connectFirestoreEmulator(db, 'localhost', 8080);
      } catch (error) {
        console.warn('Failed to connect to the emulator:', error);
      }
    }

    return { app, auth, db };
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
};
