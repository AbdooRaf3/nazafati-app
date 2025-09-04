import * as XLSX from 'xlsx';
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

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
  createdAt: any;
  updatedAt: any;
}

interface MonthlyEntry {
  employeeId: string;
  monthKey: string;
  daysWorked: number;
  overtimeDays: number;
  weekendDays: number;
  regionId: string;
  submittedBy: string;
  status: 'submitted' | 'approved' | 'rejected';
  totals: {
    dailyWage: number;
    total: number;
  };
  createdAt: any;
  updatedAt: any;
}

interface Supervisor {
  uid: string;
  name: string;
  email: string;
  role: 'supervisor';
  regionId: string;
  createdAt: any;
  updatedAt: any;
}

// دالة لقراءة ملف Excel
function readExcelFile(filePath: string): ExcelRow[] {
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
function convertToEmployees(data: ExcelRow[]): Employee[] {
  console.log('تحويل البيانات إلى موظفين...');
  
  const employees: Employee[] = [];
  const seenJobNumbers = new Set<string>();
  
  for (const row of data) {
    // توقع أسماء الأعمدة - قد تحتاج لتعديلها حسب ملفك
    const jobNumber = row['رقم_الوظيفة'] || row['jobNumber'] || row['رقم الوظيفة'] || `EMP${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const name = row['اسم_الموظف'] || row['name'] || row['اسم الموظف'] || 'غير محدد';
    const regionName = row['المنطقة'] || row['region'] || row['regionName'] || 'المنطقة الافتراضية';
    
    // تجنب تكرار أرقام الوظائف
    if (seenJobNumbers.has(jobNumber)) {
      console.warn(`رقم الوظيفة مكرر: ${jobNumber} - سيتم تجاهله`);
      continue;
    }
    seenJobNumbers.add(jobNumber);
    
    // تحديد المنطقة
    let regionId = 'region-default';
    if (regionName.includes('شمال') || regionName.includes('north')) {
      regionId = 'region-1';
    } else if (regionName.includes('جنوب') || regionName.includes('south')) {
      regionId = 'region-2';
    } else if (regionName.includes('شرق') || regionName.includes('east')) {
      regionId = 'region-3';
    } else if (regionName.includes('غرب') || regionName.includes('west')) {
      regionId = 'region-4';
    }
    
    // حساب الراتب الأساسي (افتراضي)
    const baseSalary = row['الراتب_الاساسي'] || row['baseSalary'] || row['الراتب الأساسي'] || 3000;
    
    const employee: Employee = {
      jobNumber,
      name,
      baseSalary: Number(baseSalary),
      regionId,
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
function convertToMonthlyEntries(data: ExcelRow[], monthKey: string): MonthlyEntry[] {
  console.log('تحويل البيانات إلى إدخالات شهرية...');
  
  const entries: MonthlyEntry[] = [];
  
  for (const row of data) {
    const jobNumber = row['رقم_الوظيفة'] || row['jobNumber'] || row['رقم الوظيفة'];
    const name = row['اسم_الموظف'] || row['name'] || row['اسم الموظف'];
    const regionName = row['المنطقة'] || row['region'] || row['regionName'];
    
    if (!jobNumber || !name) {
      console.warn('صف بدون رقم وظيفة أو اسم - سيتم تجاهله');
      continue;
    }
    
    // تحديد المنطقة
    let regionId = 'region-default';
    if (regionName?.includes('شمال') || regionName?.includes('north')) {
      regionId = 'region-1';
    } else if (regionName?.includes('جنوب') || regionName?.includes('south')) {
      regionId = 'region-2';
    } else if (regionName?.includes('شرق') || regionName?.includes('east')) {
      regionId = 'region-3';
    } else if (regionName?.includes('غرب') || regionName?.includes('west')) {
      regionId = 'region-4';
    }
    
    // استخراج البيانات الرقمية
    const daysWorked = Number(row['ايام_العمل'] || row['daysWorked'] || row['أيام العمل'] || row['ايام العمل'] || 0);
    const overtimeDays = Number(row['ايام_الاضافي'] || row['overtimeDays'] || row['أيام الإضافي'] || row['ايام الاضافي'] || 0);
    const weekendDays = Number(row['ايام_العطل'] || row['weekendDays'] || row['أيام العطل'] || row['ايام العطل'] || 0);
    
    // حساب الأجر اليومي (افتراضي)
    const baseSalary = Number(row['الراتب_الاساسي'] || row['baseSalary'] || row['الراتب الأساسي'] || 3000);
    const dailyWage = baseSalary / 30;
    
    // حساب إجمالي الراتب
    const total = (dailyWage * daysWorked) + 
                  (dailyWage * 1.5 * overtimeDays) + 
                  (dailyWage * 2 * weekendDays);
    
    const entry: MonthlyEntry = {
      employeeId: jobNumber,
      monthKey,
      daysWorked,
      overtimeDays,
      weekendDays,
      regionId,
      submittedBy: 'excel-import',
      status: 'submitted',
      totals: {
        dailyWage,
        total: Math.round(total)
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    entries.push(entry);
  }
  
  console.log(`تم تحويل ${entries.length} إدخال شهري`);
  return entries;
}

// دالة لإنشاء المراقبين
function createSupervisors(): Supervisor[] {
  console.log('إنشاء المراقبين...');
  
  const supervisors: Supervisor[] = [
    {
      uid: 'supervisor-1',
      name: 'مراقب المنطقة الشمالية',
      email: 'supervisor1@nazafati.com',
      role: 'supervisor',
      regionId: 'region-1',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      uid: 'supervisor-2',
      name: 'مراقب المنطقة الجنوبية',
      email: 'supervisor2@nazafati.com',
      role: 'supervisor',
      regionId: 'region-2',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      uid: 'supervisor-3',
      name: 'مراقب المنطقة الشرقية',
      email: 'supervisor3@nazafati.com',
      role: 'supervisor',
      regionId: 'region-3',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      uid: 'supervisor-4',
      name: 'مراقب المنطقة الغربية',
      email: 'supervisor4@nazafati.com',
      role: 'supervisor',
      regionId: 'region-4',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  ];
  
  return supervisors;
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
async function addMonthlyEntriesToFirestore(entries: MonthlyEntry[]): Promise<void> {
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
async function addSupervisorsToFirestore(supervisors: Supervisor[]): Promise<void> {
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
async function importExcelData(filePath: string, monthKey: string): Promise<void> {
  try {
    console.log('بدء استيراد البيانات من Excel...');
    
    // تسجيل دخول مجهول
    await signInAnonymously(auth);
    console.log('تم تسجيل الدخول بنجاح');
    
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
if (require.main === module) {
  const filePath = process.argv[2];
  const monthKey = process.argv[3] || new Date().toISOString().slice(0, 7); // YYYY-MM
  
  if (!filePath) {
    console.error('يرجى تحديد مسار ملف Excel');
    console.log('مثال: npm run import-excel ./data.xlsx 2024-09');
    process.exit(1);
  }
  
  importExcelData(filePath, monthKey);
}

export { importExcelData };
