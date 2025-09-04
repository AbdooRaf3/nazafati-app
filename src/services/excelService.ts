import * as XLSX from 'xlsx';
import { PayrollSummary } from './payrollService';
import { formatArabicMonth } from '../utils/formatDate';

export class ExcelService {
  static generateAndDownloadExcel(monthKey: string, payrollData: PayrollSummary): void {
    try {
      // إنشاء workbook جديد
      const workbook = XLSX.utils.book_new();
      
      // إنشاء بيانات الرواتب
      const payrollRows = this.createPayrollRows(payrollData);
      
      // إنشاء ورقة الرواتب
      const payrollSheet = XLSX.utils.json_to_sheet(payrollRows);
      
      // تعيين أسماء الأعمدة بالعربية
      const headers = [
        'رقم الوظيفة',
        'اسم الموظف',
        'أيام العمل',
        'أيام العمل الإضافي',
        'أيام العمل في العطل',
        'الراتب الأساسي',
        'الأجر اليومي',
        'إجمالي الراتب',
        'ملاحظات'
      ];
      
      // تطبيق العناوين
      XLSX.utils.sheet_add_aoa(payrollSheet, [headers], { origin: 'A1' });
      
      // إنشاء ورقة الملخص
      const summaryRows = this.createSummaryRows(payrollData);
      const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
      
      // تعيين أسماء أعمدة الملخص
      const summaryHeaders = ['البند', 'القيمة'];
      XLSX.utils.sheet_add_aoa(summarySheet, [summaryHeaders], { origin: 'A1' });
      
      // إضافة الأوراق إلى الكتاب
      XLSX.utils.book_append_sheet(workbook, payrollSheet, 'كشف الرواتب');
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'ملخص الرواتب');
      
      // تنسيق الأعمدة
      this.formatColumns(payrollSheet, summarySheet);
      
      // إنشاء اسم الملف
      const fileName = `كشف_رواتب_${monthKey}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // تنزيل الملف
      XLSX.writeFile(workbook, fileName);
      
    } catch (error) {
      console.error('خطأ في توليد ملف Excel:', error);
      throw new Error('فشل في توليد ملف Excel');
    }
  }

  private static createPayrollRows(payrollData: PayrollSummary): any[] {
    return payrollData.rows.map((row) => ({
      'رقم الوظيفة': row.jobNumber,
      'اسم الموظف': row.name,
      'أيام العمل': row.daysWorked,
      'أيام العمل الإضافي': row.overtimeDays,
      'أيام العمل في العطل': row.weekendDays,
      'الراتب الأساسي': row.baseSalary,
      'الأجر اليومي': row.dailyWage,
      'إجمالي الراتب': row.total,
      'ملاحظات': row.notes
    }));
  }

  private static createSummaryRows(payrollData: PayrollSummary): any[] {
    const monthName = formatArabicMonth(payrollData.monthKey);
    
    return [
      { 'البند': 'الشهر', 'القيمة': monthName },
      { 'البند': 'إجمالي الموظفين', 'القيمة': payrollData.totalEmployees },
      { 'البند': 'إجمالي أيام العمل', 'القيمة': payrollData.totalDaysWorked },
      { 'البند': 'إجمالي أيام العمل الإضافي', 'القيمة': payrollData.totalOvertimeDays },
      { 'البند': 'إجمالي أيام العمل في العطل', 'القيمة': payrollData.totalWeekendDays },
      { 'البند': 'إجمالي الرواتب الأساسية', 'القيمة': payrollData.totalBaseSalary },
      { 'البند': 'إجمالي الرواتب المحسوبة', 'القيمة': payrollData.totalCalculatedSalary },
      { 'البند': 'متوسط الراتب', 'القيمة': payrollData.totalEmployees > 0 ? 
        Math.round(payrollData.totalCalculatedSalary / payrollData.totalEmployees) : 0 },
      { 'البند': 'تاريخ التوليد', 'القيمة': new Date().toLocaleDateString('ar-SA') }
    ];
  }

  private static formatColumns(payrollSheet: XLSX.WorkSheet, summarySheet: XLSX.WorkSheet): void {
    // تنسيق أعمدة الرواتب
    const payrollColumns = [
      { wch: 15 }, // رقم الوظيفة
      { wch: 25 }, // اسم الموظف
      { wch: 12 }, // أيام العمل
      { wch: 18 }, // أيام العمل الإضافي
      { wch: 20 }, // أيام العمل في العطل
      { wch: 15 }, // الراتب الأساسي
      { wch: 12 }, // الأجر اليومي
      { wch: 15 }, // إجمالي الراتب
      { wch: 20 }  // ملاحظات
    ];
    
    payrollSheet['!cols'] = payrollColumns;
    
    // تنسيق أعمدة الملخص
    const summaryColumns = [
      { wch: 30 }, // البند
      { wch: 20 }  // القيمة
    ];
    
    summarySheet['!cols'] = summaryColumns;
  }

  static generateTemplateExcel(): void {
    try {
      // إنشاء workbook جديد
      const workbook = XLSX.utils.book_new();
      
      // إنشاء بيانات نموذجية
      const templateRows = [
        {
          'رقم الوظيفة': 'EMP001',
          'اسم الموظف': 'أحمد محمد',
          'أيام العمل': 22,
          'أيام العمل الإضافي': 3,
          'أيام العمل في العطل': 2,
          'الراتب الأساسي': 3000,
          'الأجر اليومي': 100,
          'إجمالي الراتب': 3300,
          'ملاحظات': 'مثال'
        },
        {
          'رقم الوظيفة': 'EMP002',
          'اسم الموظف': 'فاطمة علي',
          'أيام العمل': 20,
          'أيام العمل الإضافي': 1,
          'أيام العمل في العطل': 1,
          'الراتب الأساسي': 2800,
          'الأجر اليومي': 93.33,
          'إجمالي الراتب': 2986.67,
          'ملاحظات': 'مثال'
        }
      ];
      
      // إنشاء ورقة النموذج
      const templateSheet = XLSX.utils.json_to_sheet(templateRows);
      
      // تعيين أسماء الأعمدة
      const headers = [
        'رقم الوظيفة',
        'اسم الموظف',
        'أيام العمل',
        'أيام العمل الإضافي',
        'أيام العمل في العطل',
        'الراتب الأساسي',
        'الأجر اليومي',
        'إجمالي الراتب',
        'ملاحظات'
      ];
      
      XLSX.utils.sheet_add_aoa(templateSheet, [headers], { origin: 'A1' });
      
      // إضافة الورقة إلى الكتاب
      XLSX.utils.book_append_sheet(workbook, templateSheet, 'نموذج كشف الرواتب');
      
      // تنسيق الأعمدة
      const columns = [
        { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 18 },
        { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 20 }
      ];
      templateSheet['!cols'] = columns;
      
      // تنزيل النموذج
      XLSX.writeFile(workbook, 'نموذج_كشف_الرواتب.xlsx');
      
    } catch (error) {
      console.error('خطأ في توليد نموذج Excel:', error);
      throw new Error('فشل في توليد نموذج Excel');
    }
  }

  static validateExcelFile(file: File): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // التحقق من وجود ورقة الرواتب
            const payrollSheet = workbook.Sheets['كشف الرواتب'] || workbook.Sheets[workbook.SheetNames[0]];
            
            if (!payrollSheet) {
              resolve(false);
              return;
            }
            
            // التحقق من وجود البيانات
            const jsonData = XLSX.utils.sheet_to_json(payrollSheet);
            
            if (jsonData.length === 0) {
              resolve(false);
              return;
            }
            
            resolve(true);
          } catch (error) {
            resolve(false);
          }
        };
        
        reader.onerror = () => reject(new Error('خطأ في قراءة الملف'));
        reader.readAsArrayBuffer(file);
        
      } catch (error) {
        reject(error);
      }
    });
  }
}
