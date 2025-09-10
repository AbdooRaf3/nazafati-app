import React, { useState, useEffect, useCallback } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { useFirestoreCRUD } from '../hooks/useFirestoreCRUD';
import { useAuth } from '../hooks/useAuth';
import { useEmployees } from '../hooks/useEmployees';
import { useRegionAccess } from '../hooks/useRegionAccess';
import { Employee, MonthlyEntry, SalaryRules } from '../types';
import { Button } from '../components/ui/Button';
import { calculateTotalSalary, calculateSalaryWithNewFormulas } from '../utils/calcSalary';
import { formatCurrency } from '../constants/currency';
// import { formatArabicDate as formatDate } from '../utils/formatDate';

const SETTINGS_DOC_ID = 'salaryRules';

export const MonthlyEntries: React.FC = () => {
  const { db } = useFirebase();
  const { user } = useAuth();
  const { employees, loading: loadingEmployees, canViewAllRegions, userRegionId } = useEmployees();
  const { 
    queryCollection,
    addDocument,
    updateDocument,
    loading: loadingEntries 
  } = useFirestoreCRUD<MonthlyEntry>('monthly-entries');
  const { getDocument: getSettings } = useFirestoreCRUD<SalaryRules>('salaryRules');

  const [monthlyEntries, setMonthlyEntries] = useState<Record<string, MonthlyEntry>>({});
  const [salaryRules, setSalaryRules] = useState<SalaryRules | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
  });

  const fetchInitialData = useCallback(async () => {
    try {
      const rulesData = await getSettings(SETTINGS_DOC_ID);
      setSalaryRules(rulesData);
    } catch (err) {
      console.error(err);
    }
  }, [getSettings]);

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    try {
      const queryConditions = [
        { field: 'monthKey', operator: '==', value: currentMonth }
      ];

      // إضافة فلترة المنطقة للمراقبين
      if (user.role === 'supervisor' && user.regionId) {
        queryConditions.push({ field: 'regionId', operator: '==', value: user.regionId });
      }

      const entriesData = await queryCollection(queryConditions);
      
      const entriesMap = entriesData.reduce((acc: Record<string, MonthlyEntry>, entry: MonthlyEntry) => {
        acc[entry.employeeId] = entry;
        return acc;
      }, {} as Record<string, MonthlyEntry>);
      
      setMonthlyEntries(entriesMap);

    } catch (err) {
      console.error(err);
    }
  }, [queryCollection, currentMonth, user]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleInputChange = (
    employeeId: string, 
    field: keyof Omit<MonthlyEntry, 'id' | 'totals'>, 
    value: any
  ) => {
    setMonthlyEntries(prev => {
        const existingEntry = prev[employeeId] || { 
            employeeId,
            monthKey: currentMonth,
            daysWorked: 0, 
            overtimeDays: 0,
            weekendDays: 0,
            // الحقول الجديدة
            holidays: 0,
            fridaysAndHolidays: 0,
            overtimeAfterReference: 0,
            daysInMonth: 31,
            status: 'draft',
            submittedBy: user!.uid,
            regionId: employees.find(e => e.id === employeeId)?.regionId || '',
        } as MonthlyEntry;

        const updatedEntry = { ...existingEntry, [field]: value };

        return { ...prev, [employeeId]: updatedEntry };
    });
  };

  const handleSaveEntry = async (employeeId: string) => {
    const entry = monthlyEntries[employeeId];
    const employee = employees.find(e => e.id === employeeId);

    if (!entry || !employee) {
        alert('بيانات غير كاملة لحفظ الإدخال');
        return;
    }

    try {
        // استخدام المعادلات الجديدة
        const salaryCalculations = calculateSalaryWithNewFormulas(
            employee.baseSalary,
            Number(entry.daysInMonth || 31),
            Number(entry.holidays || 0),
            Number(entry.fridaysAndHolidays || 0),
            Number(entry.overtimeAfterReference || 0)
        );

        const totals = {
            dailyWage: employee.baseSalary / (entry.daysInMonth || 31),
            total: salaryCalculations.netSalary,
            totalOvertime: salaryCalculations.totalOvertime,
            totalSalary: salaryCalculations.totalSalary,
            netSalary: salaryCalculations.netSalary
        };

        const dataToSave = {
            ...entry,
            daysWorked: Number(entry.daysWorked || 0),
            overtimeDays: Number(entry.overtimeDays || 0),
            weekendDays: Number(entry.weekendDays || 0),
            holidays: Number(entry.holidays || 0),
            fridaysAndHolidays: Number(entry.fridaysAndHolidays || 0),
            overtimeAfterReference: Number(entry.overtimeAfterReference || 0),
            daysInMonth: Number(entry.daysInMonth || 31),
            totals
        };

      if (entry.id) {
        await updateDocument(entry.id, dataToSave);
      } else {
        const newId = await addDocument(dataToSave);
        setMonthlyEntries(prev => ({
            ...prev,
            [employeeId]: { ...prev[employeeId], id: newId, totals }
        }));
      }
      alert('تم حفظ الإدخال بنجاح');
    } catch (err) {
      console.error(err);
      alert('فشل حفظ الإدخال');
    }
  };

  const loading = loadingEmployees || loadingEntries;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الإدخالات الشهرية</h1>
          {!canViewAllRegions && userRegionId && (
            <p className="text-sm text-gray-600 mt-1">
              عرض إدخالات منطقتك فقط (المنطقة: {userRegionId})
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="month-select" className="text-sm font-medium text-gray-700">الشهر:</label>
          <input
            id="month-select"
            type="month"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اسم الموظف</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">أيام الشهر</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العطل</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الجمع والعطل</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإضافي بعد المرجع</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجمالي الإضافي</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجمالي الراتب</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">صافي الراتب</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map(employee => {
                const entry = monthlyEntries[employee.id!];
                return (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.name}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input 
                        type="number"
                        value={entry?.daysInMonth || ''}
                        onChange={(e) => handleInputChange(employee.id!, 'daysInMonth', e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        disabled={entry?.status === 'submitted' || entry?.status === 'approved'}
                        min="28"
                        max="31"
                        placeholder="31"
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input 
                        type="number"
                        value={entry?.holidays || ''}
                        onChange={(e) => handleInputChange(employee.id!, 'holidays', e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        disabled={entry?.status === 'submitted' || entry?.status === 'approved'}
                        min="0"
                        max="31"
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input 
                        type="number"
                        value={entry?.fridaysAndHolidays || ''}
                        onChange={(e) => handleInputChange(employee.id!, 'fridaysAndHolidays', e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        disabled={entry?.status === 'submitted' || entry?.status === 'approved'}
                        min="0"
                        max="31"
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input 
                        type="number"
                        value={entry?.overtimeAfterReference || ''}
                        onChange={(e) => handleInputChange(employee.id!, 'overtimeAfterReference', e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        disabled={entry?.status === 'submitted' || entry?.status === 'approved'}
                        min="0"
                        max="31"
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {entry?.totals?.totalOvertime ? formatCurrency(entry.totals.totalOvertime) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {entry?.totals?.totalSalary ? formatCurrency(entry.totals.totalSalary) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {entry?.totals?.netSalary ? formatCurrency(entry.totals.netSalary) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${entry?.status === 'approved' ? 'bg-blue-100 text-blue-800' : 
                          entry?.status === 'submitted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {entry?.status === 'approved' ? 'معتمد' : 
                         entry?.status === 'submitted' ? 'مقدم' : 'مسودة'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <Button 
                          onClick={() => handleSaveEntry(employee.id!)} 
                          size="sm" 
                          disabled={loadingEntries || entry?.status === 'submitted' || entry?.status === 'approved'}
                      >
                        {loadingEntries ? 'جاري الحفظ...' : 'حفظ'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
