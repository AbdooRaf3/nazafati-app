import React, { useState, useEffect, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useFirestoreCRUD } from '../hooks/useFirestoreCRUD';
import { SalaryRules } from '../types';
import { Button } from '../components/ui/Button';
import { ErrorReports } from '../components/ErrorReports';

const SETTINGS_DOC_ID = 'salaryRules'; // Document ID for salary rules

export const Settings: React.FC = () => {
  const { getDocument, updateDocument, loading, error } = useFirestoreCRUD<SalaryRules>('salaryRules');
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<SalaryRules>();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'settings' | 'errors'>('settings');

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const settings = await getDocument(SETTINGS_DOC_ID);
      if (settings) {
        reset(settings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [getDocument, reset]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const onSubmit: SubmitHandler<SalaryRules> = async (data) => {
    try {
        await updateDocument(SETTINGS_DOC_ID, data);
        reset(data); // To reset the isDirty state
        alert('تم تحديث الإعدادات بنجاح');
    } catch (err) {
        console.error(err);
        alert('فشل تحديث الإعدادات');
    }
  };

  if (isLoading) {
    return <p className="p-6">جاري تحميل الإعدادات...</p>;
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">إعدادات النظام</h1>
      
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 space-x-reverse">
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              إعدادات الرواتب
            </button>
            <button
              onClick={() => setActiveTab('errors')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'errors'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              تقارير الأخطاء
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'settings' && (
        <div className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="space-y-6">
            <div>
              <label htmlFor="daysInMonthReference" className="block text-sm font-medium text-gray-700 mb-2">
                أيام الشهر المرجعية
              </label>
              <input
                type="number"
                id="daysInMonthReference"
                {...register('daysInMonthReference', { required: 'هذا الحقل مطلوب', valueAsNumber: true, min: 28, max: 31 })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="30"
              />
              {errors.daysInMonthReference && (
                <p className="text-red-500 text-sm mt-1">{errors.daysInMonthReference.message}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">عدد الأيام المرجعية لحساب الراتب اليومي</p>
            </div>

            <div>
              <label htmlFor="overtimeFactor" className="block text-sm font-medium text-gray-700 mb-2">
                معامل الأيام الإضافية
              </label>
              <input
                type="number"
                step="0.1"
                id="overtimeFactor"
                {...register('overtimeFactor', { required: 'هذا الحقل مطلوب', valueAsNumber: true, min: 1 })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="1.5"
              />
              {errors.overtimeFactor && (
                <p className="text-red-500 text-sm mt-1">{errors.overtimeFactor.message}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">مضاعف الراتب للأيام الإضافية (مثال: 1.5 = 150%)</p>
            </div>

            <div>
              <label htmlFor="weekendFactor" className="block text-sm font-medium text-gray-700 mb-2">
                معامل أيام نهاية الأسبوع
              </label>
              <input
                type="number"
                step="0.1"
                id="weekendFactor"
                {...register('weekendFactor', { required: 'هذا الحقل مطلوب', valueAsNumber: true, min: 1 })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="2.0"
              />
              {errors.weekendFactor && (
                <p className="text-red-500 text-sm mt-1">{errors.weekendFactor.message}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">مضاعف الراتب لأيام نهاية الأسبوع (مثال: 2.0 = 200%)</p>
            </div>

            <div>
              <label htmlFor="rounding" className="block text-sm font-medium text-gray-700 mb-2">
                تقريب الأرقام
              </label>
              <select
                id="rounding"
                {...register('rounding', { required: 'هذا الحقل مطلوب' })}
                className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="round">تقريب لأقرب رقم</option>
                <option value="floor">تقريب للأسفل</option>
                <option value="ceil">تقريب للأعلى</option>
              </select>
              {errors.rounding && (
                <p className="text-red-500 text-sm mt-1">{errors.rounding.message}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">طريقة تقريب المبالغ المحسوبة</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-6">
              <p className="text-red-600 text-sm">{error.message}</p>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <Button type="submit" disabled={loading || !isDirty} className="w-full sm:w-auto">
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </form>
        </div>
      )}

      {activeTab === 'errors' && (
        <ErrorReports />
      )}
    </div>
  );
};
