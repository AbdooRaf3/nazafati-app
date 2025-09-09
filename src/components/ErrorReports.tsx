import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Table } from './ui/Table';
import { errorHandler, ErrorReport } from '../utils/errorHandler';
import { formatArabicDate } from '../utils/formatDate';

export const ErrorReports: React.FC = () => {
  const [reports, setReports] = useState<ErrorReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    setLoading(true);
    try {
      const errorReports = errorHandler.getErrorReports();
      setReports(errorReports);
    } catch (error) {
      console.error('فشل في تحميل تقارير الأخطاء:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearReports = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في مسح جميع تقارير الأخطاء؟')) {
      errorHandler.clearErrorReports();
      setReports([]);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'حرج';
      case 'high':
        return 'عالي';
      case 'medium':
        return 'متوسط';
      case 'low':
        return 'منخفض';
      default:
        return 'غير محدد';
    }
  };

  const columns = [
    {
      header: 'التاريخ',
      accessor: 'timestamp',
      render: (value: Date) => formatArabicDate(value)
    },
    {
      header: 'المكون',
      accessor: 'context.component'
    },
    {
      header: 'الإجراء',
      accessor: 'context.action'
    },
    {
      header: 'الرسالة',
      accessor: 'message',
      render: (value: string) => (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      )
    },
    {
      header: 'الكود',
      accessor: 'code',
      render: (value: string) => value || '-'
    },
    {
      header: 'المستوى',
      accessor: 'severity',
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(value)}`}>
          {getSeverityText(value)}
        </span>
      )
    },
    {
      header: 'إجراءات',
      accessor: 'id',
      render: (_: any, item: ErrorReport) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const details = `
                التفاصيل:
                الرسالة: ${item.message}
                الكود: ${item.code || 'غير محدد'}
                المكون: ${item.context.component || 'غير محدد'}
                الإجراء: ${item.context.action || 'غير محدد'}
                التاريخ: ${formatArabicDate(item.timestamp)}
                المستخدم: ${item.context.userId || 'غير محدد'}
                ${item.stack ? `\nStack Trace:\n${item.stack}` : ''}
              `;
              alert(details);
            }}
          >
            عرض التفاصيل
          </Button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">تقارير الأخطاء</h2>
        <div className="flex gap-2">
          <Button onClick={loadReports} variant="outline" size="sm">
            تحديث
          </Button>
          <Button onClick={clearReports} variant="danger" size="sm">
            مسح الكل
          </Button>
        </div>
      </div>

      <Card>
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            إجمالي التقارير: {reports.length}
          </p>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            لا توجد تقارير أخطاء
          </div>
        ) : (
          <Table columns={columns} data={reports} />
        )}
      </Card>
    </div>
  );
};

export default ErrorReports;
