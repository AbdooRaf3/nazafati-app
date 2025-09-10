import React, { useState, useEffect } from 'react';
import { useSupervisor } from '../contexts/SupervisorContext';
import { useFirestoreCRUD } from '../hooks/useFirestoreCRUD';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Toast } from '../components/ui/Toast';

interface MonthlyEntry {
  id: string;
  employeeId: string;
  monthKey: string;
  daysInMonth: number;
  holidays: number;
  fridaysAndHolidays: number;
  overtimeAfterReference: number;
  regionId: string;
  totals: {
    totalOvertime: number;
    totalSalary: number;
    netSalary: number;
  };
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupervisorDashboardSimple: React.FC = () => {
  const { supervisor, permissions, assignedRegions, canAccess, isLoading, error } = useSupervisor();
  const { getCollection } = useFirestoreCRUD('monthly-entries');
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [monthlyEntries, setMonthlyEntries] = useState<MonthlyEntry[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [entryData, setEntryData] = useState({
    daysInMonth: 30,
    holidays: 0,
    fridaysAndHolidays: 0,
    overtimeAfterReference: 0
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // جلب الموظفين للمناطق المسؤول عنها
  const fetchEmployees = async () => {
    if (!assignedRegions.length) {
      console.log('لا توجد مناطق مسؤول عنها');
      setEmployees([]);
      return;
    }
    
    setEmployeesLoading(true);
    try {
      const { getFirestore, collection, query, where, getDocs, or } = await import('firebase/firestore');
      const db = getFirestore();
      
      let employeesQuery;
      
      if (assignedRegions.length === 1) {
        employeesQuery = query(
          collection(db, 'employees'),
          where('regionId', '==', assignedRegions[0])
        );
      } else {
        const regionQueries = assignedRegions.map(regionId => 
          where('regionId', '==', regionId)
        );
        
        employeesQuery = query(
          collection(db, 'employees'),
          or(...regionQueries)
        );
      }
      
      const snapshot = await getDocs(employeesQuery);
      const employeesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setEmployees(employeesData);
      console.log(`تم جلب ${employeesData.length} موظف للمناطق: ${assignedRegions.join(', ')}`);
      console.log('الموظفين:', employeesData.map(emp => `${emp.name || 'غير محدد'} (${emp.regionId || 'غير محدد'})`));
    } catch (error) {
      console.error('خطأ في جلب الموظفين:', error);
      setToast({ message: 'خطأ في جلب الموظفين', type: 'error' });
    } finally {
      setEmployeesLoading(false);
    }
  };

  // جلب الإدخالات الشهرية للمناطق المسؤول عنها
  const fetchMonthlyEntries = async () => {
    if (!assignedRegions.length) return;
    
    setLoading(true);
    try {
      const entries = await getCollection() as MonthlyEntry[];
      const filteredEntries = entries.filter((entry: MonthlyEntry) => 
        assignedRegions.includes(entry.regionId) && 
        entry.monthKey === selectedMonth
      );
      setMonthlyEntries(filteredEntries);
    } catch (error) {
      console.error('خطأ في جلب الإدخالات الشهرية:', error);
      setToast({ message: 'خطأ في جلب الإدخالات الشهرية', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [assignedRegions]);

  useEffect(() => {
    fetchMonthlyEntries();
  }, [selectedMonth, assignedRegions]);

  const handleOpenEntryModal = (employee: any) => {
    setSelectedEmployee(employee);
    setEntryData({
      daysInMonth: 30,
      holidays: 0,
      fridaysAndHolidays: 0,
      overtimeAfterReference: 0
    });
    setShowEntryModal(true);
  };

  const handleSaveEntry = async () => {
    if (!selectedEmployee) return;
    
    try {
      setLoading(true);
      const { getFirestore, collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const db = getFirestore();
      
      const { calculateSalaryWithNewFormulas } = await import('../utils/calcSalary');
      const calculations = calculateSalaryWithNewFormulas(
        selectedEmployee.baseSalary || 0,
        entryData.daysInMonth,
        entryData.holidays,
        entryData.fridaysAndHolidays,
        entryData.overtimeAfterReference
      );
      
      const entryDataToSave = {
        employeeId: selectedEmployee.id,
        monthKey: selectedMonth,
        daysInMonth: entryData.daysInMonth,
        holidays: entryData.holidays,
        fridaysAndHolidays: entryData.fridaysAndHolidays,
        overtimeAfterReference: entryData.overtimeAfterReference,
        regionId: selectedEmployee.regionId,
        totals: {
          totalOvertime: calculations.totalOvertime,
          totalSalary: calculations.totalSalary,
          netSalary: calculations.netSalary
        },
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'monthly-entries'), entryDataToSave);
      
      setToast({ message: 'تم حفظ البيانات بنجاح', type: 'success' });
      setShowEntryModal(false);
      fetchMonthlyEntries();
    } catch (error) {
      console.error('خطأ في حفظ البيانات:', error);
      setToast({ message: 'خطأ في حفظ البيانات', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || employeesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isLoading ? 'جاري تحميل بيانات المراقب...' : 'جاري تحميل الموظفين...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">خطأ في التحميل</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!supervisor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">لا توجد بيانات مراقب</h1>
          <p className="text-gray-500">يرجى التواصل مع الإدارة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">لوحة المراقب</h1>
        <p className="text-gray-600">مرحباً {supervisor.name}</p>
      </div>

      {/* معلومات التشخيص */}
      <Card className="mb-4 bg-blue-50">
        <div className="px-6 py-4">
          <h3 className="text-lg font-medium text-blue-900">معلومات التشخيص</h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>المناطق المسؤول عنها: {assignedRegions.join(', ') || 'لا توجد'}</p>
            <p>عدد الموظفين المحملين: {employees.length}</p>
            <p>حالة التحميل: {employeesLoading ? 'جاري التحميل...' : 'مكتمل'}</p>
          </div>
        </div>
      </Card>

      {/* قائمة الموظفين */}
      {canAccess('canViewEmployees') && (
        <Card className="mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">الموظفين في منطقتك</h3>
            <p className="mt-1 text-sm text-gray-500">
              يمكنك إدخال بيانات العمل الإضافي لكل موظف
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الوظيفة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اسم الموظف</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الراتب الأساسي</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المنطقة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.jobNumber || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.baseSalary ? employee.baseSalary.toLocaleString() : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.regionId || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        onClick={() => handleOpenEntryModal(employee)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm"
                      >
                        إدخال البيانات
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* نافذة إدخال البيانات */}
      <Modal isOpen={showEntryModal} onClose={() => setShowEntryModal(false)}>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            إدخال بيانات العمل الإضافي - {selectedEmployee?.name}
          </h3>
          
          <div className="space-y-4">
            <Input
              label="أيام الشهر"
              type="number"
              value={entryData.daysInMonth}
              onChange={(e) => setEntryData({...entryData, daysInMonth: parseInt(e.target.value) || 0})}
            />
            <Input
              label="العطل"
              type="number"
              value={entryData.holidays}
              onChange={(e) => setEntryData({...entryData, holidays: parseInt(e.target.value) || 0})}
            />
            <Input
              label="الجمع والعطل"
              type="number"
              value={entryData.fridaysAndHolidays}
              onChange={(e) => setEntryData({...entryData, fridaysAndHolidays: parseInt(e.target.value) || 0})}
            />
            <Input
              label="الإضافي بعد المرجع"
              type="number"
              value={entryData.overtimeAfterReference}
              onChange={(e) => setEntryData({...entryData, overtimeAfterReference: parseInt(e.target.value) || 0})}
            />
          </div>
          
          <div className="mt-6 flex justify-end space-x-3 space-x-reverse">
            <Button
              variant="secondary"
              onClick={() => setShowEntryModal(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveEntry}
              disabled={loading}
            >
              {loading ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* رسائل التنبيه */}
      {toast && (
        <Toast
          id="toast"
          title="تنبيه"
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default SupervisorDashboardSimple;
