import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { ROLES } from '../constants/roles';

export const useRegionAccess = () => {
  const { user } = useAuth();

  const canAccessRegion = useCallback((regionId: string): boolean => {
    if (!user) return false;
    
    // المدير يمكنه الوصول لجميع المناطق
    if (user.role === ROLES.ADMIN) return true;
    
    // المراقب يمكنه الوصول لمنطقته فقط
    if (user.role === ROLES.SUPERVISOR && user.regionId === regionId) return true;
    
    return false;
  }, [user]);

  const canModifyRegion = useCallback((regionId: string): boolean => {
    if (!user) return false;
    
    // المدير يمكنه تعديل جميع المناطق
    if (user.role === ROLES.ADMIN) return true;
    
    // المراقب يمكنه تعديل منطقته فقط
    if (user.role === ROLES.SUPERVISOR && user.regionId === regionId) return true;
    
    return false;
  }, [user]);

  const canViewAllRegions = useCallback((): boolean => {
    if (!user) return false;
    
    // المدير وقسم الرواتب يمكنهما رؤية جميع المناطق
    return user.role === ROLES.ADMIN || user.role === ROLES.FINANCE;
  }, [user]);

  const canManageEmployees = useCallback((): boolean => {
    if (!user) return false;
    
    // المدير فقط يمكنه إدارة الموظفين
    return user.role === ROLES.ADMIN;
  }, [user]);

  const canApproveEntries = useCallback((): boolean => {
    if (!user) return false;
    
    // المدير فقط يمكنه الموافقة على الإدخالات
    return user.role === ROLES.ADMIN;
  }, [user]);

  const canGeneratePayroll = useCallback((): boolean => {
    if (!user) return false;
    
    // المدير وقسم الرواتب يمكنهما توليد كشوف الرواتب
    return user.role === ROLES.ADMIN || user.role === ROLES.FINANCE;
  }, [user]);

  return {
    canAccessRegion,
    canModifyRegion,
    canViewAllRegions,
    canManageEmployees,
    canApproveEntries,
    canGeneratePayroll,
    userRole: user?.role
  };
};
