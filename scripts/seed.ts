import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

// البيانات التجريبية
const regions = [
  { id: 'region-1', name: 'المنطقة الشمالية', supervisorId: 'supervisor-1' },
  { id: 'region-2', name: 'المنطقة الجنوبية', supervisorId: 'supervisor-2' },
  { id: 'region-3', name: 'المنطقة الشرقية', supervisorId: 'supervisor-3' }
];

const users = [
  {
    uid: 'admin-1',
    name: 'أحمد محمد',
    email: 'admin@nazafati.com',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    uid: 'supervisor-1',
    name: 'فاطمة علي',
    email: 'supervisor1@nazafati.com',
    role: 'supervisor',
    regionId: 'region-1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    uid: 'supervisor-2',
    name: 'محمد أحمد',
    email: 'supervisor2@nazafati.com',
    role: 'supervisor',
    regionId: 'region-2',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    uid: 'supervisor-3',
    name: 'عائشة محمد',
    email: 'supervisor3@nazafati.com',
    role: 'supervisor',
    regionId: 'region-3',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    uid: 'finance-1',
    name: 'خالد علي',
    email: 'finance@nazafati.com',
    role: 'finance',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const employees = [
  { jobNumber: 'EMP001', name: 'عبدالله محمد', baseSalary: 3000, regionId: 'region-1', status: 'active' },
  { jobNumber: 'EMP002', name: 'سارة أحمد', baseSalary: 2800, regionId: 'region-1', status: 'active' },
  { jobNumber: 'EMP003', name: 'علي حسن', baseSalary: 3200, regionId: 'region-1', status: 'active' },
  { jobNumber: 'EMP004', name: 'مريم خالد', baseSalary: 2900, regionId: 'region-2', status: 'active' },
  { jobNumber: 'EMP005', name: 'حسن محمد', baseSalary: 3100, regionId: 'region-2', status: 'active' },
  { jobNumber: 'EMP006', name: 'نورا علي', baseSalary: 2750, regionId: 'region-2', status: 'active' },
  { jobNumber: 'EMP007', name: 'يوسف أحمد', baseSalary: 2950, regionId: 'region-3', status: 'active' },
  { jobNumber: 'EMP008', name: 'ليلى محمد', baseSalary: 2850, regionId: 'region-3', status: 'active' },
  { jobNumber: 'EMP009', name: 'أحمد علي', baseSalary: 3000, regionId: 'region-3', status: 'active' },
  { jobNumber: 'EMP010', name: 'فاطمة حسن', baseSalary: 2900, regionId: 'region-1', status: 'active' }
];

const salaryRules = {
  daysInMonthReference: 30,
  overtimeFactor: 1.5,
  weekendFactor: 2,
  rounding: 'round'
};

async function seedData() {
  try {
    console.log('بدء إضافة البيانات التجريبية...');
    
    // تسجيل دخول مجهول
    await signInAnonymously(auth);
    console.log('تم تسجيل الدخول بنجاح');
    
    // إضافة المناطق
    console.log('إضافة المناطق...');
    for (const region of regions) {
      await setDoc(doc(db, 'regions', region.id), {
        ...region,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    console.log('تم إضافة المناطق بنجاح');
    
    // إضافة المستخدمين
    console.log('إضافة المستخدمين...');
    for (const user of users) {
      await setDoc(doc(db, 'users', user.uid), {
        ...user,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    console.log('تم إضافة المستخدمين بنجاح');
    
    // إضافة الموظفين
    console.log('إضافة الموظفين...');
    for (const employee of employees) {
      await addDoc(collection(db, 'employees'), {
        ...employee,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    console.log('تم إضافة الموظفين بنجاح');
    
    // إضافة قواعد الرواتب
    console.log('إضافة قواعد الرواتب...');
    await setDoc(doc(db, 'settings', 'salaryRules'), {
      ...salaryRules,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('تم إضافة قواعد الرواتب بنجاح');
    
    // إضافة بعض الإدخالات الشهرية التجريبية
    console.log('إضافة الإدخالات الشهرية...');
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    for (let i = 0; i < 5; i++) {
      const employee = employees[i];
      const entryId = `${currentMonth}_${employee.jobNumber}`;
      
      await setDoc(doc(db, 'monthlyEntries', entryId), {
        employeeId: employee.jobNumber,
        monthKey: currentMonth,
        daysWorked: 22 + Math.floor(Math.random() * 5),
        overtimeDays: Math.floor(Math.random() * 3),
        weekendDays: Math.floor(Math.random() * 2),
        regionId: employee.regionId,
        submittedBy: `supervisor-${Math.floor(i / 2) + 1}`,
        status: 'submitted',
        totals: {
          dailyWage: employee.baseSalary / 30,
          total: employee.baseSalary + (Math.random() * 500)
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    console.log('تم إضافة الإدخالات الشهرية بنجاح');
    
    console.log('تم إضافة جميع البيانات التجريبية بنجاح!');
    console.log('\nبيانات تسجيل الدخول:');
    console.log('المدير: admin@nazafati.com (يحتاج إنشاء كلمة مرور في Firebase Console)');
    console.log('المراقبون: supervisor1@nazafati.com, supervisor2@nazafati.com, supervisor3@nazafati.com');
    console.log('قسم الرواتب: finance@nazafati.com');
    
  } catch (error) {
    console.error('خطأ في إضافة البيانات التجريبية:', error);
  }
}

// تشغيل السكربت
seedData();
