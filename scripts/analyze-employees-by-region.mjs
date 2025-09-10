// سكريبت تحليل توزيع الموظفين حسب المناطق
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

// دالة لتحليل توزيع الموظفين
async function analyzeEmployeesByRegion() {
  try {
    console.log('🔍 تحليل توزيع الموظفين حسب المناطق...');
    
    // تسجيل الدخول
    await signInAnonymously(auth);
    console.log('✅ تم تسجيل الدخول إلى Firebase');
    
    // جلب جميع الموظفين
    const employeesQuery = query(collection(db, 'employees'));
    const employeesSnapshot = await getDocs(employeesQuery);
    
    const employees = [];
    employeesSnapshot.forEach(doc => {
      employees.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`📊 إجمالي الموظفين: ${employees.length}`);
    
    // تحليل التوزيع حسب المناطق
    const regionStats = {};
    
    employees.forEach(employee => {
      const regionId = employee.regionId || 'region-default';
      if (!regionStats[regionId]) {
        regionStats[regionId] = {
          count: 0,
          employees: [],
          regionName: getRegionName(regionId)
        };
      }
      regionStats[regionId].count++;
      regionStats[regionId].employees.push({
        jobNumber: employee.jobNumber,
        name: employee.name
      });
    });
    
    // عرض النتائج
    console.log('\n📋 توزيع الموظفين حسب المناطق:');
    console.log('=====================================');
    
    Object.keys(regionStats).forEach(regionId => {
      const stats = regionStats[regionId];
      console.log(`\n🏢 ${stats.regionName} (${regionId}):`);
      console.log(`   👥 عدد الموظفين: ${stats.count}`);
      
      if (stats.count <= 10) {
        console.log('   📝 الموظفين:');
        stats.employees.forEach(emp => {
          console.log(`      - ${emp.jobNumber}: ${emp.name}`);
        });
      } else {
        console.log('   📝 أول 10 موظفين:');
        stats.employees.slice(0, 10).forEach(emp => {
          console.log(`      - ${emp.jobNumber}: ${emp.name}`);
        });
        console.log(`      ... و ${stats.count - 10} موظف آخر`);
      }
    });
    
    // اقتراحات لتوزيع المراقبين
    console.log('\n💡 اقتراحات لتوزيع المراقبين:');
    console.log('=====================================');
    
    const totalEmployees = employees.length;
    const suggestedSupervisors = Math.ceil(totalEmployees / 15); // 15 موظف لكل مراقب
    
    console.log(`📊 إجمالي الموظفين: ${totalEmployees}`);
    console.log(`👨‍💼 عدد المراقبين المقترح: ${suggestedSupervisors}`);
    console.log(`📈 متوسط الموظفين لكل مراقب: ${Math.round(totalEmployees / suggestedSupervisors)}`);
    
    // اقتراح توزيع المناطق
    const regions = Object.keys(regionStats);
    console.log(`\n🏢 المناطق الموجودة: ${regions.length}`);
    
    regions.forEach(regionId => {
      const stats = regionStats[regionId];
      const supervisorsNeeded = Math.ceil(stats.count / 15);
      console.log(`   ${stats.regionName}: ${stats.count} موظف → ${supervisorsNeeded} مراقب`);
    });
    
    return regionStats;
    
  } catch (error) {
    console.error('❌ خطأ في تحليل البيانات:', error);
    throw error;
  }
}

// دالة للحصول على اسم المنطقة
function getRegionName(regionId) {
  const regionNames = {
    'region-1': 'ليلى - مالك العايسة',
    'region-2': 'حنينا - أحمد سعيد الرواجح',
    'region-3': 'حي الزراعة - أحمد سعيد',
    'region-4': 'المخيم - حمزة الكراملة',
    'region-5': 'وسط المدينة - عثمان الرفاعي',
    'region-6': 'النظافة - أحمد القطيفش',
    'region-7': 'المراسلين',
    'region-default': 'المنطقة الافتراضية'
  };
  
  return regionNames[regionId] || regionId;
}

// تشغيل التحليل
analyzeEmployeesByRegion();
