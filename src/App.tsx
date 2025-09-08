
import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { initializeFirebase } from './services/firebase-init';
import { FirebaseProvider } from './contexts/FirebaseContext';
import { useAuth } from './hooks/useAuth';
const Login = React.lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Employees = React.lazy(() => import('./pages/Employees').then(m => ({ default: m.Employees })));
const MonthlyEntries = React.lazy(() => import('./pages/MonthlyEntries').then(m => ({ default: m.MonthlyEntries })));
const Payroll = React.lazy(() => import('./pages/Payroll').then(m => ({ default: m.Payroll })));
const Settings = React.lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
import { ToastContainer, ToastProps } from './components/ui/Toast';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const [firebase, setFirebase] = useState<{ app: FirebaseApp; auth: Auth; db: Firestore } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const firebaseServices = await initializeFirebase();
        setFirebase(firebaseServices);
      } catch (err: any) {
        setError('Failed to initialize Firebase');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id, onClose: removeToast }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    if (error) {
      addToast({
        type: 'error',
        title: 'Initialization Error',
        message: error,
        duration: 10000
      });
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing System...</p>
        </div>
      </div>
    );
  }

  if (!firebase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">System Initialization Failed</h2>
          <p className="text-gray-600 mb-4">
            An error occurred while initializing Firebase. Please check the project settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <FirebaseProvider value={firebase}>
      <Suspense fallback={(
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
          <Route path="/monthly-entries" element={<ProtectedRoute><MonthlyEntries /></ProtectedRoute>} />
          <Route path="/payroll" element={<ProtectedRoute><Payroll /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </FirebaseProvider>
  );
}

export default App;
