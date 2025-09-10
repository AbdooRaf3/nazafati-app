// سياق المراقبين مع الصلاحيات المحددة
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useAuth } from './AuthContext';

interface SupervisorPermissions {
  canViewEmployees: boolean;
  canEditEmployees: boolean;
  canViewMonthlyEntries: boolean;
  canEditMonthlyEntries: boolean;
  canViewPayroll: boolean;
  canEditPayroll: boolean;
  canViewSettings: boolean;
  canManageUsers: boolean;
}

interface SupervisorData {
  uid: string;
  name: string;
  email: string;
  role: string;
  regionIds: string[];
  regionNames: string[];
  permissions: SupervisorPermissions;
  assignedRegions: string[];
  employeeLimit?: number;
  isActive: boolean;
  lastLogin?: Date;
}

interface SupervisorContextType {
  supervisor: SupervisorData | null;
  permissions: SupervisorPermissions | null;
  assignedRegions: string[];
  canAccess: (permission: keyof SupervisorPermissions) => boolean;
  canAccessRegion: (regionId: string) => boolean;
  isLoading: boolean;
  error: string | null;
}

const SupervisorContext = createContext<SupervisorContextType | undefined>(undefined);

export const useSupervisor = () => {
  const context = useContext(SupervisorContext);
  if (context === undefined) {
    throw new Error('useSupervisor must be used within a SupervisorProvider');
  }
  return context;
};

interface SupervisorProviderProps {
  children: React.ReactNode;
}

export const SupervisorProvider: React.FC<SupervisorProviderProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [supervisor, setSupervisor] = useState<SupervisorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // دالة للتحقق من الصلاحيات
  const canAccess = (permission: keyof SupervisorPermissions): boolean => {
    if (!supervisor || !supervisor.permissions) return false;
    return supervisor.permissions[permission] === true;
  };

  // دالة للتحقق من الوصول للمنطقة
  const canAccessRegion = (regionId: string): boolean => {
    if (!supervisor || !supervisor.regionIds) return false;
    return supervisor.regionIds.includes(regionId);
  };

  // دالة لجلب بيانات المراقب
  const fetchSupervisorData = async (user: User) => {
    try {
      setIsLoading(true);
      setError(null);

      // جلب بيانات المراقب من Firestore
      const { getFirestore, doc, getDoc } = await import('firebase/firestore');
      const db = getFirestore();
      
      const supervisorDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (supervisorDoc.exists()) {
        const supervisorData = supervisorDoc.data() as SupervisorData;
        
        // التحقق من أن المستخدم مراقب
        if (supervisorData.role === 'supervisor') {
          setSupervisor(supervisorData);
        } else {
          setError('المستخدم ليس مراقباً');
        }
      } else {
        setError('بيانات المراقب غير موجودة');
      }
    } catch (err) {
      console.error('خطأ في جلب بيانات المراقب:', err);
      setError('خطأ في جلب بيانات المراقب');
    } finally {
      setIsLoading(false);
    }
  };

  // تحديث بيانات المراقب عند تغيير المستخدم
  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    if (user) {
      fetchSupervisorData(user);
    } else {
      setSupervisor(null);
      setIsLoading(false);
    }
  }, [user, authLoading]);

  const value: SupervisorContextType = {
    supervisor,
    permissions: supervisor?.permissions || null,
    assignedRegions: supervisor?.regionIds || [],
    canAccess,
    canAccessRegion,
    isLoading: isLoading || authLoading,
    error
  };

  return (
    <SupervisorContext.Provider value={value}>
      {children}
    </SupervisorContext.Provider>
  );
};

// مكون للتحقق من الصلاحيات
interface PermissionGuardProps {
  permission: keyof SupervisorPermissions;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  permission, 
  children, 
  fallback = null 
}) => {
  const { canAccess } = useSupervisor();
  
  if (!canAccess(permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

// مكون للتحقق من الوصول للمنطقة
interface RegionGuardProps {
  regionId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RegionGuard: React.FC<RegionGuardProps> = ({ 
  regionId, 
  children, 
  fallback = null 
}) => {
  const { canAccessRegion } = useSupervisor();
  
  if (!canAccessRegion(regionId)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};
