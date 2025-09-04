import { getApps, getApp, initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config';

let app: any;
let auth: any;
let db: any;

export const initializeFirebase = async (): Promise<{
  app: any;
  auth: any;
  db: any;
}> => {
  try {
    // تهيئة التطبيق إذا لم يكن مُهيأ
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

    // تهيئة المصادقة
    auth = getAuth(app);
    
    // تهيئة Firestore
    db = getFirestore(app);
    
    // تمكين التخزين المحلي
    try {
      await enableIndexedDbPersistence(db);
    } catch (error: any) {
      if (error.code === 'failed-precondition') {
        console.warn('فشل في تمكين التخزين المحلي - قد يكون هناك تبويب آخر مفتوح');
      } else if (error.code === 'unimplemented') {
        console.warn('المتصفح لا يدعم التخزين المحلي');
      }
    }

    // استخدام المحاكي في بيئة التطوير
    if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
      try {
        connectAuthEmulator(auth, 'http://localhost:9099');
        connectFirestoreEmulator(db, 'localhost', 8080);
      } catch (error) {
        console.warn('فشل في الاتصال بالمحاكي:', error);
      }
    }

    return { app, auth, db };
  } catch (error) {
    console.error('خطأ في تهيئة Firebase:', error);
    throw error;
  }
};

export const getFirebaseApp = () => app;
export const getFirebaseAuth = () => auth;
export const getFirebaseDb = () => db;
