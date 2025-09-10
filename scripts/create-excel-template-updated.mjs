// سكريبت إنشاء ملف Excel نموذجي بالحقول الجديدة
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// الحصول على مسار الملف الحالي
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('📊 إنشاء ملف Excel نموذجي بالحقول الجديدة...');
console.log('============================================');

// بيانات نموذجية للموظفين
const sampleData = [
  {
    'الرقم': '946',
    'اسم الموظف': 'عناه محمد شحاته محمد',
    'المراقب': 'عثمان الرفاعي',
    'الراتب الأساسي': 8.25,
    'أيام الشهر': 31,
    'العطل': 1,
    'الجمع والعطل': 4,
    'الإضافي بعد المرجع': 1,
    'ملاحظات': ''
  },
  {
    'الرقم': '947',
    'اسم الموظف': 'أحمد محمد علي',
    'المراقب': 'عثمان الرفاعي',
    'الراتب الأساسي': 9.50,
    'أيام الشهر': 31,
    'العطل': 2,
    'الجمع والعطل': 3,
    'الإضافي بعد المرجع': 2,
    'ملاحظات': 'موظف جديد'
  },
  {
    'الرقم': '948',
    'اسم الموظف': 'فاطمة أحمد السعيد',
    'المراقب': 'ليلى - مالك العايسة',
    'الراتب الأساسي': 7.75,
    'أيام الشهر': 30,
    'العطل': 0,
    'الجمع والعطل': 2,
    'الإضافي بعد المرجع': 1,
    'ملاحظات': ''
  },
  {
    'الرقم': '949',
    'اسم الموظف': 'محمد عبدالله القحطاني',
    'المراقب': 'حنينا - أحمد سعيد الرواجح',
    'الراتب الأساسي': 10.25,
    'أيام الشهر': 31,
    'العطل': 1,
    'الجمع والعطل': 5,
    'الإضافي بعد المرجع': 3,
    'ملاحظات': 'عمل إضافي'
  },
  {
    'الرقم': '950',
    'اسم الموظف': 'نورا سعد المطيري',
    'المراقب': 'حي الزراعة - أحمد سعيد',
    'الراتب الأساسي': 8.75,
    'أيام الشهر': 31,
    'العطل': 0,
    'الجمع والعطل': 1,
    'الإضافي بعد المرجع': 0,
    'ملاحظات': ''
  }
];

// دالة لحساب الراتب باستخدام المعادلات الجديدة
function calculateSalaryWithNewFormulas(baseSalary, daysInMonth, holidays, fridaysAndHolidays, overtimeAfterReference) {
  // totalOvertime = (D2*I2*0.5) + (E2*I2) + (F2*I2)
  const totalOvertime = (holidays * baseSalary * 0.5) + 
                       (fridaysAndHolidays * baseSalary) + 
                       (overtimeAfterReference * baseSalary);
  
  // totalSalary = C2*I2
  const totalSalary = daysInMonth * baseSalary;
  
  // netSalary = L2 + K2
  const netSalary = totalSalary + totalOvertime;
  
  return {
    totalOvertime: Math.round(totalOvertime * 1000) / 1000,
    totalSalary: Math.round(totalSalary * 1000) / 1000,
    netSalary: Math.round(netSalary * 1000) / 1000
  };
}

// إضافة الحسابات إلى البيانات
const dataWithCalculations = sampleData.map(row => {
  const calculations = calculateSalaryWithNewFormulas(
    row['الراتب الأساسي'],
    row['أيام الشهر'],
    row['العطل'],
    row['الجمع والعطل'],
    row['الإضافي بعد المرجع']
  );
  
  return {
    ...row,
    'إجمالي الإضافي': calculations.totalOvertime,
    'إجمالي الراتب': calculations.totalSalary,
    'صافي الراتب': calculations.netSalary
  };
});

// إنشاء ورقة عمل
const worksheet = XLSX.utils.json_to_sheet(dataWithCalculations);

// تنسيق الأعمدة
const columnWidths = [
  { wch: 8 },   // الرقم
  { wch: 25 },  // اسم الموظف
  { wch: 20 },  // المراقب
  { wch: 12 },  // الراتب الأساسي
  { wch: 10 },  // أيام الشهر
  { wch: 8 },   // العطل
  { wch: 12 },  // الجمع والعطل
  { wch: 15 },  // الإضافي بعد المرجع
  { wch: 12 },  // إجمالي الإضافي
  { wch: 12 },  // إجمالي الراتب
  { wch: 12 },  // صافي الراتب
  { wch: 15 }   // ملاحظات
];

worksheet['!cols'] = columnWidths;

// إنشاء مصنف
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'الرواتب');

// حفظ الملف
const outputPath = join(__dirname, 'excel-template-updated.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log('✅ تم إنشاء ملف Excel النموذجي بنجاح!');
console.log(`📁 مسار الملف: ${outputPath}`);
console.log('\n📋 الأعمدة المتضمنة:');
console.log('   - الرقم');
console.log('   - اسم الموظف');
console.log('   - المراقب');
console.log('   - الراتب الأساسي');
console.log('   - أيام الشهر');
console.log('   - العطل');
console.log('   - الجمع والعطل');
console.log('   - الإضافي بعد المرجع');
console.log('   - إجمالي الإضافي (محسوب)');
console.log('   - إجمالي الراتب (محسوب)');
console.log('   - صافي الراتب (محسوب)');
console.log('   - ملاحظات');

console.log('\n🧮 المعادلات المستخدمة:');
console.log('   إجمالي الإضافي = (العطل × الراتب الأساسي × 0.5) + (الجمع والعطل × الراتب الأساسي) + (الإضافي بعد المرجع × الراتب الأساسي)');
console.log('   إجمالي الراتب = أيام الشهر × الراتب الأساسي');
console.log('   صافي الراتب = إجمالي الراتب + إجمالي الإضافي');

console.log('\n💡 يمكنك الآن:');
console.log('   1. فتح الملف وتعديل البيانات');
console.log('   2. إضافة موظفين جدد');
console.log('   3. استخدام السكريبت لرفع البيانات: node scripts/import-excel-updated.mjs excel-template-updated.xlsx 2025-01');
