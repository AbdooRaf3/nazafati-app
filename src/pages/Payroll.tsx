import React, { useState, useCallback } from 'react';
import { PayrollService, PayrollSummary } from '../../services/payrollService';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';

export const Payroll: React.FC = () => {
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
      const data = await PayrollService.generatePayrollData(currentMonth);
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
            await PayrollService.approveMonthlyEntries(currentMonth);
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
    { header: 'أيام العمل', accessor: 'daysWorked' },
    { header: 'أيام إضافية', accessor: 'overtimeDays' },
    { header: 'أيام عطلة نهاية الأسبوع', accessor: 'weekendDays' },
    { header: 'الراتب الأساسي', accessor: 'baseSalary' },
    { header: 'الأجر اليومي', accessor: 'dailyWage' },
    { header: 'الإجمالي', accessor: 'total' },
    { header: 'ملاحظات', accessor: 'notes' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">كشوف الرواتب</h1>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex items-center space-x-4">
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
          <Button onClick={handleGeneratePayroll} disabled={loading}>
            {loading ? 'جاري التوليد...' : 'توليد كشف الرواتب'}
          </Button>
          {payrollData && (
            <Button onClick={handleApproveEntries} disabled={loading} variant="success">
              {loading ? 'جاري الموافقة...' : 'الموافقة على الكل'}
            </Button>
          )}
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      {payrollData && (
        <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">ملخص الرواتب لشهر {currentMonth}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-center">
                <div className="p-4 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-600">إجمالي الموظفين</p>
                    <p className="text-2xl font-bold">{payrollData.totalEmployees}</p>
                </div>
                <div className="p-4 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-600">إجمالي أيام العمل</p>
                    <p className="text-2xl font-bold">{payrollData.totalDaysWorked}</p>
                </div>
                <div className="p-4 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-600">إجمالي الرواتب الأساسية</p>
                    <p className="text-2xl font-bold">{payrollData.totalBaseSalary.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-primary-100 rounded-lg">
                    <p className="text-sm text-primary-800">إجمالي الرواتب المحسوبة</p>
                    <p className="text-2xl font-bold text-primary-600">{payrollData.totalCalculatedSalary.toFixed(2)}</p>
                </div>
            </div>
            <Table columns={payrollColumns} data={payrollData.rows} />
        </div>
      )}
    </div>
  );
};
