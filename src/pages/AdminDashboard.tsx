import React, { useState, useEffect } from 'react';
import { useFirestoreCRUD } from '../hooks/useFirestoreCRUD';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';

interface Region {
  id: string;
  name: string;
  description: string;
  employeeCount: number;
}

interface Supervisor {
  uid: string;
  name: string;
  email: string;
  regionIds: string[];
  regionNames: string[];
  isActive: boolean;
}

interface Employee {
  id: string;
  name: string;
  jobNumber: string;
  regionId: string;
  regionName: string;
  supervisorId: string;
  supervisorName: string;
  baseSalary: number;
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'regions' | 'supervisors' | 'employees'>('regions');
  const [regions, setRegions] = useState<Region[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'region' | 'supervisor' | 'employee'>('region');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});


  // دالة جلب المناطق
  const fetchRegions = async () => {
    try {
      setLoading(true);
      const { getFirestore, collection, getDocs } = await import('firebase/firestore');
      const db = getFirestore();
      const snapshot = await getDocs(collection(db, 'regions'));
      const regionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Region[];
      setRegions(regionsData);
    } catch (error) {
      console.error('خطأ في جلب المناطق:', error);
    } finally {
      setLoading(false);
    }
  };

  // دالة جلب المراقبين
  const fetchSupervisors = async () => {
    try {
      setLoading(true);
      const { getFirestore, collection, query, where, getDocs } = await import('firebase/firestore');
      const db = getFirestore();
      const snapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'supervisor')));
      const supervisorsData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as Supervisor[];
      setSupervisors(supervisorsData);
    } catch (error) {
      console.error('خطأ في جلب المراقبين:', error);
    } finally {
      setLoading(false);
    }
  };

  // دالة جلب الموظفين
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { getFirestore, collection, getDocs } = await import('firebase/firestore');
      const db = getFirestore();
      const snapshot = await getDocs(collection(db, 'employees'));
      const employeesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[];
      setEmployees(employeesData);
    } catch (error) {
      console.error('خطأ في جلب الموظفين:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    if (activeTab === 'regions') {
      fetchRegions();
    } else if (activeTab === 'supervisors') {
      fetchSupervisors();
    } else if (activeTab === 'employees') {
      fetchEmployees();
    }
  }, [activeTab, user]);

  // تحقق من صلاحيات الإدارة بعد تعريف كل الـ hooks
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">غير مصرح لك</h1>
          <p className="text-gray-600">يجب أن تكون مديراً للوصول إلى هذه الصفحة</p>
        </div>
      </div>
    );
  }

  // دالة فتح نافذة التعديل
  const openEditModal = (type: 'region' | 'supervisor' | 'employee', item?: any) => {
    setModalType(type);
    setEditingItem(item);
    setFormData(item || {});
    setShowModal(true);
  };

  // دالة حفظ التعديلات
  const handleSave = async () => {
    try {
      setLoading(true);
      const { getFirestore, doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const db = getFirestore();

      if (modalType === 'region') {
        const regionData = {
          ...formData,
          updatedAt: serverTimestamp()
        };
        await setDoc(doc(db, 'regions', editingItem?.id || 'region-' + Date.now()), regionData);
        await fetchRegions();
      } else if (modalType === 'supervisor') {
        const supervisorData = {
          ...formData,
          role: 'supervisor',
          updatedAt: serverTimestamp()
        };
        await setDoc(doc(db, 'users', editingItem?.uid || 'supervisor-' + Date.now()), supervisorData);
        await fetchSupervisors();
      } else if (modalType === 'employee') {
        const employeeData = {
          ...formData,
          updatedAt: serverTimestamp()
        };
        await setDoc(doc(db, 'employees', editingItem?.id || 'employee-' + Date.now()), employeeData);
        await fetchEmployees();
      }

      setShowModal(false);
      setEditingItem(null);
      setFormData({});
    } catch (error) {
      console.error('خطأ في الحفظ:', error);
      alert('حدث خطأ في الحفظ');
    } finally {
      setLoading(false);
    }
  };

  // دالة حذف العنصر
  const handleDelete = async (type: 'region' | 'supervisor' | 'employee', id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;

    try {
      setLoading(true);
      const { getFirestore, doc, deleteDoc } = await import('firebase/firestore');
      const db = getFirestore();

      if (type === 'region') {
        await deleteDoc(doc(db, 'regions', id));
        await fetchRegions();
      } else if (type === 'supervisor') {
        await deleteDoc(doc(db, 'users', id));
        await fetchSupervisors();
      } else if (type === 'employee') {
        await deleteDoc(doc(db, 'employees', id));
        await fetchEmployees();
      }
    } catch (error) {
      console.error('خطأ في الحذف:', error);
      alert('حدث خطأ في الحذف');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">لوحة الإدارة</h1>
      
      {/* التبويبات */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 space-x-reverse">
            <button
              onClick={() => setActiveTab('regions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'regions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              المناطق ({regions.length})
            </button>
            <button
              onClick={() => setActiveTab('supervisors')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'supervisors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              المراقبين ({supervisors.length})
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'employees'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              الموظفين ({employees.length})
            </button>
          </nav>
        </div>
      </div>

      {/* محتوى التبويبات */}
      {activeTab === 'regions' && (
        <Card>
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">إدارة المناطق</h3>
            <Button onClick={() => openEditModal('region')}>
              إضافة منطقة جديدة
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الوصف</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عدد الموظفين</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {regions.map((region) => (
                  <tr key={region.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{region.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{region.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{region.employeeCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openEditModal('region', region)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete('region', region.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'supervisors' && (
        <Card>
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">إدارة المراقبين</h3>
            <Button onClick={() => openEditModal('supervisor')}>
              إضافة مراقب جديد
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإيميل</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المناطق</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {supervisors.map((supervisor) => (
                  <tr key={supervisor.uid}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{supervisor.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supervisor.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supervisor.regionNames?.join(', ') || 'لا توجد'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        supervisor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {supervisor.isActive ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openEditModal('supervisor', supervisor)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete('supervisor', supervisor.uid)}
                        className="text-red-600 hover:text-red-900"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'employees' && (
        <Card>
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">إدارة الموظفين</h3>
            <Button onClick={() => openEditModal('employee')}>
              إضافة موظف جديد
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الوظيفة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المنطقة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المراقب</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الراتب الأساسي</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.jobNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.regionName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.supervisorName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.baseSalary?.toLocaleString() || 'غير محدد'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openEditModal('employee', employee)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete('employee', employee.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* نافذة التعديل */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingItem ? 'تعديل' : 'إضافة'} {modalType === 'region' ? 'منطقة' : modalType === 'supervisor' ? 'مراقب' : 'موظف'}
          </h3>
          
          <div className="space-y-4">
            {modalType === 'region' && (
              <>
                <Input
                  label="اسم المنطقة"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
                <Input
                  label="الوصف"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </>
            )}
            
            {modalType === 'supervisor' && (
              <>
                <Input
                  label="اسم المراقب"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
                <Input
                  label="الإيميل"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المناطق المسؤول عنها</label>
                  <select
                    multiple
                    value={formData.regionIds || []}
                    onChange={(e) => {
                      const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData({...formData, regionIds: selectedIds});
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {regions.map(region => (
                      <option key={region.id} value={region.id}>{region.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            
            {modalType === 'employee' && (
              <>
                <Input
                  label="اسم الموظف"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
                <Input
                  label="رقم الوظيفة"
                  value={formData.jobNumber || ''}
                  onChange={(e) => setFormData({...formData, jobNumber: e.target.value})}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المنطقة</label>
                  <select
                    value={formData.regionId || ''}
                    onChange={(e) => setFormData({...formData, regionId: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">اختر المنطقة</option>
                    {regions.map(region => (
                      <option key={region.id} value={region.id}>{region.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المراقب</label>
                  <select
                    value={formData.supervisorId || ''}
                    onChange={(e) => setFormData({...formData, supervisorId: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">اختر المراقب</option>
                    {supervisors.map(supervisor => (
                      <option key={supervisor.uid} value={supervisor.uid}>{supervisor.name}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="الراتب الأساسي"
                  type="number"
                  value={formData.baseSalary || ''}
                  onChange={(e) => setFormData({...formData, baseSalary: parseFloat(e.target.value)})}
                />
              </>
            )}
          </div>
          
          <div className="mt-6 flex justify-end space-x-3 space-x-reverse">
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
