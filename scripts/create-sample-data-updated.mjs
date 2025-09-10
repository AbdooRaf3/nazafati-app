// سكريبت إنشاء بيانات تجريبية محدثة مع المعادلات الجديدة
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { config } from './firebase-config.mjs';

console.log('🎯 إنشاء بيانات تجريبية محدثة...');
console.log('================================');

// تهيئة Firebase
const app = initializeApp(config);
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

// بيانات تجريبية للموظفين
const sampleEmployees = [
  {
    jobNumber: 'EMP001',
    name: 'أحمد محمد علي',
    baseSalary: 8.25,
    regionId: 'region-1',
    status: 'active'
  },
  {
    jobNumber: 'EMP002', 
    name: 'فاطمة أحمد السعيد',
    baseSalary: 9.50,
    regionId: 'region-1',
    status: 'active'
  },
  {
    jobNumber: 'EMP003',
    name: 'محمد عبدالله القحطاني',
    baseSalary: 7.75,
    regionId: 'region-2',
    status: 'active'
  },
  {
    jobNumber: 'EMP004',
    name: 'نورا سعد المطيري',
    baseSalary: 10.25,
    regionId: 'region-2',
    status: 'active'
  }
];

// بيانات تجريبية للإدخالات الشهرية
const sampleMonthlyEntries = [
  {
    employeeId: 'EMP001',
    monthKey: '2025-01',
    daysInMonth: 31,
    holidays: 1,
    fridaysAndHolidays: 4,
    overtimeAfterReference: 1,
    regionId: 'region-1',
    submittedBy: 'admin',
    status: 'submitted'
  },
  {
    employeeId: 'EMP002',
    monthKey: '2025-01', 
    daysInMonth: 31,
    holidays: 2,
    fridaysAndHolidays: 3,
    overtimeAfterReference: 2,
    regionId: 'region-1',
    submittedBy: 'admin',
    status: 'approved'
  },
  {
    employeeId: 'EMP003',
    monthKey: '2025-01',
    daysInMonth: 30,
    holidays: 0,
    fridaysAndHolidays: 2,
    overtimeAfterReference: 1,
    regionId: 'region-2',
    submittedBy: 'admin',
    status: 'draft'
  },
  {
    employeeId: 'EMP004',
    monthKey: '2025-01',
    daysInMonth: 31,
    holidays: 1,
    fridaysAndHolidays: 5,
    overtimeAfterReference: 3,
    regionId: 'region-2',
    submittedBy: 'admin',
    status: 'submitted'
  }
];

// دالة لإنشاء الموظفين
async function createEmployees() {
  console.log('\n👥 إنشاء الموظفين...');
  
  try {
    for (const employee of sampleEmployees) {
      const docRef = await addDoc(collection(db, 'employees'), {
        ...employee,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`  ✅ تم إنشاء الموظف: ${employee.name} (${docRef.id})`);
    }
  } catch (error) {
    console.error('❌ خطأ في إنشاء الموظفين:', error);
    throw error;
  }
}

// دالة لإنشاء الإدخالات الشهرية
async function createMonthlyEntries() {
  console.log('\n📅 إنشاء الإدخالات الشهرية...');
  
  try {
    for (const entry of sampleMonthlyEntries) {
      // حساب الراتب باستخدام المعادلات الجديدة
      const salaryCalculations = calculateSalaryWithNewFormulas(
        entry.baseSalary || 8.25,
        entry.daysInMonth,
        entry.holidays,
        entry.fridaysAndHolidays,
        entry.overtimeAfterReference
      );
      
      const totals = {
        dailyWage: (entry.baseSalary || 8.25) / entry.daysInMonth,
        total: salaryCalculations.netSalary,
        totalOvertime: salaryCalculations.totalOvertime,
        totalSalary: salaryCalculations.totalSalary,
        netSalary: salaryCalculations.netSalary
      };
      
      const docRef = await addDoc(collection(db, 'monthly-entries'), {
        ...entry,
        totals,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log(`  ✅ تم إنشاء الإدخال: ${entry.employeeId} - ${entry.monthKey}`);
      console.log(`     إجمالي الإضافي: ${salaryCalculations.totalOvertime}`);
      console.log(`     إجمالي الراتب: ${salaryCalculations.totalSalary}`);
      console.log(`     صافي الراتب: ${salaryCalculations.netSalary}`);
    }
  } catch (error) {
    console.error('❌ خطأ في إنشاء الإدخالات الشهرية:', error);
    throw error;
  }
}

// دالة لإنشاء قواعد الرواتب
async function createSalaryRules() {
  console.log('\n⚙️  إنشاء قواعد الرواتب...');
  
  try {
    const salaryRules = {
      daysInMonthReference: 31,
      overtimeFactor: 1.5,
      weekendFactor: 2.0,
      rounding: 'round'
    };
    
    await addDoc(collection(db, 'salaryRules'), {
      ...salaryRules,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('  ✅ تم إنشاء قواعد الرواتب');
  } catch (error) {
    console.error('❌ خطأ في إنشاء قواعد الرواتب:', error);
    throw error;
  }
}

// دالة لإنشاء المناطق
async function createRegions() {
  console.log('\n🌍 إنشاء المناطق...');
  
  try {
    const regions = [
      { id: 'region-1', name: 'المنطقة الشمالية', supervisorId: 'supervisor-1' },
      { id: 'region-2', name: 'المنطقة الجنوبية', supervisorId: 'supervisor-2' }
    ];
    
    for (const region of regions) {
      await addDoc(collection(db, 'regions'), {
        ...region,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`  ✅ تم إنشاء المنطقة: ${region.name}`);
    }
  } catch (error) {
    console.error('❌ خطأ في إنشاء المناطق:', error);
    throw error;
  }
}

// دالة رئيسية
async function createSampleData() {
  try {
    console.log('🚀 بدء إنشاء البيانات التجريبية...');
    
    await createRegions();
    await createEmployees();
    await createMonthlyEntries();
    await createSalaryRules();
    
    console.log('\n🎉 تم إنشاء البيانات التجريبية بنجاح!');
    console.log('====================================');
    console.log('✅ تم إنشاء:');
    console.log('  - 4 موظفين');
    console.log('  - 4 إدخالات شهرية مع المعادلات الجديدة');
    console.log('  - 2 منطقة');
    console.log('  - قواعد الرواتب');
    console.log('\n💡 يمكنك الآن اختبار التطبيق مع البيانات الجديدة!');
    
  } catch (error) {
    console.error('\n💥 فشل في إنشاء البيانات التجريبية:', error);
    process.exit(1);
  }
}

// تشغيل إنشاء البيانات
createSampleData();
