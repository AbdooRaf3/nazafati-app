import React, { useEffect, useState } from 'react';

import { useAuth } from '../hooks/useAuth';
import { useRegionAccess } from '../hooks/useRegionAccess';
import { PageContainer } from '../components/Layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useFirebase } from '../contexts/FirebaseContext';
import { FirestoreService } from '../services/firestoreService';
import { PayrollService } from '../services/payrollService';
import { formatArabicMonth, getCurrentMonthKey } from '../utils/formatDate';


interface DashboardStats {
  totalEmployees: number;
  totalRegions: number;
  currentMonthEntries: number;
  currentMonthSalary: number;
}

export const Dashboard: React.FC = () => {
  const { db } = useFirebase();
  const { user, loading: authLoading } = useAuth();
  const { canViewAllRegions, canGeneratePayroll } = useRegionAccess();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalRegions: 0,
    currentMonthEntries: 0,
    currentMonthSalary: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      // لا نحمل البيانات إلا إذا كان المستخدم مسجل دخول
      if (!user || authLoading) {
        return;
      }

      try {
        setLoading(true);
        const currentMonth = getCurrentMonthKey();

        // جلب الإحصائيات
        const [employees, payrollStats] = await Promise.all([
          db ? FirestoreService.getAllEmployees(db) : Promise.resolve([]),
          PayrollService.getPayrollStatistics(db!, currentMonth)
        ]);

        setStats({
          totalEmployees: employees.length,
          totalRegions: payrollStats.totalRegions,
          currentMonthEntries: payrollStats.totalEmployees,
          currentMonthSalary: payrollStats.totalSalary
        });
      } catch (error) {
        console.error('خطأ في تحميل بيانات لوحة التحكم:', error);
        // في حالة الخطأ، نضع قيم افتراضية
        setStats({
          totalEmployees: 0,
          totalRegions: 0,
          currentMonthEntries: 0,
          currentMonthSalary: 0
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user, authLoading]);

  const StatCard: React.FC<{ title: string; value: string | number; subtitle?: string }> = ({ 
    title, 
    value, 
    subtitle 
  }) => (
    <Card className="text-center">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="text-3xl font-bold text-primary-600 mt-2">{value}</p>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      )}
    </Card>
  );

  if (authLoading || loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </PageContainer>
    );
  }

  // إذا لم يكن المستخدم مسجل دخول، نعرض رسالة
  if (!user) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">يرجى تسجيل الدخول</h2>
            <p className="text-gray-600">يجب تسجيل الدخول لعرض لوحة التحكم</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-600 mt-1">
            مرحباً بك في نظام نظافتي - {formatArabicMonth(getCurrentMonthKey())}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="إجمالي الموظفين"
            value={stats.totalEmployees}
            subtitle="موظف نشط"
          />
          <StatCard
            title="المناطق"
            value={stats.totalRegions}
            subtitle="منطقة"
          />
          <StatCard
            title="إدخالات الشهر الحالي"
            value={stats.currentMonthEntries}
            subtitle="إدخال"
          />
          <StatCard
            title="إجمالي الرواتب"
            value={`${stats.currentMonthSalary.toLocaleString()} ريال`}
            subtitle="للشهر الحالي"
          />
        </div>

        {/* Quick Actions */}
        <Card title="إجراءات سريعة">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {canViewAllRegions() && (
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center"
                onClick={() => window.location.href = '/employees'}
              >
                <svg className="w-8 h-8 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                إدارة الموظفين
              </Button>
            )}

            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center"
              onClick={() => window.location.href = '/monthly-entries'}
            >
              <svg className="w-8 h-8 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              الإدخالات الشهرية
            </Button>

            {canGeneratePayroll() && (
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center"
                onClick={() => window.location.href = '/payroll'}
              >
                <svg className="w-8 h-8 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                كشوف الرواتب
              </Button>
            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card title="النشاطات الأخيرة">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-700">
                  تم تحديث {stats.currentMonthEntries} إدخال شهري
                </span>
              </div>
              <span className="text-xs text-gray-500">اليوم</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-sm text-gray-700">
                  إجمالي الرواتب: {stats.currentMonthSalary.toLocaleString()} ريال
                </span>
              </div>
              <span className="text-xs text-gray-500">هذا الشهر</span>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};
