// سكريبت فحص بيانات ليلى
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { 
  getFirestore, 
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { config } from './firebase-config.mjs';

// تهيئة Firebase
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

async function checkLailaData() {
  try {
    console.log('🔍 فحص بيانات ليلى...');
    
    // تسجيل الدخول كليلى
    const userCredential = await signInWithEmailAndPassword(auth, 'laila@nazafati.com', 'Laila2025!');
    console.log('✅ تم تسجيل الدخول:', userCredential.user.email);
    
    // جلب بيانات المراقب
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    const userData = userDoc.data();
    
    console.log('\n👤 بيانات المراقب:');
    console.log(`   الاسم: ${userData?.name || 'غير محدد'}`);
    console.log(`   المناطق المسؤول عنها: ${JSON.stringify(userData?.regionIds || [])}`);
    console.log(`   أسماء المناطق: ${JSON.stringify(userData?.regionNames || [])}`);
    
    // جلب الموظفين في region-1
    console.log('\n👥 موظفو region-1:');
    const region1Query = query(
      collection(db, 'employees'),
      where('regionId', '==', 'region-1')
    );
    const region1Snapshot = await getDocs(region1Query);
    const region1Employees = region1Snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      regionId: doc.data().regionId
    }));
    
    console.log(`   العدد: ${region1Employees.length}`);
    region1Employees.forEach(emp => {
      console.log(`   - ${emp.name} (${emp.regionId})`);
    });
    
    // جلب جميع الموظفين
    console.log('\n👥 جميع الموظفين:');
    const allEmployeesSnapshot = await getDocs(collection(db, 'employees'));
    const allEmployees = allEmployeesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      regionId: doc.data().regionId
    }));
    
    console.log(`   العدد: ${allEmployees.length}`);
    
    // تحليل المناطق
    const regionStats = {};
    allEmployees.forEach(emp => {
      const regionId = emp.regionId || 'غير محدد';
      if (!regionStats[regionId]) {
        regionStats[regionId] = 0;
      }
      regionStats[regionId]++;
    });
    
    console.log('\n🏢 توزيع الموظفين:');
    Object.keys(regionStats).forEach(regionId => {
      console.log(`   ${regionId}: ${regionStats[regionId]} موظف`);
    });
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

checkLailaData();
