// سكريبت تشخيص بيانات المراقب
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc
} from 'firebase/firestore';
import { config } from './firebase-config.mjs';

// تهيئة Firebase
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

async function debugSupervisorData() {
  try {
    console.log('🔍 تشخيص بيانات المراقب...');
    console.log('=====================================');
    
    // تسجيل الدخول كمراقب
    const userCredential = await signInWithEmailAndPassword(auth, 'laila@nazafati.com', 'Laila2025!');
    const user = userCredential.user;
    console.log(`✅ تم تسجيل الدخول: ${user.email}`);
    console.log(`🆔 UID: ${user.uid}`);
    
    // جلب بيانات المراقب
    const supervisorDoc = await getDoc(doc(db, 'users', user.uid));
    if (!supervisorDoc.exists()) {
      console.error('❌ لم يتم العثور على بيانات المراقب');
      return;
    }
    
    const supervisorData = supervisorDoc.data();
    console.log('\n📋 بيانات المراقب:');
    console.log('=====================================');
    console.log(`الاسم: ${supervisorData.name}`);
    console.log(`الدور: ${supervisorData.role}`);
    console.log(`regionId: ${supervisorData.regionId || 'غير موجود'}`);
    console.log(`regionIds: ${JSON.stringify(supervisorData.regionIds || [])}`);
    console.log(`assignedRegions: ${JSON.stringify(supervisorData.assignedRegions || [])}`);
    console.log(`الصلاحيات: ${JSON.stringify(supervisorData.permissions || {})}`);
    
    // التحقق من وجود موظفين في region-1
    console.log('\n🔍 البحث عن موظفين في region-1...');
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    
    try {
      const employeesQuery = query(
        collection(db, 'employees'),
        where('regionId', '==', 'region-1')
      );
      
      const snapshot = await getDocs(employeesQuery);
      const employees = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`✅ تم العثور على ${employees.length} موظف في region-1`);
      
      if (employees.length > 0) {
        console.log('\n👥 الموظفين:');
        employees.slice(0, 5).forEach((employee, index) => {
          console.log(`   ${index + 1}. ${employee.name} (${employee.jobNumber}) - ${employee.regionId}`);
        });
        if (employees.length > 5) {
          console.log(`   ... و ${employees.length - 5} موظف آخر`);
        }
      }
    } catch (error) {
      console.error('❌ خطأ في جلب الموظفين:', error.message);
      console.error('كود الخطأ:', error.code);
    }
    
    // اختبار جلب موظف واحد فقط
    console.log('\n🧪 اختبار جلب موظف واحد...');
    try {
      const singleEmployeeQuery = query(
        collection(db, 'employees'),
        where('regionId', '==', 'region-1')
      );
      
      const singleSnapshot = await getDocs(singleEmployeeQuery);
      console.log(`✅ تم جلب ${singleSnapshot.docs.length} موظف في الاستعلام الواحد`);
    } catch (error) {
      console.error('❌ خطأ في جلب موظف واحد:', error.message);
    }
    
  } catch (error) {
    console.error('❌ خطأ في التشخيص:', error);
  }
}

// تشغيل التشخيص
debugSupervisorData();
