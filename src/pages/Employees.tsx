import React, { useState, useEffect, useCallback } from 'react';
import { useFirestoreCRUD } from '../hooks/useFirestoreCRUD';
import { Employee } from '../types';
import { EmployeeForm } from '../components/forms/EmployeeForm';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { formatArabicDate as formatDate } from '../utils/formatDate';

export const Employees: React.FC = () => {
  const { getCollection, addDocument, updateDocument, deleteDocument, loading, error } = useFirestoreCRUD<Employee>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      const data = await getCollection();
      setEmployees(data);
    } catch (err) {
      console.error(err);
    }
  }, [getCollection]);

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
      try {
        await deleteDocument(id);
        fetchEmployees();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleFormSubmit = async (data: Omit<Employee, 'id'>) => {
    try {
      if (editingEmployee) {
        await updateDocument(editingEmployee.id!, data);
      } else {
        await addDocument(data);
      }
      fetchEmployees();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
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
      render: (value: any) => formatDate(value) 
    },
    {
      header: 'إجراءات',
      accessor: 'id',
      render: (_: any, item: Employee) => (
        <div className="space-x-2">
          <Button onClick={() => handleEditEmployee(item)} size="sm">تعديل</Button>
          <Button onClick={() => handleDeleteEmployee(item.id!)} variant="danger" size="sm">حذف</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">إدارة الموظفين</h1>
        <Button onClick={handleAddEmployee}>إضافة موظف جديد</Button>
      </div>

      {loading && <p>جاري التحميل...</p>}
      {error && <p className="text-red-500">{error.message}</p>}

      {!loading && !error && <Table columns={columns} data={employees} />}

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
