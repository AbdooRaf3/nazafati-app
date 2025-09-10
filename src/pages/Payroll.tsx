import React, { useState, useCallback } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { PayrollService, PayrollSummary } from '../services/payrollService';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { formatCurrency } from '../constants/currency';

export const Payroll: React.FC = () => {
  const { db } = useFirebase();
  const [payrollData, setPayrollData] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
  });

  const handleGeneratePayroll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await PayrollService.generatePayrollDataWithNewFormulas(db!, currentMonth);
      setPayrollData(data);
    } catch (err: any) {
      setError(err.message || 'فشل في توليد الرواتب');
      setPayrollData(null);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  const handleApproveEntries = async () => {
    if (!payrollData) return;

    if (window.confirm('هل أنت متأكد من رغبتك في الموافقة على جميع الإدخالات لهذا الشهر؟')) {
        try {
            setLoading(true);
            await PayrollService.approveMonthlyEntries(db!, currentMonth);
            handleGeneratePayroll(); // Refresh data after approval
            alert('تمت الموافقة بنجاح');
        } catch(err: any) {
            setError(err.message || 'فشل في الموافقة على الإدخالات');
        } finally {
            setLoading(false);
        }
    }
  };

  const payrollColumns = [
    { header: 'الرقم الوظيفي', accessor: 'jobNumber' },
    { header: 'الاسم', accessor: 'name' },
    { 
      header: 'الراتب الأساسي', 
      accessor: 'baseSalary',
      render: (value: number) => formatCurrency(value)
    },
    { header: 'أيام الشهر', accessor: 'daysInMonth' },
    { header: 'العطل', accessor: 'holidays' },
    { header: 'الجمع والعطل', accessor: 'fridaysAndHolidays' },
    { header: 'الإضافي بعد المرجع', accessor: 'overtimeAfterReference' },
    { 
      header: 'إجمالي الإضافي', 
      accessor: 'totalOvertime',
      render: (value: number) => formatCurrency(value)
    },
    { 
      header: 'إجمالي الراتب', 
      accessor: 'totalSalary',
      render: (value: number) => formatCurrency(value)
    },
    { 
      header: 'صافي الراتب', 
      accessor: 'netSalary',
      render: (value: number) => formatCurrency(value)
    },
    { header: 'ملاحظات', accessor: 'notes' },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">كشوف الرواتب</h1>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="payroll-month" className="text-sm font-medium text-gray-700">الشهر:</label>
            <input
              id="payroll-month"
              type="month"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleGeneratePayroll} disabled={loading} className="w-full sm:w-auto">
              {loading ? 'جاري التوليد...' : 'توليد كشف الرواتب'}
            </Button>
            {payrollData && (
              <Button onClick={handleApproveEntries} disabled={loading} variant="success" className="w-full sm:w-auto">
                {loading ? 'جاري الموافقة...' : 'الموافقة على الكل'}
              </Button>
            )}
          </div>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>

      {payrollData && (
        <div className="space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">ملخص الرواتب لشهر {currentMonth}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">إجمالي الموظفين</p>
                <p className="text-2xl font-bold text-gray-900">{payrollData.totalEmployees}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">إجمالي الرواتب الأساسية</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(payrollData.totalBaseSalary)}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-sm text-blue-700 mb-1">إجمالي الإضافي</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(payrollData.totalOvertime)}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-sm text-green-700 mb-1">إجمالي الراتب</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(payrollData.totalSalary)}</p>
              </div>
              <div className="p-4 bg-primary-50 rounded-lg text-center">
                <p className="text-sm text-primary-700 mb-1">صافي الراتب</p>
                <p className="text-2xl font-bold text-primary-600">{formatCurrency(payrollData.netSalary)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <Table columns={payrollColumns} data={payrollData.rows} />
          </div>
        </div>
      )}
    </div>
  );
};
