// سكريبت اختبار جلب الموظفين للمراقب
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  or,
  doc,
  getDoc
} from 'firebase/firestore';
import { config } from './firebase-config.mjs';

// تهيئة Firebase
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

// دالة لاختبار جلب الموظفين للمراقب
async function testSupervisorEmployees() {
  try {
    console.log('🧪 اختبار جلب الموظفين للمراقب...');
    console.log('=====================================');
    
    // تسجيل الدخول كمراقب
    const userCredential = await signInWithEmailAndPassword(auth, 'laila@nazafati.com', 'Laila2025!');
    const user = userCredential.user;
    console.log(`✅ تم تسجيل الدخول: ${user.email}`);
    
    // جلب بيانات المراقب
    const supervisorDoc = await getDoc(doc(db, 'users', user.uid));
    if (!supervisorDoc.exists()) {
      console.error('❌ لم يتم العثور على بيانات المراقب');
      return;
    }
    
    const supervisorData = supervisorDoc.data();
    console.log(`👨‍💼 المراقب: ${supervisorData.name}`);
    console.log(`🏢 المناطق المسؤول عنها: ${supervisorData.regionIds?.join(', ') || 'لا توجد'}`);
    
    // جلب جميع الموظفين
    console.log('\n📊 جلب جميع الموظفين...');
    const allEmployeesQuery = query(collection(db, 'employees'));
    const allEmployeesSnapshot = await getDocs(allEmployeesQuery);
    const allEmployees = allEmployeesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📈 إجمالي الموظفين في النظام: ${allEmployees.length}`);
    
    // تحليل توزيع الموظفين حسب المناطق
    const regionStats = {};
    allEmployees.forEach(employee => {
      const regionId = employee.regionId || 'غير محدد';
      if (!regionStats[regionId]) {
        regionStats[regionId] = [];
      }
      regionStats[regionId].push(employee);
    });
    
    console.log('\n📋 توزيع الموظفين حسب المناطق:');
    Object.keys(regionStats).forEach(regionId => {
      console.log(`   ${regionId}: ${regionStats[regionId].length} موظف`);
    });
    
    // جلب موظفي المراقب
    const assignedRegions = supervisorData.regionIds || [];
    console.log(`\n🔍 جلب موظفي المراقب للمناطق: ${assignedRegions.join(', ')}`);
    
    if (assignedRegions.length === 0) {
      console.log('⚠️  لا توجد مناطق مسؤول عنها');
      return;
    }
    
    let supervisorEmployeesQuery;
    
    if (assignedRegions.length === 1) {
      // إذا كان مسؤول عن منطقة واحدة فقط
      supervisorEmployeesQuery = query(
        collection(db, 'employees'),
        where('regionId', '==', assignedRegions[0])
      );
    } else {
      // إذا كان مسؤول عن أكثر من منطقة
      const regionQueries = assignedRegions.map(regionId => 
        where('regionId', '==', regionId)
      );
      
      supervisorEmployeesQuery = query(
        collection(db, 'employees'),
        or(...regionQueries)
      );
    }
    
    const supervisorEmployeesSnapshot = await getDocs(supervisorEmployeesQuery);
    const supervisorEmployees = supervisorEmployeesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`✅ تم جلب ${supervisorEmployees.length} موظف للمراقب`);
    
    if (supervisorEmployees.length > 0) {
      console.log('\n👥 الموظفين:');
      supervisorEmployees.forEach((employee, index) => {
        console.log(`   ${index + 1}. ${employee.name} (${employee.jobNumber}) - ${employee.regionId}`);
      });
    } else {
      console.log('⚠️  لم يتم العثور على موظفين للمراقب');
      
      // التحقق من وجود موظفين في المناطق المسؤول عنها
      console.log('\n🔍 التحقق من وجود موظفين في المناطق:');
      for (const regionId of assignedRegions) {
        const regionEmployees = allEmployees.filter(emp => emp.regionId === regionId);
        console.log(`   ${regionId}: ${regionEmployees.length} موظف`);
        if (regionEmployees.length > 0) {
          console.log(`      أمثلة: ${regionEmployees.slice(0, 3).map(emp => emp.name).join(', ')}`);
        }
      }
    }
    
    // اختبار فلترة الموظفين
    const filteredEmployees = allEmployees.filter(employee => 
      assignedRegions.includes(employee.regionId)
    );
    
    console.log(`\n🔍 الموظفين المفلترين: ${filteredEmployees.length}`);
    
    if (filteredEmployees.length !== supervisorEmployees.length) {
      console.log('⚠️  هناك اختلاف في عدد الموظفين بين الاستعلام والفلترة');
    }
    
  } catch (error) {
    console.error('❌ خطأ في اختبار جلب الموظفين:', error);
  }
}

// تشغيل الاختبار
testSupervisorEmployees();
