// لوحة المراقب مع الصلاحيات المحددة
import React, { useState, useEffect } from 'react';
import { useSupervisor } from '../contexts/SupervisorContext';
import { useEmployees } from '../hooks/useEmployees';
import { useFirestoreCRUD } from '../hooks/useFirestoreCRUD';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Toast } from '../components/ui/Toast';
import { calculateSalaryWithNewFormulas } from '../utils/calcSalary';
import { formatDate } from '../utils/formatDate';

interface MonthlyEntry {
  id: string;
  employeeId: string;
  monthKey: string;
  daysInMonth: number;
  holidays: number;
  fridaysAndHolidays: number;
  overtimeAfterReference: number;
  regionId: string;
  submittedBy: string;
  status: 'draft' | 'submitted' | 'approved';
  totals: {
    dailyWage: number;
    total: number;
    totalOvertime?: number;
    totalSalary?: number;
    netSalary?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SupervisorDashboard: React.FC = () => {
  const { supervisor, permissions, assignedRegions, canAccess, isLoading, error } = useSupervisor();
  const { employees, loading: employeesLoading } = useEmployees();
  const { getCollection } = useFirestoreCRUD();
  
  const [monthlyEntries, setMonthlyEntries] = useState<MonthlyEntry[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [entryData, setEntryData] = useState({
    daysInMonth: 31,
    holidays: 0,
    fridaysAndHolidays: 0,
    overtimeAfterReference: 0
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // فلترة الموظفين حسب المناطق المسؤول عنها
  const filteredEmployees = employees.filter(employee => 
    assignedRegions.includes(employee.regionId)
  );

  // جلب الإدخالات الشهرية للمناطق المسؤول عنها
  const fetchMonthlyEntries = async () => {
    if (!assignedRegions.length) return;
    
    setLoading(true);
    try {
      const entries = await getCollection('monthly-entries');
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
    fetchMonthlyEntries();
  }, [selectedMonth, assignedRegions]);

  // حساب الراتب
  const calculateSalary = (employee: any, entryData: any) => {
    const calculations = calculateSalaryWithNewFormulas(
      employee.baseSalary,
      entryData.daysInMonth,
      entryData.holidays,
      entryData.fridaysAndHolidays,
      entryData.overtimeAfterReference
    );
    
    return calculations;
  };

  // حفظ الإدخال الشهري
  const handleSaveEntry = async () => {
    if (!selectedEmployee) return;
    
    try {
      const calculations = calculateSalary(selectedEmployee, entryData);
      
      const entry: MonthlyEntry = {
        id: `${selectedMonth}_${selectedEmployee.jobNumber}`,
        employeeId: selectedEmployee.jobNumber,
        monthKey: selectedMonth,
        daysInMonth: entryData.daysInMonth,
        holidays: entryData.holidays,
        fridaysAndHolidays: entryData.fridaysAndHolidays,
        overtimeAfterReference: entryData.overtimeAfterReference,
        regionId: selectedEmployee.regionId,
        submittedBy: supervisor?.uid || 'unknown',
        status: 'submitted',
        totals: {
          dailyWage: selectedEmployee.baseSalary / entryData.daysInMonth,
          total: calculations.netSalary,
          totalOvertime: calculations.totalOvertime,
          totalSalary: calculations.totalSalary,
          netSalary: calculations.netSalary
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // حفظ الإدخال
      const { getFirestore, doc, setDoc } = await import('firebase/firestore');
      const db = getFirestore();
      await setDoc(doc(db, 'monthly-entries', entry.id), entry);
      
      setToast({ message: 'تم حفظ الإدخال بنجاح', type: 'success' });
      setShowEntryModal(false);
      fetchMonthlyEntries();
    } catch (error) {
      console.error('خطأ في حفظ الإدخال:', error);
      setToast({ message: 'خطأ في حفظ الإدخال', type: 'error' });
    }
  };

  // فتح نافذة إدخال البيانات
  const handleOpenEntryModal = (employee: any) => {
    setSelectedEmployee(employee);
    setEntryData({
      daysInMonth: 31,
      holidays: 0,
      fridaysAndHolidays: 0,
      overtimeAfterReference: 0
    });
    setShowEntryModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل بيانات المراقب...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">خطأ في تحميل البيانات</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!supervisor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-gray-600 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">غير مصرح لك بالوصول</h2>
          <p className="text-gray-600">يجب أن تكون مراقباً للوصول إلى هذه الصفحة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                لوحة المراقب
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                مرحباً {supervisor.name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="2025-01">يناير 2025</option>
                <option value="2025-02">فبراير 2025</option>
                <option value="2025-03">مارس 2025</option>
                <option value="2025-04">أبريل 2025</option>
                <option value="2025-05">مايو 2025</option>
                <option value="2025-06">يونيو 2025</option>
                <option value="2025-07">يوليو 2025</option>
                <option value="2025-08">أغسطس 2025</option>
                <option value="2025-09">سبتمبر 2025</option>
                <option value="2025-10">أكتوبر 2025</option>
                <option value="2025-11">نوفمبر 2025</option>
                <option value="2025-12">ديسمبر 2025</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">الموظفين</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {filteredEmployees.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm font-medium">📅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">الإدخالات</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {monthlyEntries.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm font-medium">🏢</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">المناطق</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {assignedRegions.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-sm font-medium">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">إجمالي الرواتب</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {monthlyEntries.reduce((sum, entry) => sum + (entry.totals.netSalary || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        </div>

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
              <Table
                columns={[
                  { key: 'jobNumber', label: 'رقم الوظيفة' },
                  { key: 'name', label: 'اسم الموظف' },
                  { key: 'baseSalary', label: 'الراتب الأساسي' },
                  { key: 'regionId', label: 'المنطقة' },
                  { key: 'actions', label: 'الإجراءات' }
                ]}
                data={filteredEmployees.map(employee => ({
                  ...employee,
                  baseSalary: `${employee.baseSalary} دينار`,
                  regionId: assignedRegions.find(region => region === employee.regionId) || 'غير محدد',
                  actions: (
                    <Button
                      onClick={() => handleOpenEntryModal(employee)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm"
                    >
                      إدخال البيانات
                    </Button>
                  )
                }))}
              />
            </div>
          </Card>
        )}

        {/* الإدخالات الشهرية */}
        {canAccess('canViewMonthlyEntries') && (
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">الإدخالات الشهرية</h3>
              <p className="mt-1 text-sm text-gray-500">
                بيانات العمل الإضافي لشهر {selectedMonth}
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table
                columns={[
                  { key: 'employeeId', label: 'رقم الوظيفة' },
                  { key: 'daysInMonth', label: 'أيام الشهر' },
                  { key: 'holidays', label: 'العطل' },
                  { key: 'fridaysAndHolidays', label: 'الجمع والعطل' },
                  { key: 'overtimeAfterReference', label: 'الإضافي بعد المرجع' },
                  { key: 'totals.totalOvertime', label: 'إجمالي الإضافي' },
                  { key: 'totals.totalSalary', label: 'إجمالي الراتب' },
                  { key: 'totals.netSalary', label: 'صافي الراتب' },
                  { key: 'status', label: 'الحالة' }
                ]}
                data={monthlyEntries.map(entry => ({
                  ...entry,
                  'totals.totalOvertime': `${entry.totals.totalOvertime || 0} دينار`,
                  'totals.totalSalary': `${entry.totals.totalSalary || 0} دينار`,
                  'totals.netSalary': `${entry.totals.netSalary || 0} دينار`,
                  status: entry.status === 'submitted' ? 'تم الإرسال' : 
                         entry.status === 'approved' ? 'تم الموافقة' : 'مسودة'
                }))}
              />
            </div>
          </Card>
        )}
      </div>

      {/* نافذة إدخال البيانات */}
      {showEntryModal && selectedEmployee && (
        <Modal
          isOpen={showEntryModal}
          onClose={() => setShowEntryModal(false)}
          title={`إدخال بيانات ${selectedEmployee.name}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="أيام الشهر"
                type="number"
                value={entryData.daysInMonth}
                onChange={(e) => setEntryData({...entryData, daysInMonth: Number(e.target.value)})}
              />
              <Input
                label="العطل"
                type="number"
                value={entryData.holidays}
                onChange={(e) => setEntryData({...entryData, holidays: Number(e.target.value)})}
              />
              <Input
                label="الجمع والعطل"
                type="number"
                value={entryData.fridaysAndHolidays}
                onChange={(e) => setEntryData({...entryData, fridaysAndHolidays: Number(e.target.value)})}
              />
              <Input
                label="الإضافي بعد المرجع"
                type="number"
                value={entryData.overtimeAfterReference}
                onChange={(e) => setEntryData({...entryData, overtimeAfterReference: Number(e.target.value)})}
              />
            </div>
            
            {/* عرض الحسابات */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">الحسابات:</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">إجمالي الإضافي:</span>
                  <span className="font-medium ml-2">
                    {calculateSalary(selectedEmployee, entryData).totalOvertime} دينار
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">إجمالي الراتب:</span>
                  <span className="font-medium ml-2">
                    {calculateSalary(selectedEmployee, entryData).totalSalary} دينار
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">صافي الراتب:</span>
                  <span className="font-medium ml-2">
                    {calculateSalary(selectedEmployee, entryData).netSalary} دينار
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setShowEntryModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleSaveEntry}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                حفظ
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default SupervisorDashboard;
