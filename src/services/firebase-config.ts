import { FirebaseConfig } from '../types';

// تكوين Firebase - يُصدّر فقط، لا يُهيأ
export const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyByHh2_r9j1npQ-DQyaye9bbge4lEX5Go8',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'nazafati-system.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'nazafati-system',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'nazafati-system.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef123456',
};

// التحقق من وجود جميع المتغيرات المطلوبة
export const validateFirebaseConfig = (): boolean => {
  const requiredKeys: (keyof FirebaseConfig)[] = [
    'apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'
  ];
  
  return requiredKeys.every(key => {
    const value = firebaseConfig[key];
    return value && value !== 'undefined' && value !== '';
  });
};
