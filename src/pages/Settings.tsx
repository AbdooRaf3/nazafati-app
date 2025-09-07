import React, { useState, useEffect, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useFirestoreCRUD } from '../../hooks/useFirestoreCRUD';
import { SalaryRules } from '../../types';
import { Button } from '../../components/ui/Button';

const SETTINGS_DOC_ID = 'salaryRules'; // Document ID for salary rules

export const Settings: React.FC = () => {
  const { getDocument, updateDocument, loading, error } = useFirestoreCRUD<SalaryRules>('settings';
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<SalaryRules>();
  const [isLoading, setIsLoading] = useState(true);

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
    <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">إعدادات النظام</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg bg-white p-6 rounded-lg shadow-md">
            <div className="space-y-4">
                <div>
                    <label htmlFor="daysInMonthReference" className="block text-sm font-medium text-gray-700">أيام الشهر المرجعية</label>
                    <input
                        type="number"
                        id="daysInMonthReference"
                        {...register('daysInMonthReference', { required: 'هذا الحقل مطلوب', valueAsNumber: true, min: 28, max: 31 })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    />
                    {errors.daysInMonthReference && <p className="text-red-500 text-xs mt-1">{errors.daysInMonthReference.message}</p>}
                </div>

                <div>
                    <label htmlFor="overtimeFactor" className="block text-sm font-medium text-gray-700">معامل الأيام الإضافية</label>
                    <input
                        type="number"
                        step="0.1"
                        id="overtimeFactor"
                        {...register('overtimeFactor', { required: 'هذا الحقل مطلوب', valueAsNumber: true, min: 1 })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    />
                    {errors.overtimeFactor && <p className="text-red-500 text-xs mt-1">{errors.overtimeFactor.message}</p>}
                </div>

                <div>
                    <label htmlFor="weekendFactor" className="block text-sm font-medium text-gray-700">معامل أيام نهاية الأسبوع</label>
                    <input
                        type="number"
                        step="0.1"
                        id="weekendFactor"
                        {...register('weekendFactor', { required: 'هذا الحقل مطلوب', valueAsNumber: true, min: 1 })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    />
                    {errors.weekendFactor && <p className="text-red-500 text-xs mt-1">{errors.weekendFactor.message}</p>}
                </div>

                <div>
                    <label htmlFor="rounding" className="block text-sm font-medium text-gray-700">تقريب الأرقام</label>
                    <select
                        id="rounding"
                        {...register('rounding', { required: 'هذا الحقل مطلوب' })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm"
                    >
                        <option value="round">تقريب لأقرب رقم</option>
                        <option value="floor">تقريب للأسفل</option>
                        <option value="ceil">تقريب للأعلى</option>
                    </select>
                    {errors.rounding && <p className="text-red-500 text-xs mt-1">{errors.rounding.message}</p>}
                </div>
            </div>

            {error && <p className="text-red-500 my-4">{error}</p>}

            <div className="mt-6">
                <Button type="submit" disabled={loading || !isDirty}>
                    {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Button>
            </div>
        </form>
    </div>
  );
};
