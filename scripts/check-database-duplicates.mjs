// سكريبت فحص التكرار في قاعدة البيانات
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import { config } from './firebase-config.mjs';

// تهيئة Firebase
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

// دالة فحص تكرار المراقبين
async function checkSupervisorDuplicates() {
  console.log('🔍 فحص تكرار المراقبين...');
  console.log('=====================================');
  
  try {
    const supervisorsRef = collection(db, 'users');
    const q = query(supervisorsRef, orderBy('name'));
    const snapshot = await getDocs(q);
    
    const supervisors = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.role === 'supervisor') {
        supervisors.push({
          id: doc.id,
          name: data.name,
          email: data.email,
          regionIds: data.regionIds || [],
          regionNames: data.regionNames || []
        });
      }
    });
    
    console.log(`📊 إجمالي المراقبين: ${supervisors.length}`);
    
    // البحث عن التكرار
    const nameGroups = {};
    supervisors.forEach(supervisor => {
      const name = supervisor.name.trim();
      if (!nameGroups[name]) {
        nameGroups[name] = [];
      }
      nameGroups[name].push(supervisor);
    });
    
    const duplicates = Object.entries(nameGroups).filter(([name, group]) => group.length > 1);
    
    if (duplicates.length > 0) {
      console.log(`❌ تم العثور على ${duplicates.length} مراقب مكرر:`);
      duplicates.forEach(([name, group]) => {
        console.log(`\n👤 ${name} (${group.length} نسخة):`);
        group.forEach((supervisor, index) => {
          console.log(`   ${index + 1}. ID: ${supervisor.id}`);
          console.log(`      Email: ${supervisor.email}`);
          console.log(`      Regions: ${supervisor.regionNames.join(', ')}`);
        });
      });
    } else {
      console.log('✅ لا توجد تكرارات في أسماء المراقبين');
    }
    
    return duplicates;
  } catch (error) {
    console.error('❌ خطأ في فحص المراقبين:', error);
    return [];
  }
}

// دالة فحص تكرار المناطق
async function checkRegionDuplicates() {
  console.log('\n🔍 فحص تكرار المناطق...');
  console.log('=====================================');
  
  try {
    const regionsRef = collection(db, 'regions');
    const q = query(regionsRef, orderBy('name'));
    const snapshot = await getDocs(q);
    
    const regions = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      regions.push({
        id: doc.id,
        name: data.name,
        code: data.code || '',
        description: data.description || ''
      });
    });
    
    console.log(`📊 إجمالي المناطق: ${regions.length}`);
    
    // البحث عن التكرار
    const nameGroups = {};
    regions.forEach(region => {
      const name = region.name.trim();
      if (!nameGroups[name]) {
        nameGroups[name] = [];
      }
      nameGroups[name].push(region);
    });
    
    const duplicates = Object.entries(nameGroups).filter(([name, group]) => group.length > 1);
    
    if (duplicates.length > 0) {
      console.log(`❌ تم العثور على ${duplicates.length} منطقة مكررة:`);
      duplicates.forEach(([name, group]) => {
        console.log(`\n🏢 ${name} (${group.length} نسخة):`);
        group.forEach((region, index) => {
          console.log(`   ${index + 1}. ID: ${region.id}`);
          console.log(`      Code: ${region.code}`);
          console.log(`      Description: ${region.description}`);
        });
      });
    } else {
      console.log('✅ لا توجد تكرارات في أسماء المناطق');
    }
    
    return duplicates;
  } catch (error) {
    console.error('❌ خطأ في فحص المناطق:', error);
    return [];
  }
}

// دالة فحص تكرار الموظفين
async function checkEmployeeDuplicates() {
  console.log('\n🔍 فحص تكرار الموظفين...');
  console.log('=====================================');
  
  try {
    const employeesRef = collection(db, 'employees');
    const q = query(employeesRef, orderBy('name'));
    const snapshot = await getDocs(q);
    
    const employees = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      employees.push({
        id: doc.id,
        name: data.name,
        jobNumber: data.jobNumber,
        regionId: data.regionId,
        regionName: data.regionName
      });
    });
    
    console.log(`📊 إجمالي الموظفين: ${employees.length}`);
    
    // البحث عن التكرار بالاسم
    const nameGroups = {};
    employees.forEach(employee => {
      const name = employee.name.trim();
      if (!nameGroups[name]) {
        nameGroups[name] = [];
      }
      nameGroups[name].push(employee);
    });
    
    const nameDuplicates = Object.entries(nameGroups).filter(([name, group]) => group.length > 1);
    
    // البحث عن التكرار برقم الوظيفة
    const jobNumberGroups = {};
    employees.forEach(employee => {
      const jobNumber = employee.jobNumber?.trim();
      if (jobNumber) {
        if (!jobNumberGroups[jobNumber]) {
          jobNumberGroups[jobNumber] = [];
        }
        jobNumberGroups[jobNumber].push(employee);
      }
    });
    
    const jobNumberDuplicates = Object.entries(jobNumberGroups).filter(([jobNumber, group]) => group.length > 1);
    
    if (nameDuplicates.length > 0) {
      console.log(`❌ تم العثور على ${nameDuplicates.length} موظف مكرر بالاسم:`);
      nameDuplicates.forEach(([name, group]) => {
        console.log(`\n👤 ${name} (${group.length} نسخة):`);
        group.forEach((employee, index) => {
          console.log(`   ${index + 1}. ID: ${employee.id}`);
          console.log(`      Job Number: ${employee.jobNumber}`);
          console.log(`      Region: ${employee.regionName}`);
        });
      });
    } else {
      console.log('✅ لا توجد تكرارات في أسماء الموظفين');
    }
    
    if (jobNumberDuplicates.length > 0) {
      console.log(`❌ تم العثور على ${jobNumberDuplicates.length} موظف مكرر برقم الوظيفة:`);
      jobNumberDuplicates.forEach(([jobNumber, group]) => {
        console.log(`\n🔢 ${jobNumber} (${group.length} نسخة):`);
        group.forEach((employee, index) => {
          console.log(`   ${index + 1}. ID: ${employee.id}`);
          console.log(`      Name: ${employee.name}`);
          console.log(`      Region: ${employee.regionName}`);
        });
      });
    } else {
      console.log('✅ لا توجد تكرارات في أرقام الوظائف');
    }
    
    return { nameDuplicates, jobNumberDuplicates };
  } catch (error) {
    console.error('❌ خطأ في فحص الموظفين:', error);
    return { nameDuplicates: [], jobNumberDuplicates: [] };
  }
}

// الدالة الرئيسية
async function checkDatabaseDuplicates() {
  try {
    console.log('🚀 بدء فحص التكرار في قاعدة البيانات...');
    console.log('===============================================');
    
    // تسجيل الدخول كضيف
    await signInAnonymously(auth);
    console.log('✅ تم تسجيل الدخول إلى Firebase');
    
    // فحص التكرارات
    const supervisorDuplicates = await checkSupervisorDuplicates();
    const regionDuplicates = await checkRegionDuplicates();
    const employeeDuplicates = await checkEmployeeDuplicates();
    
    // ملخص النتائج
    console.log('\n📋 ملخص النتائج:');
    console.log('===============================================');
    console.log(`👨‍💼 المراقبين المكررين: ${supervisorDuplicates.length}`);
    console.log(`🏢 المناطق المكررة: ${regionDuplicates.length}`);
    console.log(`👤 الموظفين المكررين (بالاسم): ${employeeDuplicates.nameDuplicates.length}`);
    console.log(`🔢 الموظفين المكررين (برقم الوظيفة): ${employeeDuplicates.jobNumberDuplicates.length}`);
    
    const totalDuplicates = supervisorDuplicates.length + regionDuplicates.length + 
                           employeeDuplicates.nameDuplicates.length + employeeDuplicates.jobNumberDuplicates.length;
    
    if (totalDuplicates > 0) {
      console.log(`\n⚠️  إجمالي التكرارات: ${totalDuplicates}`);
      console.log('💡 يُنصح بإنشاء سكريبت لإزالة التكرارات');
    } else {
      console.log('\n🎉 لا توجد تكرارات في قاعدة البيانات!');
    }
    
  } catch (error) {
    console.error('❌ خطأ في فحص قاعدة البيانات:', error);
    throw error;
  }
}

// تشغيل السكريبت
checkDatabaseDuplicates().catch(console.error);
