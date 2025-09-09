import { useCallback, useState } from 'react';
import { errorHandler, ErrorContext } from '../utils/errorHandler';

export interface UseErrorHandlerReturn {
  error: string | null;
  isLoading: boolean;
  handleError: (error: any, context: string, additionalContext?: Partial<ErrorContext>) => void;
  handleFirebaseError: (error: any, context: string, additionalContext?: Partial<ErrorContext>) => string;
  handleFirestoreError: (error: any, context: string, additionalContext?: Partial<ErrorContext>) => string;
  handleAuthError: (error: any, context: string) => string;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  executeWithErrorHandling: <T>(
    operation: () => Promise<T>,
    context: string,
    additionalContext?: Partial<ErrorContext>
  ) => Promise<T | null>;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = useCallback((error: any, context: string, additionalContext?: Partial<ErrorContext>) => {
    errorHandler.handleError(error, context, additionalContext);
    setError(errorHandler.extractErrorMessage(error));
  }, []);

  const handleFirebaseError = useCallback((error: any, context: string, additionalContext?: Partial<ErrorContext>): string => {
    const userMessage = errorHandler.handleAuthError(error, context);
    setError(userMessage);
    return userMessage;
  }, []);

  const handleFirestoreError = useCallback((error: any, context: string, additionalContext?: Partial<ErrorContext>): string => {
    const userMessage = errorHandler.handleFirestoreError(error, context);
    setError(userMessage);
    return userMessage;
  }, []);

  const handleAuthError = useCallback((error: any, context: string): string => {
    const userMessage = errorHandler.handleAuthError(error, context);
    setError(userMessage);
    return userMessage;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    context: string,
    additionalContext?: Partial<ErrorContext>
  ): Promise<T | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await operation();
      return result;
    } catch (error) {
      handleError(error, context, additionalContext);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  return {
    error,
    isLoading,
    handleError,
    handleFirebaseError,
    handleFirestoreError,
    handleAuthError,
    clearError,
    setLoading,
    executeWithErrorHandling
  };
};

export default useErrorHandler;
