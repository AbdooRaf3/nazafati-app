// مكون لتوجيه المستخدم حسب نوعه
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSupervisor } from '../contexts/SupervisorContext';

interface UserTypeRouterProps {
  children: React.ReactNode;
}

const UserTypeRouter: React.FC<UserTypeRouterProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { supervisor, isLoading: supervisorLoading } = useSupervisor();
  const [userType, setUserType] = useState<'admin' | 'supervisor' | 'loading' | null>(null);

  useEffect(() => {
    if (authLoading || supervisorLoading) {
      setUserType('loading');
      return;
    }

    if (!user) {
      setUserType(null);
      return;
    }

    // التحقق من نوع المستخدم
    if (supervisor) {
      setUserType('supervisor');
    } else {
      // افتراض أن المستخدم مدير إذا لم يكن مراقباً
      setUserType('admin');
    }
  }, [user, supervisor, authLoading, supervisorLoading]);

  if (authLoading || supervisorLoading || userType === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحديد نوع المستخدم...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // توجيه المراقبين إلى لوحة المراقب
  if (userType === 'supervisor') {
    return <Navigate to="/supervisor" replace />;
  }

  // توجيه المديرين إلى لوحة الإدارة
  if (userType === 'admin') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-gray-600 text-6xl mb-4">❓</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">نوع المستخدم غير محدد</h2>
        <p className="text-gray-600">يرجى التواصل مع الإدارة</p>
      </div>
    </div>
  );
};

export default UserTypeRouter;
