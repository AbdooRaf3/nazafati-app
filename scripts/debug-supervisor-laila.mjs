// سكريبت تشخيص مشكلة المراقب ليلى
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  query,
  where,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { config } from './firebase-config.mjs';

// تهيئة Firebase
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

async function debugSupervisorLaila() {
  try {
    console.log('🔍 تشخيص مشكلة المراقب ليلى...');
    console.log('===============================================');
    
    // تسجيل الدخول كليلى
    console.log('🔐 تسجيل الدخول كليلى...');
    const userCredential = await signInWithEmailAndPassword(auth, 'laila@nazafati.com', 'Laila2025!');
    console.log('✅ تم تسجيل الدخول بنجاح:', userCredential.user.email);
    
    // جلب بيانات المراقب
    console.log('\n👤 جلب بيانات المراقب...');
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    const userData = userDoc.data();
    
    if (userData) {
      console.log('📋 بيانات المراقب:');
      console.log(`   الاسم: ${userData.name || 'غير محدد'}`);
      console.log(`   الإيميل: ${userData.email || 'غير محدد'}`);
      console.log(`   الدور: ${userData.role || 'غير محدد'}`);
      console.log(`   المناطق المسؤول عنها: ${userData.regionIds || 'لا توجد'}`);
      console.log(`   أسماء المناطق: ${userData.regionNames || 'لا توجد'}`);
      console.log(`   المناطق المخصصة: ${userData.assignedRegions || 'لا توجد'}`);
    } else {
      console.log('❌ لم يتم العثور على بيانات المراقب');
    }
    
    // جلب جميع الموظفين
    console.log('\n👥 جلب جميع الموظفين...');
    const employeesSnapshot = await getDocs(collection(db, 'employees'));
    const allEmployees = employeesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📊 إجمالي الموظفين: ${allEmployees.length}`);
    
    // تحليل توزيع الموظفين حسب المنطقة
    const regionStats = {};
    allEmployees.forEach(emp => {
      const regionId = emp.regionId || 'غير محدد';
      if (!regionStats[regionId]) {
        regionStats[regionId] = [];
      }
      regionStats[regionId].push(emp.name);
    });
    
    console.log('\n🏢 توزيع الموظفين حسب المنطقة:');
    Object.keys(regionStats).forEach(regionId => {
      console.log(`   ${regionId}: ${regionStats[regionId].length} موظف`);
      if (regionStats[regionId].length <= 5) {
        regionStats[regionId].forEach(name => {
          console.log(`     - ${name}`);
        });
      } else {
        console.log(`     أول 5 موظفين:`);
        regionStats[regionId].slice(0, 5).forEach(name => {
          console.log(`     - ${name}`);
        });
        console.log(`     ... و ${regionStats[regionId].length - 5} موظف آخر`);
      }
    });
    
    // جلب الموظفين للمنطقة region-1
    console.log('\n🔍 جلب الموظفين للمنطقة region-1...');
    const region1Query = query(
      collection(db, 'employees'),
      where('regionId', '==', 'region-1')
    );
    const region1Snapshot = await getDocs(region1Query);
    const region1Employees = region1Snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📊 موظفو region-1: ${region1Employees.length}`);
    region1Employees.forEach(emp => {
      console.log(`   - ${emp.name} (${emp.jobNumber})`);
    });
    
    // جلب المناطق
    console.log('\n🏢 جلب جميع المناطق...');
    const regionsSnapshot = await getDocs(collection(db, 'regions'));
    const regions = regionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📊 إجمالي المناطق: ${regions.length}`);
    regions.forEach(region => {
      console.log(`   ${region.id}: ${region.name} (${region.employeeCount} موظف)`);
    });
    
    // اختبار الاستعلام المباشر
    console.log('\n🧪 اختبار الاستعلام المباشر...');
    if (userData && userData.regionIds && userData.regionIds.length > 0) {
      const assignedRegions = userData.regionIds;
      console.log(`🔍 البحث في المناطق: ${assignedRegions.join(', ')}`);
      
      if (assignedRegions.length === 1) {
        const singleRegionQuery = query(
          collection(db, 'employees'),
          where('regionId', '==', assignedRegions[0])
        );
        const singleRegionSnapshot = await getDocs(singleRegionQuery);
        const singleRegionEmployees = singleRegionSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log(`📊 موظفو ${assignedRegions[0]}: ${singleRegionEmployees.length}`);
        singleRegionEmployees.forEach(emp => {
          console.log(`   - ${emp.name} (${emp.regionId})`);
        });
      } else {
        // استخدام or query للمناطق المتعددة
        const { or } = await import('firebase/firestore');
        const regionQueries = assignedRegions.map(regionId => 
          where('regionId', '==', regionId)
        );
        const multiRegionQuery = query(
          collection(db, 'employees'),
          or(...regionQueries)
        );
        const multiRegionSnapshot = await getDocs(multiRegionQuery);
        const multiRegionEmployees = multiRegionSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log(`📊 موظفو المناطق المتعددة: ${multiRegionEmployees.length}`);
        multiRegionEmployees.forEach(emp => {
          console.log(`   - ${emp.name} (${emp.regionId})`);
        });
      }
    } else {
      console.log('❌ لا توجد مناطق مسؤول عنها');
    }
    
  } catch (error) {
    console.error('❌ خطأ في التشخيص:', error.message);
    throw error;
  }
}

// تشغيل التشخيص
debugSupervisorLaila();
