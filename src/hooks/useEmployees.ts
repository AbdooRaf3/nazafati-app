import { useState, useEffect, useCallback } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { useAuth } from './useAuth';
import { useRegionAccess } from './useRegionAccess';
import { FirestoreService } from '../services/firestoreService';
import { Employee } from '../types';
import { useErrorHandler } from './useErrorHandler';

export const useEmployees = () => {
  const { db } = useFirebase();
  const { user } = useAuth();
  const { canViewAllRegions } = useRegionAccess();
  const { executeWithErrorHandling } = useErrorHandler();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    if (!db || !user) return;

    setLoading(true);
    setError(null);

    try {
      // تحديد المنطقة حسب صلاحيات المستخدم
      let regionId: string | undefined;
      
      if (user.role === 'supervisor') {
        // المراقب يمكنه رؤية موظفي منطقته فقط
        regionId = user.regionId;
      } else if (user.role === 'admin' || user.role === 'finance') {
        // المدير وقسم الرواتب يمكنهما رؤية جميع الموظفين
        regionId = undefined;
      }

      const employeesData = await FirestoreService.getAllEmployees(db, regionId);
      setEmployees(employeesData);
    } catch (err) {
      setError('فشل في جلب بيانات الموظفين');
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  }, [db, user, executeWithErrorHandling]);

  const addEmployee = useCallback(async (employeeData: Omit<Employee, 'id'>) => {
    if (!db || !user) throw new Error('غير مسموح');

    // التحقق من الصلاحيات
    if (user.role === 'supervisor' && employeeData.regionId !== user.regionId) {
      throw new Error('لا يمكنك إضافة موظف في منطقة أخرى');
    }

    // إضافة الموظف (سيتم التعامل معه في useFirestoreCRUD)
    return employeeData;
  }, [db, user]);

  const updateEmployee = useCallback(async (id: string, employeeData: Partial<Employee>) => {
    if (!db || !user) throw new Error('غير مسموح');

    // التحقق من الصلاحيات
    if (user.role === 'supervisor') {
      const employee = employees.find(emp => emp.id === id);
      if (!employee || employee.regionId !== user.regionId) {
        throw new Error('لا يمكنك تعديل موظف في منطقة أخرى');
      }
    }

    return employeeData;
  }, [db, user, employees]);

  const deleteEmployee = useCallback(async (id: string) => {
    if (!db || !user) throw new Error('غير مسموح');

    // التحقق من الصلاحيات
    if (user.role === 'supervisor') {
      const employee = employees.find(emp => emp.id === id);
      if (!employee || employee.regionId !== user.regionId) {
        throw new Error('لا يمكنك حذف موظف في منطقة أخرى');
      }
    }

    return id;
  }, [db, user, employees]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    canViewAllRegions: canViewAllRegions(),
    userRegionId: user?.regionId
  };
};

export default useEmployees;
