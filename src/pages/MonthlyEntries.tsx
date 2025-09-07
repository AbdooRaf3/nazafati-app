import React, { useState, useEffect, useCallback } from 'react';
import { useFirestoreCRUD } from '../hooks/useFirestoreCRUD';
import { useAuth } from '../hooks/useAuth';
import { Employee, MonthlyEntry, SalaryRules } from '../types';
import { Button } from '../components/ui/Button';
import { calculateTotalSalary } from '../utils/calcSalary';
import { formatArabicDate as formatDate } from '../utils/formatDate';

const SETTINGS_DOC_ID = 'salaryRules';

export const MonthlyEntries: React.FC = () => {
  const { user } = useAuth();
  const { getCollection: getEmployees, loading: loadingEmployees } = useFirestoreCRUD<Employee>('employees');
  const { 
    queryCollection,
    addDocument,
    updateDocument,
    loading: loadingEntries 
  } = useFirestoreCRUD<MonthlyEntry>('monthly-entries');
  const { getDocument: getSettings } = useFirestoreCRUD<SalaryRules>('settings');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [monthlyEntries, setMonthlyEntries] = useState<Record<string, MonthlyEntry>>({});
  const [salaryRules, setSalaryRules] = useState<SalaryRules | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
  });

  const fetchInitialData = useCallback(async () => {
    try {
      const [employeesData, rulesData] = await Promise.all([
        getEmployees(),
        getSettings(SETTINGS_DOC_ID),
      ]);

      setEmployees(employeesData.filter(e => e.status === 'active'));
      setSalaryRules(rulesData);

    } catch (err) {
      console.error(err);
    }
  }, [getEmployees, getSettings]);

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    try {
      const entriesData = await queryCollection([
        { field: 'monthKey', operator: '==', value: currentMonth },
        // TODO: Add region filtering based on user role
      ]);
      
      const entriesMap = entriesData.reduce((acc, entry) => {
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

    if (!entry || !employee || !salaryRules) {
        alert('بيانات غير كاملة لحفظ الإدخال');
        return;
    }

    try {
        const totals = calculateTotalSalary(
            employee.baseSalary,
            Number(entry.daysWorked || 0),
            Number(entry.overtimeDays || 0),
            Number(entry.weekendDays || 0),
            salaryRules
        );

        const dataToSave = {
            ...entry,
            daysWorked: Number(entry.daysWorked || 0),
            overtimeDays: Number(entry.overtimeDays || 0),
            weekendDays: Number(entry.weekendDays || 0),
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">الإدخالات الشهرية</h1>
        <input
          type="month"
          value={currentMonth}
          onChange={(e) => setCurrentMonth(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>

      {loading && <p>جاري التحميل...</p>}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-right">اسم الموظف</th>
              <th className="py-3 px-4 text-right">أيام العمل</th>
              <th className="py-3 px-4 text-right">أيام إضافية</th>
              <th className="py-3 px-4 text-right">أيام نهاية الأسبوع</th>
              <th className="py-3 px-4 text-right">إجمالي الراتب</th>
              <th className="py-3 px-4 text-right">الحالة</th>
              <th className="py-3 px-4 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(employee => {
              const entry = monthlyEntries[employee.id!];
              return (
                <tr key={employee.id} className="border-b">
                  <td className="py-3 px-4">{employee.name}</td>
                  <td className="py-3 px-4">
                    <input 
                      type="number"
                      value={entry?.daysWorked || ''}
                      onChange={(e) => handleInputChange(employee.id!, 'daysWorked', e.target.value)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                      disabled={entry?.status === 'submitted' || entry?.status === 'approved'}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input 
                      type="number"
                      value={entry?.overtimeDays || ''}
                      onChange={(e) => handleInputChange(employee.id!, 'overtimeDays', e.target.value)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                      disabled={entry?.status === 'submitted' || entry?.status === 'approved'}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input 
                      type="number"
                      value={entry?.weekendDays || ''}
                      onChange={(e) => handleInputChange(employee.id!, 'weekendDays', e.target.value)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                      disabled={entry?.status === 'submitted' || entry?.status === 'approved'}
                    />
                  </td>
                  <td className="py-3 px-4 font-semibold">
                    {entry?.totals?.total?.toFixed(2) || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${entry?.status === 'approved' ? 'bg-blue-100 text-blue-800' : 
                        entry?.status === 'submitted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {entry?.status || 'مسودة'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
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
  );
};
