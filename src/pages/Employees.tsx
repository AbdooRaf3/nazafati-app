import React, { useState, useEffect, useCallback } from 'react';
import { useFirestoreCRUD } from '../hooks/useFirestoreCRUD';
import { Employee } from '../types';
import { EmployeeForm } from '../components/forms/EmployeeForm';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { formatArabicDate } from '../utils/formatDate';
import { useErrorHandler } from '../hooks/useErrorHandler';

export const Employees: React.FC = () => {
  const { getCollection, addDocument, updateDocument, deleteDocument, loading, error } = useFirestoreCRUD<Employee>('employees');
  const { error: errorHandlerError, clearError, executeWithErrorHandling } = useErrorHandler();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const fetchEmployees = useCallback(async () => {
    await executeWithErrorHandling(
      async () => {
        const data = await getCollection();
        setEmployees(data);
      },
      'fetchEmployees',
      { action: 'fetchEmployees' }
    );
  }, [getCollection, executeWithErrorHandling]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDeleteEmployee = async (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا الموظف؟')) {
      await executeWithErrorHandling(
        async () => {
          await deleteDocument(id);
          fetchEmployees();
        },
        'deleteEmployee',
        { action: 'deleteEmployee', additionalData: { employeeId: id } }
      );
    }
  };

  const handleFormSubmit = async (data: Omit<Employee, 'id'>) => {
    await executeWithErrorHandling(
      async () => {
        if (editingEmployee) {
          await updateDocument(editingEmployee.id!, data);
        } else {
          await addDocument(data);
        }
        fetchEmployees();
        setIsModalOpen(false);
      },
      'handleFormSubmit',
      { 
        action: editingEmployee ? 'updateEmployee' : 'createEmployee',
        additionalData: { employeeId: editingEmployee?.id }
      }
    );
  };

  const columns = [
    { header: 'الرقم الوظيفي', accessor: 'jobNumber' },
    { header: 'الاسم', accessor: 'name' },
    { header: 'الراتب الأساسي', accessor: 'baseSalary' },
    { header: 'المنطقة', accessor: 'regionId' },
    { header: 'الحالة', accessor: 'status' },
    { 
      header: 'تاريخ الإنشاء', 
      accessor: 'createdAt', 
      render: (value: any) => formatArabicDate(value) 
    },
    {
      header: 'إجراءات',
      accessor: 'id',
      render: (_: any, item: Employee) => (
        <div className="flex gap-2">
          <Button onClick={() => handleEditEmployee(item)} size="sm">تعديل</Button>
          <Button onClick={() => handleDeleteEmployee(item.id!)} variant="danger" size="sm">حذف</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">إدارة الموظفين</h1>
        <Button onClick={handleAddEmployee} className="w-full sm:w-auto">
          إضافة موظف جديد
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}
      {(error || errorHandlerError) && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex justify-between items-start">
            <p className="text-red-600">{error?.message || errorHandlerError}</p>
            <Button 
              onClick={clearError} 
              variant="outline" 
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              إغلاق
            </Button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <Table columns={columns} data={employees} />
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingEmployee ? 'تعديل موظف' : 'إضافة موظف جديد'}>
        <EmployeeForm
          onSubmit={handleFormSubmit}
          initialData={editingEmployee || undefined}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
