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

// الحصول على مسار الملف الحالي
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// استيراد تكوين Firebase
import { firebaseConfig } from './firebase-config.mjs';

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// دالة لقراءة ملف Excel
function readExcelFile(filePath) {
  try {
    console.log('قراءة ملف Excel...');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // أول ورقة
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`تم قراءة ${data.length} صف من الملف`);
    return data;
  } catch (error) {
    console.error('خطأ في قراءة ملف Excel:', error);
    throw error;
  }
}

// دالة لتحويل البيانات إلى الموظفين
function convertToEmployees(data) {
  console.log('تحويل البيانات إلى موظفين...');
  
  const employees = [];
  const seenJobNumbers = new Set();
  
  for (const row of data) {
    // توقع أسماء الأعمدة الجديدة - بناءً على التنسيق الفعلي من الصورة
    const jobNumber = row['الرقم'] || row['رقم_الوظيفة'] || row['jobNumber'] || `EMP${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const name = row['اسم_الموظف'] || row['name'] || row['اسم الموظف'] || 'غير محدد';
    const supervisorRegion = row['المراقب_والمنطقة'] || row['المنطقة'] || row['region'] || 'المنطقة الافتراضية';
    
    // تجنب تكرار أرقام الوظائف
    if (seenJobNumbers.has(jobNumber)) {
      console.warn(`رقم الوظيفة مكرر: ${jobNumber} - سيتم تجاهله`);
      continue;
    }
    seenJobNumbers.add(jobNumber);
    
    // تحديد المنطقة بناءً على المراقب والمنطقة
    let regionId = 'region-default';
    if (supervisorRegion && supervisorRegion.includes('ليلى')) {
      regionId = 'region-1'; // ليلى - مالك العايسة
    } else if (supervisorRegion && supervisorRegion.includes('حنينا')) {
      regionId = 'region-2'; // حنينا - أحمد سعيد الرواجح
    } else if (supervisorRegion && supervisorRegion.includes('حي الزراعة')) {
      regionId = 'region-3'; // حي الزراعة - أحمد سعيد
    } else if (supervisorRegion && supervisorRegion.includes('المخيم')) {
      regionId = 'region-4'; // المخيم - حمزة الكراملة
    } else if (supervisorRegion && supervisorRegion.includes('وسط المدينة')) {
      regionId = 'region-5'; // وسط المدينة - عثمان الرفاعي
    } else if (supervisorRegion && supervisorRegion.includes('النظافة')) {
      regionId = 'region-6'; // النظافة - أحمد القطيفش
    } else if (supervisorRegion && supervisorRegion.includes('مراسل')) {
      regionId = 'region-7'; // المراسلين
    }
    
    // حساب الراتب الأساسي
    const baseSalary = row['الراتب_الاساسي'] || row['baseSalary'] || row['الراتب الأساسي'] || 9;
    
    const employee = {
      jobNumber,
      name,
      baseSalary: Number(baseSalary),
      regionId,
      supervisorRegion,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    employees.push(employee);
  }
  
  console.log(`تم تحويل ${employees.length} موظف`);
  return employees;
}

// دالة لتحويل البيانات إلى الإدخالات الشهرية
function convertToMonthlyEntries(data, monthKey) {
  console.log('تحويل البيانات إلى إدخالات شهرية...');
  
  const entries = [];
  
  for (const row of data) {
    const jobNumber = row['الرقم'] || row['رقم_الوظيفة'] || row['jobNumber'] || row['رقم الوظيفة'];
    const name = row['اسم_الموظف'] || row['name'] || row['اسم الموظف'];
    const supervisorRegion = row['المراقب_والمنطقة'] || row['المنطقة'] || row['region'] || row['regionName'];
    
    if (!jobNumber || !name) {
      console.warn('صف بدون رقم أو اسم موظف - سيتم تجاهله');
      continue;
    }
    
    // تحديد المنطقة بناءً على المراقب والمنطقة
    let regionId = 'region-default';
    if (supervisorRegion && supervisorRegion.includes('ليلى')) {
      regionId = 'region-1'; // ليلى - مالك العايسة
    } else if (supervisorRegion && supervisorRegion.includes('حنينا')) {
      regionId = 'region-2'; // حنينا - أحمد سعيد الرواجح
    } else if (supervisorRegion && supervisorRegion.includes('حي الزراعة')) {
      regionId = 'region-3'; // حي الزراعة - أحمد سعيد
    } else if (supervisorRegion && supervisorRegion.includes('المخيم')) {
      regionId = 'region-4'; // المخيم - حمزة الكراملة
    } else if (supervisorRegion && supervisorRegion.includes('وسط المدينة')) {
      regionId = 'region-5'; // وسط المدينة - عثمان الرفاعي
    } else if (supervisorRegion && supervisorRegion.includes('النظافة')) {
      regionId = 'region-6'; // النظافة - أحمد القطيفش
    } else if (supervisorRegion && supervisorRegion.includes('مراسل')) {
      regionId = 'region-7'; // المراسلين
    }
    
    // استخراج البيانات الرقمية - بناءً على التنسيق الجديد
    const daysWorked = Number(row['عدد_ايام_العمل'] || row['ايام_العمل'] || row['daysWorked'] || row['أيام العمل'] || row['ايام العمل'] || 0);
    const overtimeDays = Number(row['الاضافي_بعد_العطل_والدوام'] || row['ايام_الاضافي'] || row['overtimeDays'] || row['أيام الإضافي'] || row['ايام الاضافي'] || 0);
    const weekendDays = Number(row['الاعياد'] || row['ايام_العطل'] || row['weekendDays'] || row['أيام العطل'] || row['ايام العطل'] || 0);
    
    // حساب الأجر اليومي
    const baseSalary = Number(row['الراتب_الاساسي'] || row['baseSalary'] || row['الراتب الأساسي'] || 9);
    const dailyWage = baseSalary;
    
    // استخدام القيم المحسوبة مسبقاً من Excel أو حسابها
    const totalFromExcel = Number(row['مجموع_الراتب']) || 0;
    const overtimeFromExcel = Number(row['مجموع_الاضافي']) || 0;
    
    // حساب إجمالي الراتب
    const calculatedTotal = (dailyWage * daysWorked) + 
                           (dailyWage * 1.5 * overtimeDays) + 
                           (dailyWage * 2 * weekendDays);
    
    const total = totalFromExcel > 0 ? totalFromExcel : calculatedTotal;
    
    const entry = {
      employeeId: jobNumber,
      monthKey,
      daysWorked,
      overtimeDays,
      weekendDays,
      regionId,
      supervisorRegion,
      submittedBy: 'excel-import',
      status: 'submitted',
      totals: {
        dailyWage,
        total: Math.round(total),
        overtimeTotal: overtimeFromExcel > 0 ? overtimeFromExcel : (dailyWage * 1.5 * overtimeDays)
      },
      notes: row['ملاحظات'] || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    entries.push(entry);
  }
  
  console.log(`تم تحويل ${entries.length} إدخال شهري`);
  return entries;
}

// دالة لإنشاء المراقبين
function createSupervisors() {
  console.log('إنشاء المراقبين...');
  
  const supervisors = [
    {
      uid: 'supervisor-1',
      name: 'ليلى - مالك العايسة',
      email: 'laila@nazafati.com',
      role: 'supervisor',
      regionId: 'region-1',
      regionName: 'ليلى',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      uid: 'supervisor-2',
      name: 'حنينا - أحمد سعيد الرواجح',
      email: 'hanina@nazafati.com',
      role: 'supervisor',
      regionId: 'region-2',
      regionName: 'حنينا',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      uid: 'supervisor-3',
      name: 'حي الزراعة - أحمد سعيد',
      email: 'agriculture@nazafati.com',
      role: 'supervisor',
      regionId: 'region-3',
      regionName: 'حي الزراعة',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      uid: 'supervisor-4',
      name: 'المخيم - حمزة الكراملة',
      email: 'camp@nazafati.com',
      role: 'supervisor',
      regionId: 'region-4',
      regionName: 'المخيم',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      uid: 'supervisor-5',
      name: 'وسط المدينة - عثمان الرفاعي',
      email: 'city-center@nazafati.com',
      role: 'supervisor',
      regionId: 'region-5',
      regionName: 'وسط المدينة',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      uid: 'supervisor-6',
      name: 'النظافة - أحمد القطيفش',
      email: 'cleaning@nazafati.com',
      role: 'supervisor',
      regionId: 'region-6',
      regionName: 'النظافة',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      uid: 'supervisor-7',
      name: 'المراسلين',
      email: 'messengers@nazafati.com',
      role: 'supervisor',
      regionId: 'region-7',
      regionName: 'المراسلين',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  ];
  
  return supervisors;
}

// دالة لإضافة الموظفين إلى Firestore
async function addEmployeesToFirestore(employees) {
  console.log('إضافة الموظفين إلى Firestore...');
  
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
        console.log(`تم إضافة الموظف: ${employee.name} (${employee.jobNumber})`);
      } else {
        console.log(`الموظف موجود مسبقاً: ${employee.name} (${employee.jobNumber})`);
      }
    } catch (error) {
      console.error(`خطأ في إضافة الموظف ${employee.name}:`, error);
    }
  }
}

// دالة لإضافة الإدخالات الشهرية إلى Firestore
async function addMonthlyEntriesToFirestore(entries) {
  console.log('إضافة الإدخالات الشهرية إلى Firestore...');
  
  for (const entry of entries) {
    try {
      const entryId = `${entry.monthKey}_${entry.employeeId}`;
      
      // التحقق من عدم وجود إدخال بنفس المعرف
      const existingDoc = await getDocs(query(
        collection(db, 'monthlyEntries'),
        where('employeeId', '==', entry.employeeId),
        where('monthKey', '==', entry.monthKey)
      ));
      
      if (existingDoc.empty) {
        await setDoc(doc(db, 'monthlyEntries', entryId), entry);
        console.log(`تم إضافة الإدخال: ${entry.employeeId} - ${entry.monthKey}`);
      } else {
        console.log(`الإدخال موجود مسبقاً: ${entry.employeeId} - ${entry.monthKey}`);
      }
    } catch (error) {
      console.error(`خطأ في إضافة الإدخال ${entry.employeeId}:`, error);
    }
  }
}

// دالة لإضافة المراقبين إلى Firestore
async function addSupervisorsToFirestore(supervisors) {
  console.log('إضافة المراقبين إلى Firestore...');
  
  for (const supervisor of supervisors) {
    try {
      await setDoc(doc(db, 'users', supervisor.uid), supervisor);
      console.log(`تم إضافة المراقب: ${supervisor.name}`);
    } catch (error) {
      console.error(`خطأ في إضافة المراقب ${supervisor.name}:`, error);
    }
  }
}

// الدالة الرئيسية
async function importExcelData(filePath, monthKey) {
  try {
    console.log('بدء استيراد البيانات من Excel...');
    
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
    
    console.log('تم استيراد جميع البيانات بنجاح!');
    console.log(`\nملخص الاستيراد:`);
    console.log(`- عدد الموظفين: ${employees.length}`);
    console.log(`- عدد الإدخالات الشهرية: ${monthlyEntries.length}`);
    console.log(`- عدد المراقبين: ${supervisors.length}`);
    
  } catch (error) {
    console.error('خطأ في استيراد البيانات:', error);
  }
}

// تشغيل السكريبت
const args = process.argv.slice(2);
const filePath = args[0];
const monthKey = args[1] || new Date().toISOString().slice(0, 7); // YYYY-MM

if (!filePath) {
  console.error('يرجى تحديد مسار ملف Excel');
  console.log('مثال: node scripts/import-excel.mjs ./data.xlsx 2024-09');
  process.exit(1);
}

importExcelData(filePath, monthKey);
