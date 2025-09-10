// سكريبت فحص توزيع الموظفين
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  query,
  getDocs
} from 'firebase/firestore';
import { config } from './firebase-config.mjs';

// تهيئة Firebase
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

async function checkEmployeeDistribution() {
  try {
    console.log('🔍 فحص توزيع الموظفين...');
    console.log('=====================================');
    
    // تسجيل الدخول كضيف
    await signInAnonymously(auth);
    console.log('✅ تم تسجيل الدخول كضيف');
    
    // جلب جميع الموظفين
    const employeesQuery = query(collection(db, 'employees'));
    const snapshot = await getDocs(employeesQuery);
    const employees = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📊 إجمالي الموظفين: ${employees.length}`);
    
    // تحليل التوزيع حسب المناطق
    const regionStats = {};
    employees.forEach(employee => {
      const regionId = employee.regionId || 'غير محدد';
      if (!regionStats[regionId]) {
        regionStats[regionId] = [];
      }
      regionStats[regionId].push(employee);
    });
    
    console.log('\n📋 توزيع الموظفين حسب المناطق:');
    console.log('=====================================');
    
    Object.keys(regionStats).forEach(regionId => {
      const regionEmployees = regionStats[regionId];
      console.log(`\n🏢 ${regionId}: ${regionEmployees.length} موظف`);
      
      if (regionEmployees.length > 0) {
        console.log('   أمثلة:');
        regionEmployees.slice(0, 3).forEach((emp, index) => {
          console.log(`      ${index + 1}. ${emp.name} (${emp.jobNumber})`);
        });
        if (regionEmployees.length > 3) {
          console.log(`      ... و ${regionEmployees.length - 3} موظف آخر`);
        }
      }
    });
    
    // البحث عن موظفين في region-1 تحديداً
    console.log('\n🔍 البحث عن موظفين في region-1:');
    const region1Employees = employees.filter(emp => emp.regionId === 'region-1');
    console.log(`عدد الموظفين في region-1: ${region1Employees.length}`);
    
    if (region1Employees.length > 0) {
      console.log('الموظفين:');
      region1Employees.forEach((emp, index) => {
        console.log(`   ${index + 1}. ${emp.name} (${emp.jobNumber})`);
      });
    } else {
      console.log('⚠️  لا يوجد موظفين في region-1');
    }
    
    // اقتراح حل
    console.log('\n💡 اقتراح الحل:');
    if (region1Employees.length === 0) {
      console.log('1. لا يوجد موظفين في region-1');
      console.log('2. يمكن تغيير منطقة المراقب إلى منطقة تحتوي على موظفين');
      console.log('3. أو نقل بعض الموظفين إلى region-1');
      
      // اقتراح منطقة بديلة
      const regionsWithEmployees = Object.keys(regionStats).filter(region => 
        regionStats[region].length > 0 && region !== 'غير محدد'
      );
      
      if (regionsWithEmployees.length > 0) {
        console.log(`\n🏢 المناطق التي تحتوي على موظفين: ${regionsWithEmployees.join(', ')}`);
        console.log('يمكن تغيير منطقة المراقب إلى إحدى هذه المناطق');
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ في فحص توزيع الموظفين:', error);
  }
}

// تشغيل الفحص
checkEmployeeDistribution();
