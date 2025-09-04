import { useState, useEffect, useCallback } from 'react';
import { initializeFirebase } from '../services/firebase-init';

interface FirebaseInitState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export const useFirebaseInit = (): FirebaseInitState => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // تأخير قصير لتجنب مشاكل التهيئة
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await initializeFirebase();
      setIsInitialized(true);
    } catch (err: any) {
      console.error('فشل في تهيئة Firebase:', err);
      let errorMessage = 'فشل في تهيئة Firebase';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.code) {
        switch (err.code) {
          case 'auth/invalid-api-key':
            errorMessage = 'مفتاح API الخاص بـ Firebase غير صحيح';
            break;
          case 'auth/invalid-domain':
            errorMessage = 'نطاق Firebase غير صحيح';
            break;
          default:
            errorMessage = `خطأ في Firebase: ${err.code}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    isInitialized,
    isLoading,
    error,
    retry
  };
};
