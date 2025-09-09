import { FirestoreService } from './firestoreService';
import { Firestore } from 'firebase/firestore';
import { calculateTotalSalary } from '../utils/calcSalary';
import { errorHandler } from '../utils/errorHandler';

export interface PayrollRow {
  jobNumber: string;
  name: string;
  daysWorked: number;
  overtimeDays: number;
  weekendDays: number;
  baseSalary: number;
  dailyWage: number;
  total: number;
  notes: string;
}

export interface PayrollSummary {
  monthKey: string;
  totalEmployees: number;
  totalDaysWorked: number;
  totalOvertimeDays: number;
  totalWeekendDays: number;
  totalBaseSalary: number;
  totalCalculatedSalary: number;
  rows: PayrollRow[];
}

export class PayrollService {
  static async generatePayrollData(db: Firestore, monthKey: string, regionId?: string): Promise<PayrollSummary> {
    try {
      // جلب الإدخالات الشهرية
      const entries = await FirestoreService.getMonthlyEntries(db, monthKey, regionId);
      
      if (entries.length === 0) {
        throw new Error('لا توجد بيانات للشهر المحدد');
      }

      // جلب قواعد الرواتب
      const salaryRules = await FirestoreService.getSalaryRules(db);
      
      // جلب بيانات الموظفين
      const employeeIds = [...new Set(entries.map(entry => entry.employeeId))];
      const employees = await Promise.all(
        employeeIds.map(id => FirestoreService.getUser(db, id))
      );
      
      // إنشاء صفوف الرواتب
      const rows: PayrollRow[] = [];
      let totalDaysWorked = 0;
      let totalOvertimeDays = 0;
      let totalWeekendDays = 0;
      let totalBaseSalary = 0;
      let totalCalculatedSalary = 0;

      for (const entry of entries) {
        const employee = employees.find(emp => emp?.uid === entry.employeeId);
        if (!employee) continue;

        // حساب الرواتب مرة أخرى للتأكد من صحة البيانات
        const totals = calculateTotalSalary(
          entry.totals.dailyWage * salaryRules.daysInMonthReference,
          entry.daysWorked,
          entry.overtimeDays,
          entry.weekendDays,
          salaryRules
        );

        const row: PayrollRow = {
          jobNumber: employee.uid, // استخدام UID كرقم الوظيفة مؤقتاً
          name: employee.name,
          daysWorked: entry.daysWorked,
          overtimeDays: entry.overtimeDays,
          weekendDays: entry.weekendDays,
          baseSalary: entry.totals.dailyWage * salaryRules.daysInMonthReference,
          dailyWage: entry.totals.dailyWage,
          total: totals.total,
          notes: entry.status === 'approved' ? 'موافق عليه' : 
                 entry.status === 'submitted' ? 'مُرسل للمراجعة' : 'مسودة'
        };

        rows.push(row);

        // تحديث الإجماليات
        totalDaysWorked += entry.daysWorked;
        totalOvertimeDays += entry.overtimeDays;
        totalWeekendDays += entry.weekendDays;
        totalBaseSalary += row.baseSalary;
        totalCalculatedSalary += totals.total;
      }

      return {
        monthKey,
        totalEmployees: rows.length,
        totalDaysWorked,
        totalOvertimeDays,
        totalWeekendDays,
        totalBaseSalary,
        totalCalculatedSalary,
        rows
      };
    } catch (error) {
      errorHandler.handleError(error, 'generatePayrollData', {
        action: 'generatePayrollData',
        additionalData: { monthKey, regionId }
      });
      throw new Error('فشل في توليد بيانات الرواتب');
    }
  }

  static async approveMonthlyEntries(db: Firestore, monthKey: string, regionId?: string): Promise<void> {
    try {
      const entries = await FirestoreService.getMonthlyEntries(db, monthKey, regionId);
      
      // تحديث حالة جميع الإدخالات إلى 'approved'
      for (const entry of entries) {
        if (entry.status !== 'approved') {
          await FirestoreService.updateDocument(db, 'monthly-entries', entry.id, {
            status: 'approved',
            updatedAt: new Date()
          });
        }
      }
    } catch (error) {
      errorHandler.handleError(error, 'approveMonthlyEntries', {
        action: 'approveMonthlyEntries',
        additionalData: { monthKey, regionId }
      });
      throw new Error('فشل في الموافقة على الإدخالات');
    }
  }

  static async getPayrollStatistics(db: Firestore, monthKey: string): Promise<{
    totalRegions: number;
    totalEmployees: number;
    totalSalary: number;
    averageSalary: number;
    regionBreakdown: Array<{
      regionId: string;
      employeeCount: number;
      totalSalary: number;
    }>;
  }> {
    try {
      const entries = await FirestoreService.getMonthlyEntries(db, monthKey);
      
      // تجميع البيانات حسب المنطقة
      const regionData = new Map<string, { count: number; salary: number }>();
      
      for (const entry of entries) {
        const current = regionData.get(entry.regionId) || { count: 0, salary: 0 };
        current.count += 1;
        current.salary += entry.totals.total;
        regionData.set(entry.regionId, current);
      }

      const totalEmployees = entries.length;
      const totalSalary = entries.reduce((sum, entry) => sum + entry.totals.total, 0);
      const averageSalary = totalEmployees > 0 ? totalSalary / totalEmployees : 0;

      const regionBreakdown = Array.from(regionData.entries()).map(([regionId, data]) => ({
        regionId,
        employeeCount: data.count,
        totalSalary: data.salary
      }));

      return {
        totalRegions: regionData.size,
        totalEmployees,
        totalSalary,
        averageSalary,
        regionBreakdown
      };
    } catch (error) {
      errorHandler.handleError(error, 'getPayrollStatistics', {
        action: 'getPayrollStatistics',
        additionalData: { monthKey }
      });
      throw new Error('فشل في جلب إحصائيات الرواتب');
    }
  }

  static validatePayrollData(payrollData: PayrollSummary): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (payrollData.totalEmployees === 0) {
      errors.push('لا يوجد موظفين في كشف الرواتب');
    }

    if (payrollData.totalDaysWorked < 0) {
      errors.push('إجمالي أيام العمل لا يمكن أن يكون سالب');
    }

    if (payrollData.totalCalculatedSalary < 0) {
      errors.push('إجمالي الرواتب لا يمكن أن يكون سالب');
    }

    // التحقق من صحة البيانات في كل صف
    for (let i = 0; i < payrollData.rows.length; i++) {
      const row = payrollData.rows[i];
      
      if (row.daysWorked < 0 || row.daysWorked > 31) {
        errors.push(`صف ${i + 1}: عدد أيام العمل غير صحيح`);
      }
      
      if (row.total < 0) {
        errors.push(`صف ${i + 1}: الراتب المحسوب غير صحيح`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
