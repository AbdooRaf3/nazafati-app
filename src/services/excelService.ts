import * as ExcelJS from 'exceljs';
import { PayrollSummary } from './payrollService';
import { formatArabicMonth } from '../utils/formatDate';
import { formatCurrency, formatCurrencyValue } from '../constants/currency';

export class ExcelService {
  static async generateAndDownloadExcel(monthKey: string, payrollData: PayrollSummary): Promise<void> {
    try {
      // إنشاء workbook جديد
      const workbook = new ExcelJS.Workbook();
      
      // إنشاء ورقة الرواتب
      const payrollSheet = workbook.addWorksheet('كشف الرواتب');
      
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
      
      // إضافة العناوين
      payrollSheet.addRow(headers);
      
      // تنسيق العناوين
      const headerRow = payrollSheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      // إضافة بيانات الرواتب
      const payrollRows = this.createPayrollRows(payrollData);
      payrollRows.forEach(row => {
        payrollSheet.addRow([
          row['رقم الوظيفة'],
          row['اسم الموظف'],
          row['أيام العمل'],
          row['أيام العمل الإضافي'],
          row['أيام العمل في العطل'],
          row['الراتب الأساسي'],
          row['الأجر اليومي'],
          row['إجمالي الراتب'],
          row['ملاحظات']
        ]);
      });
      
      // إنشاء ورقة الملخص
      const summarySheet = workbook.addWorksheet('ملخص الرواتب');
      
      // إضافة عناوين الملخص
      summarySheet.addRow(['البند', 'القيمة']);
      const summaryHeaderRow = summarySheet.getRow(1);
      summaryHeaderRow.font = { bold: true };
      summaryHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      // إضافة بيانات الملخص
      const summaryRows = this.createSummaryRows(payrollData);
      summaryRows.forEach(row => {
        summarySheet.addRow([row['البند'], row['القيمة']]);
      });
      
      // تنسيق الأعمدة
      this.formatColumns(payrollSheet, summarySheet);
      
      // إنشاء اسم الملف
      const fileName = `كشف_رواتب_${monthKey}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // تنزيل الملف
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
      
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
      'الراتب الأساسي': formatCurrencyValue(row.baseSalary),
      'الأجر اليومي': formatCurrencyValue(row.dailyWage),
      'إجمالي الراتب': formatCurrencyValue(row.total),
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
      { 'البند': 'إجمالي الرواتب الأساسية', 'القيمة': formatCurrencyValue(payrollData.totalBaseSalary) },
      { 'البند': 'إجمالي الرواتب المحسوبة', 'القيمة': formatCurrencyValue(payrollData.totalCalculatedSalary) },
      { 'البند': 'متوسط الراتب', 'القيمة': payrollData.totalEmployees > 0 ? 
        formatCurrencyValue(payrollData.totalCalculatedSalary / payrollData.totalEmployees) : '0.00' },
      { 'البند': 'تاريخ التوليد', 'القيمة': new Date().toLocaleDateString('ar-JO') }
    ];
  }

  private static formatColumns(payrollSheet: ExcelJS.Worksheet, summarySheet: ExcelJS.Worksheet): void {
    // تنسيق أعمدة الرواتب
    payrollSheet.columns = [
      { width: 15 }, // رقم الوظيفة
      { width: 25 }, // اسم الموظف
      { width: 12 }, // أيام العمل
      { width: 18 }, // أيام العمل الإضافي
      { width: 20 }, // أيام العمل في العطل
      { width: 15 }, // الراتب الأساسي
      { width: 12 }, // الأجر اليومي
      { width: 15 }, // إجمالي الراتب
      { width: 20 }  // ملاحظات
    ];
    
    // تنسيق أعمدة الملخص
    summarySheet.columns = [
      { width: 30 }, // البند
      { width: 20 }  // القيمة
    ];
  }

  static async generateTemplateExcel(): Promise<void> {
    try {
      // إنشاء workbook جديد
      const workbook = new ExcelJS.Workbook();
      
      // إنشاء ورقة النموذج
      const templateSheet = workbook.addWorksheet('نموذج كشف الرواتب');
      
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
      
      // إضافة العناوين
      templateSheet.addRow(headers);
      
      // تنسيق العناوين
      const headerRow = templateSheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      // إضافة بيانات نموذجية
      const templateRows = [
        ['EMP001', 'أحمد محمد', 22, 3, 2, formatCurrencyValue(3000), formatCurrencyValue(100), formatCurrencyValue(3300), 'مثال'],
        ['EMP002', 'فاطمة علي', 20, 1, 1, formatCurrencyValue(2800), formatCurrencyValue(93.33), formatCurrencyValue(2986.67), 'مثال']
      ];
      
      templateRows.forEach(row => {
        templateSheet.addRow(row);
      });
      
      // تنسيق الأعمدة
      templateSheet.columns = [
        { width: 15 }, { width: 25 }, { width: 12 }, { width: 18 },
        { width: 20 }, { width: 15 }, { width: 12 }, { width: 15 }, { width: 20 }
      ];
      
      // تنزيل النموذج
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'نموذج_كشف_الرواتب.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('خطأ في توليد نموذج Excel:', error);
      throw new Error('فشل في توليد نموذج Excel');
    }
  }

  static validateExcelFile(file: File): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(data);
            
            // التحقق من وجود ورقة الرواتب
            const payrollSheet = workbook.getWorksheet('كشف الرواتب') || workbook.worksheets[0];
            
            if (!payrollSheet) {
              resolve(false);
              return;
            }
            
            // التحقق من وجود البيانات (أكثر من صف واحد - العناوين)
            if (payrollSheet.rowCount <= 1) {
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
