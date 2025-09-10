
import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { initializeFirebase } from './services/firebase-init';
import { FirebaseProvider } from './contexts/FirebaseContext';
import { SupervisorProvider } from './contexts/SupervisorContext';
import { useAuth } from './hooks/useAuth';
import { ErrorBoundary } from './components/ErrorBoundary';
import UserTypeRouter from './components/UserTypeRouter';
const Login = React.lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const SupervisorDashboard = React.lazy(() => import('./pages/SupervisorDashboardSimple').then(m => ({ default: m.default })));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
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
    <ErrorBoundary>
      <FirebaseProvider value={firebase}>
        <SupervisorProvider>
          <Suspense fallback={(
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          )}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/supervisor" element={<ProtectedRoute><SupervisorDashboard /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/" element={<UserTypeRouter><Navigate to="/dashboard" replace /></UserTypeRouter>} />
              <Route path="/dashboard" element={<UserTypeRouter><Dashboard /></UserTypeRouter>} />
              <Route path="/employees" element={<UserTypeRouter><Employees /></UserTypeRouter>} />
              <Route path="/monthly-entries" element={<UserTypeRouter><MonthlyEntries /></UserTypeRouter>} />
              <Route path="/payroll" element={<UserTypeRouter><Payroll /></UserTypeRouter>} />
              <Route path="/settings" element={<UserTypeRouter><Settings /></UserTypeRouter>} />
              <Route path="*" element={<UserTypeRouter><Navigate to="/dashboard" replace /></UserTypeRouter>} />
            </Routes>
          </Suspense>
          <ToastContainer toasts={toasts} onClose={removeToast} />
        </SupervisorProvider>
      </FirebaseProvider>
    </ErrorBoundary>
  );
}

export default App;
