import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Employee } from '../../types';

interface EmployeeFormProps {
  onSubmit: SubmitHandler<Omit<Employee, 'id'>>;
  initialData?: Partial<Employee>;
  onCancel: () => void;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ onSubmit, initialData, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<Omit<Employee, 'id'>>({
    defaultValues: initialData || {
      status: 'active',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">الاسم</label>
          <input
            type="text"
            id="name"
            {...register('name', { required: 'الاسم مطلوب' })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="أدخل اسم الموظف"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="jobNumber" className="block text-sm font-medium text-gray-700 mb-2">الرقم الوظيفي</label>
          <input
            type="text"
            id="jobNumber"
            {...register('jobNumber', { required: 'الرقم الوظيفي مطلوب' })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="أدخل الرقم الوظيفي"
          />
          {errors.jobNumber && <p className="text-red-500 text-sm mt-1">{errors.jobNumber.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="baseSalary" className="block text-sm font-medium text-gray-700 mb-2">الراتب الأساسي</label>
          <input
            type="number"
            id="baseSalary"
            {...register('baseSalary', { required: 'الراتب الأساسي مطلوب', valueAsNumber: true, min: 0 })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="0"
            step="0.01"
          />
          {errors.baseSalary && <p className="text-red-500 text-sm mt-1">{errors.baseSalary.message}</p>}
          <p className="text-gray-500 text-sm mt-1">بالريال السعودي</p>
        </div>

        <div>
          <label htmlFor="regionId" className="block text-sm font-medium text-gray-700 mb-2">المنطقة</label>
          <input
            type="text"
            id="regionId"
            {...register('regionId', { required: 'المنطقة مطلوبة' })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="أدخل المنطقة"
          />
          {errors.regionId && <p className="text-red-500 text-sm mt-1">{errors.regionId.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
        <select
          id="status"
          {...register('status', { required: 'الحالة مطلوبة' })}
          className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="active">نشط</option>
          <option value="inactive">غير نشط</option>
        </select>
        {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>}
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors w-full sm:w-auto"
        >
          إلغاء
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors w-full sm:w-auto"
        >
          حفظ
        </button>
      </div>
    </form>
  );
};