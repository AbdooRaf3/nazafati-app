// سكريبت رفع البيانات من Excel محدث للمعادلات الجديدة
import XLSX from 'xlsx';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  collection, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from './firebase-config.mjs';

// الحصول على مسار الملف الحالي
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// تهيئة Firebase
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

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

// دالة لقراءة ملف Excel
function readExcelFile(filePath) {
  try {
    console.log('📖 قراءة ملف Excel...');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`✅ تم قراءة ${data.length} صف من الملف`);
    return data;
  } catch (error) {
    console.error('❌ خطأ في قراءة ملف Excel:', error);
    throw error;
  }
}

// دالة لاستخراج قيمة من صف Excel
function findColumnValue(row, possibleKeys) {
  for (const key of possibleKeys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key].toString().trim();
    }
  }
  return null;
}

// دالة لتحويل البيانات إلى الموظفين
function convertToEmployees(data) {
  console.log('👥 تحويل البيانات إلى موظفين...');
  
  const employees = [];
  const seenJobNumbers = new Set();
  
  for (const row of data) {
    // استخراج البيانات الأساسية
    const jobNumber = findColumnValue(row, [
      'الرقم', 'رقم_الوظيفة', 'jobNumber', 'رقم الوظيفة', 'job_number'
    ]);
    
    const name = findColumnValue(row, [
      'اسم_الموظف', 'name', 'اسم الموظف', 'employee_name'
    ]);
    
    const supervisor = findColumnValue(row, [
      'المراقب', 'supervisor', 'المراقب والمنطقة', 'supervisor_name'
    ]);
    
    if (!jobNumber || !name) {
      console.warn('⚠️  صف بدون رقم أو اسم موظف - سيتم تجاهله');
      continue;
    }
    
    // تجنب تكرار أرقام الوظائف
    if (seenJobNumbers.has(jobNumber)) {
      console.warn(`⚠️  رقم الوظيفة مكرر: ${jobNumber} - سيتم تجاهله`);
      continue;
    }
    seenJobNumbers.add(jobNumber);
    
    // تحديد المنطقة بناءً على المراقب
    let regionId = 'region-default';
    if (supervisor) {
      if (supervisor.includes('ليلى') || supervisor.includes('مالك العايسة')) {
        regionId = 'region-1';
      } else if (supervisor.includes('حنينا') || supervisor.includes('أحمد سعيد الرواجح')) {
        regionId = 'region-2';
      } else if (supervisor.includes('حي الزراعة') || supervisor.includes('أحمد سعيد')) {
        regionId = 'region-3';
      } else if (supervisor.includes('المخيم') || supervisor.includes('حمزة الكراملة')) {
        regionId = 'region-4';
      } else if (supervisor.includes('وسط المدينة') || supervisor.includes('عثمان الرفاعي')) {
        regionId = 'region-5';
      } else if (supervisor.includes('النظافة') || supervisor.includes('أحمد القطيفش')) {
        regionId = 'region-6';
      } else if (supervisor.includes('مراسل')) {
        regionId = 'region-7';
      }
    }
    
    // استخراج الراتب الأساسي
    const baseSalary = Number(findColumnValue(row, [
      'الراتب_الاساسي', 'baseSalary', 'الراتب الأساسي', 'base_salary'
    ]) || 0);
    
    const employee = {
      jobNumber,
      name,
      baseSalary,
      regionId,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    employees.push(employee);
  }
  
  console.log(`✅ تم تحويل ${employees.length} موظف`);
  return employees;
}

// دالة لتحويل البيانات إلى الإدخالات الشهرية
function convertToMonthlyEntries(data, monthKey) {
  console.log('📅 تحويل البيانات إلى إدخالات شهرية...');
  
  const entries = [];
  
  for (const row of data) {
    const jobNumber = findColumnValue(row, [
      'الرقم', 'رقم_الوظيفة', 'jobNumber', 'رقم الوظيفة', 'job_number'
    ]);
    
    const name = findColumnValue(row, [
      'اسم_الموظف', 'name', 'اسم الموظف', 'employee_name'
    ]);
    
    const supervisor = findColumnValue(row, [
      'المراقب', 'supervisor', 'المراقب والمنطقة', 'supervisor_name'
    ]);
    
    if (!jobNumber || !name) {
      console.warn('⚠️  صف بدون رقم أو اسم موظف - سيتم تجاهله');
      continue;
    }
    
    // تحديد المنطقة
    let regionId = 'region-default';
    if (supervisor) {
      if (supervisor.includes('ليلى') || supervisor.includes('مالك العايسة')) {
        regionId = 'region-1';
      } else if (supervisor.includes('حنينا') || supervisor.includes('أحمد سعيد الرواجح')) {
        regionId = 'region-2';
      } else if (supervisor.includes('حي الزراعة') || supervisor.includes('أحمد سعيد')) {
        regionId = 'region-3';
      } else if (supervisor.includes('المخيم') || supervisor.includes('حمزة الكراملة')) {
        regionId = 'region-4';
      } else if (supervisor.includes('وسط المدينة') || supervisor.includes('عثمان الرفاعي')) {
        regionId = 'region-5';
      } else if (supervisor.includes('النظافة') || supervisor.includes('أحمد القطيفش')) {
        regionId = 'region-6';
      } else if (supervisor.includes('مراسل')) {
        regionId = 'region-7';
      }
    }
    
    // استخراج البيانات الرقمية للحقول الجديدة
    const baseSalary = Number(findColumnValue(row, [
      'الراتب_الاساسي', 'baseSalary', 'الراتب الأساسي', 'base_salary'
    ]) || 0);
    
    const daysInMonth = Number(findColumnValue(row, [
      'أيام_الشهر', 'daysInMonth', 'أيام الشهر', 'days_in_month', 'عدد_أيام_الشهر'
    ]) || 31);
    
    const holidays = Number(findColumnValue(row, [
      'العطل', 'holidays', 'عدد_العطل', 'holidays_count'
    ]) || 0);
    
    const fridaysAndHolidays = Number(findColumnValue(row, [
      'الجمع_والعطل', 'fridaysAndHolidays', 'الجمع والعطل', 'fridays_and_holidays'
    ]) || 0);
    
    const overtimeAfterReference = Number(findColumnValue(row, [
      'الإضافي_بعد_المرجع', 'overtimeAfterReference', 'الإضافي بعد المرجع', 'overtime_after_reference'
    ]) || 0);
    
    // حساب الراتب باستخدام المعادلات الجديدة
    const salaryCalculations = calculateSalaryWithNewFormulas(
      baseSalary,
      daysInMonth,
      holidays,
      fridaysAndHolidays,
      overtimeAfterReference
    );
    
    const totals = {
      dailyWage: baseSalary / daysInMonth,
      total: salaryCalculations.netSalary,
      totalOvertime: salaryCalculations.totalOvertime,
      totalSalary: salaryCalculations.totalSalary,
      netSalary: salaryCalculations.netSalary
    };
    
    const entry = {
      employeeId: jobNumber,
      monthKey,
      // الحقول الجديدة
      daysInMonth,
      holidays,
      fridaysAndHolidays,
      overtimeAfterReference,
      // الحقول القديمة (للتوافق)
      daysWorked: 0,
      overtimeDays: 0,
      weekendDays: 0,
      regionId,
      submittedBy: 'excel-import',
      status: 'submitted',
      totals,
      notes: findColumnValue(row, ['ملاحظات', 'notes', 'ملاحظة']) || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    entries.push(entry);
    
    console.log(`📊 ${name} (${jobNumber}):`);
    console.log(`   إجمالي الإضافي: ${salaryCalculations.totalOvertime}`);
    console.log(`   إجمالي الراتب: ${salaryCalculations.totalSalary}`);
    console.log(`   صافي الراتب: ${salaryCalculations.netSalary}`);
  }
  
  console.log(`✅ تم تحويل ${entries.length} إدخال شهري`);
  return entries;
}

// دالة لإنشاء المراقبين
function createSupervisors() {
  console.log('👨‍💼 إنشاء المراقبين...');
  
  const supervisors = [
    {
      uid: 'supervisor-1',
      name: 'ليلى - مالك العايسة',
      email: 'laila@nazafati.com',
      role: 'supervisor',
      regionId: 'region-1',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      uid: 'supervisor-2',
      name: 'حنينا - أحمد سعيد الرواجح',
      email: 'hanina@nazafati.com',
      role: 'supervisor',
      regionId: 'region-2',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      uid: 'supervisor-3',
      name: 'حي الزراعة - أحمد سعيد',
      email: 'agriculture@nazafati.com',
      role: 'supervisor',
      regionId: 'region-3',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      uid: 'supervisor-4',
      name: 'المخيم - حمزة الكراملة',
      email: 'camp@nazafati.com',
      role: 'supervisor',
      regionId: 'region-4',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      uid: 'supervisor-5',
      name: 'وسط المدينة - عثمان الرفاعي',
      email: 'city-center@nazafati.com',
      role: 'supervisor',
      regionId: 'region-5',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      uid: 'supervisor-6',
      name: 'النظافة - أحمد القطيفش',
      email: 'cleaning@nazafati.com',
      role: 'supervisor',
      regionId: 'region-6',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      uid: 'supervisor-7',
      name: 'المراسلين',
      email: 'messengers@nazafati.com',
      role: 'supervisor',
      regionId: 'region-7',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  ];
  
  return supervisors;
}

// دالة لإضافة الموظفين إلى Firestore
async function addEmployeesToFirestore(employees) {
  console.log('💾 إضافة الموظفين إلى Firestore...');
  
  for (const employee of employees) {
    try {
      // التحقق من عدم وجود موظف بنفس رقم الوظيفة
      const existingQuery = query(
        collection(db, 'employees'), 
        where('jobNumber', '==', employee.jobNumber)
      );
      const existingDocs = await getDocs(existingQuery);
      
      if (existingDocs.empty) {
        await addDoc(collection(db, 'employees'), employee);
        console.log(`✅ تم إضافة الموظف: ${employee.name} (${employee.jobNumber})`);
      } else {
        console.log(`⚠️  الموظف موجود مسبقاً: ${employee.name} (${employee.jobNumber})`);
      }
    } catch (error) {
      console.error(`❌ خطأ في إضافة الموظف ${employee.name}:`, error);
    }
  }
}

// دالة لإضافة الإدخالات الشهرية إلى Firestore
async function addMonthlyEntriesToFirestore(entries) {
  console.log('💾 إضافة الإدخالات الشهرية إلى Firestore...');
  
  for (const entry of entries) {
    try {
      const entryId = `${entry.monthKey}_${entry.employeeId}`;
      
      // التحقق من عدم وجود إدخال بنفس المعرف
      const existingDoc = await getDocs(query(
        collection(db, 'monthly-entries'),
        where('employeeId', '==', entry.employeeId),
        where('monthKey', '==', entry.monthKey)
      ));
      
      if (existingDoc.empty) {
        await setDoc(doc(db, 'monthly-entries', entryId), entry);
        console.log(`✅ تم إضافة الإدخال: ${entry.employeeId} - ${entry.monthKey}`);
      } else {
        console.log(`⚠️  الإدخال موجود مسبقاً: ${entry.employeeId} - ${entry.monthKey}`);
      }
    } catch (error) {
      console.error(`❌ خطأ في إضافة الإدخال ${entry.employeeId}:`, error);
    }
  }
}

// دالة لإضافة المراقبين إلى Firestore
async function addSupervisorsToFirestore(supervisors) {
  console.log('💾 إضافة المراقبين إلى Firestore...');
  
  for (const supervisor of supervisors) {
    try {
      await setDoc(doc(db, 'users', supervisor.uid), supervisor);
      console.log(`✅ تم إضافة المراقب: ${supervisor.name}`);
    } catch (error) {
      console.error(`❌ خطأ في إضافة المراقب ${supervisor.name}:`, error);
    }
  }
}

// الدالة الرئيسية
async function importExcelData(filePath, monthKey) {
  try {
    console.log('🚀 بدء استيراد البيانات من Excel...');
    console.log(`📁 ملف Excel: ${filePath}`);
    console.log(`📅 الشهر: ${monthKey}`);
    
    // تسجيل الدخول كضيف
    await signInAnonymously(auth);
    console.log('✅ تم تسجيل الدخول إلى Firebase');
    
    // قراءة ملف Excel
    const excelData = readExcelFile(filePath);
    
    // تحويل البيانات
    const employees = convertToEmployees(excelData);
    const monthlyEntries = convertToMonthlyEntries(excelData, monthKey);
    const supervisors = createSupervisors();
    
    // إضافة البيانات إلى Firestore
    await addEmployeesToFirestore(employees);
    await addMonthlyEntriesToFirestore(monthlyEntries);
    await addSupervisorsToFirestore(supervisors);
    
    console.log('\n🎉 تم استيراد جميع البيانات بنجاح!');
    console.log('=====================================');
    console.log(`📊 ملخص الاستيراد:`);
    console.log(`   👥 عدد الموظفين: ${employees.length}`);
    console.log(`   📅 عدد الإدخالات الشهرية: ${monthlyEntries.length}`);
    console.log(`   👨‍💼 عدد المراقبين: ${supervisors.length}`);
    
    console.log('\n💡 ملاحظات:');
    console.log('   - تم استخدام المعادلات الجديدة لحساب الرواتب');
    console.log('   - تم إضافة الحقول الجديدة: holidays, fridaysAndHolidays, overtimeAfterReference, daysInMonth');
    console.log('   - تم حساب: totalOvertime, totalSalary, netSalary');
    
  } catch (error) {
    console.error('💥 خطأ في استيراد البيانات:', error);
    process.exit(1);
  }
}

// تشغيل السكريبت
const args = process.argv.slice(2);
const filePath = args[0];
const monthKey = args[1] || new Date().toISOString().slice(0, 7); // YYYY-MM

if (!filePath) {
  console.error('❌ يرجى تحديد مسار ملف Excel');
  console.log('📝 مثال: node scripts/import-excel-updated.mjs ./data.xlsx 2025-01');
  console.log('📝 مثال: node scripts/import-excel-updated.mjs ./8-2025.xlsx 2025-08');
  process.exit(1);
}

importExcelData(filePath, monthKey);
