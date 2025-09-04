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
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await initializeFirebase();
      setIsInitialized(true);
    } catch (err: any) {
      console.error('فشل في تهيئة Firebase:', err);
      setError(err.message || 'فشل في تهيئة Firebase');
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
