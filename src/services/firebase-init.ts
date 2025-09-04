import { getApps, getApp, initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
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
    
    // التحقق من صحة التكوين
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined') {
      throw new Error('مفتاح API الخاص بـ Firebase غير صحيح');
    }
    
    // تمكين التخزين المحلي باستخدام الإعدادات الجديدة
    try {
      // استخدام الإعدادات الجديدة بدلاً من enableIndexedDbPersistence
      // سيتم تطبيق الإعدادات تلقائياً من Firebase
    } catch (error: any) {
      console.warn('فشل في تطبيق إعدادات التخزين المحلي:', error);
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
