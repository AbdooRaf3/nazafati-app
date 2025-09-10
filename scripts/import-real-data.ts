import * as XLSX from 'xlsx';
import * as fs from 'fs';
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

// إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyByHh2_r9j1npQ-DQyaye9bbge4lEX5Go8",
  authDomain: "nazafati-system.firebaseapp.com",
  projectId: "nazafati-system",
  storageBucket: "nazafati-system.firebasestorage.app",
  messagingSenderId: "233027790289",
  appId: "1:233027790289:web:269414e8ed8f3091b5ecf0",
  measurementId: "G-MTQ23LS55N"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// واجهات البيانات
interface ExcelRow {
  [key: string]: any;
}

interface Employee {
  jobNumber: string;
  name: string;
  baseSalary: number;
  regionId: string;
  status: 'active' | 'inactive';
  // حقول العمل الإضافي
  daysInMonthReference: number; // عدد أيام العمل المرجعية في الشهر
  overtimeAfterWork: number; // عدد أيام العمل الإضافي بعد الدوام
  fridaysAndHolidays: number; // عدد أيام العمل في الجمع والعطل الرسمية
  holidays: number; // عدد أيام العمل خلال الأعياد
  supervisor: string; // اسم المراقب
  createdAt: any;
  updatedAt: any;
}

interface User {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'finance';
  regionId?: string;
  createdAt: any;
  updatedAt: any;
}

interface Region {
  id: string;
  name: string;
  description: string;
  createdAt: any;
  updatedAt: any;
}

// دالة لقراءة ملف Excel
function readExcelFile(filePath: string): ExcelRow[] {
  try {
    console.log('قراءة ملف Excel...');
    
    // قراءة الملف باستخدام fs
    const fileBuffer = fs.readFileSync(filePath);
    
    // قراءة ملف Excel باستخدام XLSX.read
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[];
    
    console.log(`تم قراءة ${data.length} صف من الملف`);
    console.log('أسماء الأعمدة الموجودة:', Object.keys(data[0] || {}));
    return data;
  } catch (error) {
    console.error('خطأ في قراءة ملف Excel:', error);
    throw error;
  }
}

// دالة لإنشاء المناطق
function createRegions(): Region[] {
  console.log('إنشاء المناطق...');
  
  const regions: Region[] = [
    {
      id: 'region-1',
      name: 'المنطقة الشمالية',
      description: 'منطقة شمال مادبا',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      id: 'region-2',
      name: 'المنطقة الجنوبية',
      description: 'منطقة جنوب مادبا',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      id: 'region-3',
      name: 'المنطقة الشرقية',
      description: 'منطقة شرق مادبا',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      id: 'region-4',
      name: 'المنطقة الغربية',
      description: 'منطقة غرب مادبا',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  ];
  
  return regions;
}

// دالة لتحويل البيانات إلى الموظفين
function convertToEmployees(data: ExcelRow[]): Employee[] {
  console.log('تحويل البيانات إلى موظفين...');
  
  const employees: Employee[] = [];
  const seenJobNumbers = new Set<string>();
  
  for (const row of data) {
    // البحث عن أسماء الأعمدة المختلفة
    const jobNumber = findColumnValue(row, ['رقم_الوظيفة', 'jobNumber', 'رقم الوظيفة', 'الرقم الوظيفي', 'رقم الوظيفي']);
    const name = findColumnValue(row, ['اسم_الموظف', 'name', 'اسم الموظف', 'الاسم', 'اسم العامل']);
    const regionName = findColumnValue(row, ['المنطقة', 'region', 'regionName', 'المنطقة المخصصة', 'supervisor']);
    const salary = findColumnValue(row, ['الراتب_الاساسي', 'baseSalary', 'الراتب الأساسي', 'الراتب', 'الراتب الشهري']);
    
    // حقول العمل الإضافي
    const daysInMonthReference = findColumnValue(row, ['daysInMonthReference', 'عدد_ايام_العمل', 'عدد أيام العمل']);
    const overtimeAfterWork = findColumnValue(row, ['overtimeAfterWork', 'الإضافي_بعد_الدوام', 'الإضافي بعد الدوام']);
    const fridaysAndHolidays = findColumnValue(row, ['fridaysAndHolidays', 'الجمع_والعطل', 'الجمع والعطل']);
    const holidays = findColumnValue(row, ['holidays', 'الأعياد', 'العطل']);
    const supervisor = findColumnValue(row, ['supervisor', 'المراقب', 'المراقب والمنطقة']);
    
    if (!jobNumber || !name) {
      console.warn('صف بدون رقم وظيفة أو اسم - سيتم تجاهله:', row);
      continue;
    }
    
    // تجنب تكرار أرقام الوظائف
    if (seenJobNumbers.has(jobNumber)) {
      console.warn(`رقم الوظيفة مكرر: ${jobNumber} - سيتم تجاهله`);
      continue;
    }
    seenJobNumbers.add(jobNumber);
    
    // تحديد المنطقة بناءً على regionId من البيانات أو توزيع عشوائي
    let regionId = 'region-1'; // افتراضي
    const regionIdFromData = findColumnValue(row, ['regionId', 'المنطقة_المعرف', 'معرف المنطقة']);
    
    if (regionIdFromData) {
      regionId = regionIdFromData;
    } else if (regionName) {
      if (regionName.includes('شمال') || regionName.includes('north') || regionName.includes('1')) {
        regionId = 'region-1';
      } else if (regionName.includes('جنوب') || regionName.includes('south') || regionName.includes('2')) {
        regionId = 'region-2';
      } else if (regionName.includes('شرق') || regionName.includes('east') || regionName.includes('3')) {
        regionId = 'region-3';
      } else if (regionName.includes('غرب') || regionName.includes('west') || regionName.includes('4')) {
        regionId = 'region-4';
      } else {
        // توزيع عشوائي على المناطق
        const regions = ['region-1', 'region-2', 'region-3', 'region-4'];
        regionId = regions[Math.floor(Math.random() * regions.length)];
      }
    } else {
      // توزيع عشوائي على المناطق
      const regions = ['region-1', 'region-2', 'region-3', 'region-4'];
      regionId = regions[Math.floor(Math.random() * regions.length)];
    }
    
    // حساب الراتب الأساسي
    const baseSalary = salary ? Number(salary) : 3000; // افتراضي 3000 دينار
    
    // تحويل قيم العمل الإضافي إلى أرقام
    const daysInMonthRef = daysInMonthReference ? Number(daysInMonthReference) : 30;
    const overtimeAfter = overtimeAfterWork ? Number(overtimeAfterWork) : 0;
    const fridaysHolidays = fridaysAndHolidays ? Number(fridaysAndHolidays) : 0;
    const holidaysWork = holidays ? Number(holidays) : 0;
    const supervisorName = supervisor ? supervisor.toString() : '';
    
    const employee: Employee = {
      jobNumber: jobNumber.toString(),
      name: name.toString(),
      baseSalary,
      regionId,
      status: 'active',
      // حقول العمل الإضافي
      daysInMonthReference: daysInMonthRef,
      overtimeAfterWork: overtimeAfter,
      fridaysAndHolidays: fridaysHolidays,
      holidays: holidaysWork,
      supervisor: supervisorName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    employees.push(employee);
  }
  
  console.log(`تم تحويل ${employees.length} موظف`);
  return employees;
}

// دالة مساعدة للبحث عن قيمة العمود
function findColumnValue(row: ExcelRow, possibleKeys: string[]): string | null {
  for (const key of possibleKeys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key].toString().trim();
    }
  }
  return null;
}

// دالة لحساب الراتب الإجمالي حسب المعادلات الجديدة
function calculateTotalSalary(employee: Employee): { totalOvertime: number; totalSalary: number; netSalary: number } {
  // totalOvertime = (D2*I2*0.5) + (E2*I2) + (F2*I2)
  // حيث D2 = holidays, E2 = fridaysAndHolidays, F2 = overtimeAfterReference, I2 = baseSalary
  const totalOvertime = (employee.holidays * employee.baseSalary * 0.5) + 
                       (employee.fridaysAndHolidays * employee.baseSalary) + 
                       (employee.overtimeAfterReference * employee.baseSalary);
  
  // totalSalary = C2*I2
  // حيث C2 = daysInMonth, I2 = baseSalary
  const totalSalary = employee.daysInMonth * employee.baseSalary;
  
  // netSalary = L2 + K2
  // حيث L2 = totalSalary, K2 = totalOvertime
  const netSalary = totalSalary + totalOvertime;
  
  return {
    totalOvertime: Math.round(totalOvertime * 100) / 100, // تقريب لرقمين عشريين
    totalSalary: Math.round(totalSalary * 100) / 100,
    netSalary: Math.round(netSalary * 100) / 100
  };
}

// دالة لإنشاء المراقبين
function createSupervisors(): User[] {
  console.log('إنشاء المراقبين...');
  
  const supervisors: User[] = [
    {
      uid: 'supervisor-1',
      name: 'أحمد محمد - مراقب المنطقة الشمالية',
      email: 'supervisor1@madaba.gov.jo',
      role: 'supervisor',
      regionId: 'region-1',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      uid: 'supervisor-2',
      name: 'فاطمة علي - مراقب المنطقة الجنوبية',
      email: 'supervisor2@madaba.gov.jo',
      role: 'supervisor',
      regionId: 'region-2',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      uid: 'supervisor-3',
      name: 'محمد حسن - مراقب المنطقة الشرقية',
      email: 'supervisor3@madaba.gov.jo',
      role: 'supervisor',
      regionId: 'region-3',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      uid: 'supervisor-4',
      name: 'سارة أحمد - مراقب المنطقة الغربية',
      email: 'supervisor4@madaba.gov.jo',
      role: 'supervisor',
      regionId: 'region-4',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  ];
  
  return supervisors;
}

// دالة لإنشاء المدير
function createAdmin(): User {
  console.log('إنشاء المدير...');
  
  return {
    uid: 'admin-1',
    name: 'مدير نظام نظافتي - بلدية مادبا',
    email: 'admin@madaba.gov.jo',
    role: 'admin',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

// دالة لإنشاء قسم الرواتب
function createFinanceUser(): User {
  console.log('إنشاء قسم الرواتب...');
  
  return {
    uid: 'finance-1',
    name: 'قسم الرواتب - بلدية مادبا',
    email: 'finance@madaba.gov.jo',
    role: 'finance',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

// دالة لإضافة المناطق إلى Firestore
async function addRegionsToFirestore(regions: Region[]): Promise<void> {
  console.log('إضافة المناطق إلى Firestore...');
  
  for (const region of regions) {
    try {
      await setDoc(doc(db, 'regions', region.id), region);
      console.log(`تم إضافة المنطقة: ${region.name}`);
    } catch (error) {
      console.error(`خطأ في إضافة المنطقة ${region.name}:`, error);
    }
  }
}

// دالة لإضافة الموظفين إلى Firestore
async function addEmployeesToFirestore(employees: Employee[]): Promise<void> {
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
        // حساب الراتب الإجمالي
        const salaryCalculation = calculateTotalSalary(employee);
        
        // إضافة الحسابات إلى بيانات الموظف
        const employeeWithSalary = {
          ...employee,
          totalOvertime: salaryCalculation.totalOvertime,
          totalSalary: salaryCalculation.totalSalary
        };
        
        await addDoc(collection(db, 'employees'), employeeWithSalary);
        console.log(`تم إضافة الموظف: ${employee.name} (${employee.jobNumber}) - ${employee.regionId} - الراتب: ${salaryCalculation.totalSalary} دينار`);
      } else {
        console.log(`الموظف موجود مسبقاً: ${employee.name} (${employee.jobNumber})`);
      }
    } catch (error) {
      console.error(`خطأ في إضافة الموظف ${employee.name}:`, error);
    }
  }
}

// دالة لإضافة المستخدمين إلى Firestore
async function addUsersToFirestore(users: User[]): Promise<void> {
  console.log('إضافة المستخدمين إلى Firestore...');
  
  for (const user of users) {
    try {
      await setDoc(doc(db, 'users', user.uid), user);
      console.log(`تم إضافة المستخدم: ${user.name} (${user.role})`);
    } catch (error) {
      console.error(`خطأ في إضافة المستخدم ${user.name}:`, error);
    }
  }
}

// دالة لإضافة قواعد الرواتب
async function addSalaryRules(): Promise<void> {
  console.log('إضافة قواعد الرواتب...');
  
  const salaryRules = {
    daysInMonthReference: 30,
    overtimeFactor: 1.5,
    weekendFactor: 2,
    rounding: 'round'
  };
  
  try {
    await setDoc(doc(db, 'salaryRules', 'salaryRules'), salaryRules);
    console.log('تم إضافة قواعد الرواتب');
  } catch (error) {
    console.error('خطأ في إضافة قواعد الرواتب:', error);
  }
}

// الدالة الرئيسية
async function importRealData(filePath: string): Promise<void> {
  try {
    console.log('🚀 بدء استيراد البيانات الحقيقية من Excel...');
    console.log(`📁 ملف البيانات: ${filePath}`);
    
    // تسجيل دخول مجهول
    await signInAnonymously(auth);
    console.log('✅ تم تسجيل الدخول بنجاح');
    
    // قراءة ملف Excel
    const excelData = readExcelFile(filePath);
    
    if (excelData.length === 0) {
      console.log('⚠️ لا توجد بيانات في الملف');
      return;
    }
    
    // إنشاء البيانات الأساسية
    const regions = createRegions();
    const employees = convertToEmployees(excelData);
    const supervisors = createSupervisors();
    const admin = createAdmin();
    const financeUser = createFinanceUser();
    
    // إضافة البيانات إلى Firestore
    console.log('\n📊 بدء إضافة البيانات إلى Firebase...');
    
    await addRegionsToFirestore(regions);
    await addUsersToFirestore([admin, financeUser, ...supervisors]);
    await addEmployeesToFirestore(employees);
    await addSalaryRules();
    
    console.log('\n🎉 تم استيراد جميع البيانات بنجاح!');
    console.log('\n📈 ملخص الاستيراد:');
    console.log(`- عدد المناطق: ${regions.length}`);
    console.log(`- عدد الموظفين: ${employees.length}`);
    console.log(`- عدد المراقبين: ${supervisors.length}`);
    console.log(`- عدد المستخدمين الإداريين: 2 (مدير + قسم رواتب)`);
    
    // إحصائيات الموظفين حسب المنطقة
    const regionStats = employees.reduce((acc, emp) => {
      acc[emp.regionId] = (acc[emp.regionId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\n🏢 توزيع الموظفين حسب المنطقة:');
    Object.entries(regionStats).forEach(([regionId, count]) => {
      const regionName = regions.find(r => r.id === regionId)?.name || regionId;
      console.log(`- ${regionName}: ${count} موظف`);
    });
    
    // إحصائيات العمل الإضافي
    const totalOvertimeAfter = employees.reduce((sum, emp) => sum + emp.overtimeAfterWork, 0);
    const totalFridaysHolidays = employees.reduce((sum, emp) => sum + emp.fridaysAndHolidays, 0);
    const totalHolidays = employees.reduce((sum, emp) => sum + emp.holidays, 0);
    
    console.log('\n📊 إحصائيات العمل الإضافي:');
    console.log(`- إجمالي أيام الإضافي بعد الدوام: ${totalOvertimeAfter} يوم`);
    console.log(`- إجمالي أيام الجمع والعطل: ${totalFridaysHolidays} يوم`);
    console.log(`- إجمالي أيام الأعياد: ${totalHolidays} يوم`);
    
    // حساب متوسط الراتب
    const totalBaseSalary = employees.reduce((sum, emp) => sum + emp.baseSalary, 0);
    const averageSalary = totalBaseSalary / employees.length;
    console.log(`- متوسط الراتب الأساسي: ${Math.round(averageSalary)} دينار`);
    
    console.log('\n🔑 بيانات تسجيل الدخول:');
    console.log('المدير: admin@madaba.gov.jo');
    console.log('قسم الرواتب: finance@madaba.gov.jo');
    console.log('المراقبين: supervisor1@madaba.gov.jo, supervisor2@madaba.gov.jo, إلخ...');
    
  } catch (error) {
    console.error('❌ خطأ في استيراد البيانات:', error);
  }
}

// تشغيل السكريبت
async function main() {
  const filePath = process.argv[2] || './5-2025.xlsx';
  
  if (!filePath) {
    console.error('يرجى تحديد مسار ملف Excel');
    console.log('مثال: npm run import-real-data ./5-2025.xlsx');
    process.exit(1);
  }
  
  await importRealData(filePath);
}

// تشغيل الدالة الرئيسية
main().catch(console.error);

export { importRealData };
