import { getApps, getApp, initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore';
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
    
    // تهيئة Firestore مع إعدادات التخزين المحلي
    try {
      // استخدام initializeFirestore مع إعدادات مخصصة
      db = initializeFirestore(app, {
        cacheSizeBytes: 50 * 1024 * 1024, // 50 MB
        ignoreUndefinedProperties: true
      });
      console.log('تم تهيئة Firestore مع دعم التبويبات المتعددة');
    } catch (error: any) {
      console.warn('فشل في تهيئة Firestore مع الإعدادات المخصصة، استخدام الإعدادات الافتراضية:', error);
      db = getFirestore(app);
    }
    
    // التحقق من صحة التكوين
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined') {
      throw new Error('مفتاح API الخاص بـ Firebase غير صحيح');
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
