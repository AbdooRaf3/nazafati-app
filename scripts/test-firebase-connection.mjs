// سكريبت اختبار الاتصال بـ Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { config } from './firebase-config.mjs';

console.log('🔍 اختبار الاتصال بـ Firebase...');
console.log('================================');

// تهيئة Firebase
const app = initializeApp(config);
const db = getFirestore(app);

async function testConnection() {
  try {
    console.log('📡 محاولة الاتصال بقاعدة البيانات...');
    
    // محاولة قراءة مجموعة الموظفين
    const employeesRef = collection(db, 'employees');
    const snapshot = await getDocs(employeesRef);
    
    console.log(`✅ تم الاتصال بنجاح!`);
    console.log(`📊 عدد الموظفين: ${snapshot.size}`);
    
    // عرض بعض البيانات
    if (snapshot.size > 0) {
      console.log('\n👥 عينة من الموظفين:');
      snapshot.forEach((doc, index) => {
        if (index < 3) { // عرض أول 3 موظفين فقط
          console.log(`  ${index + 1}. ${doc.data().name || 'بدون اسم'} (${doc.id})`);
        }
      });
    }
    
    // اختبار مجموعة الإدخالات الشهرية
    const entriesRef = collection(db, 'monthly-entries');
    const entriesSnapshot = await getDocs(entriesRef);
    
    console.log(`\n📅 عدد الإدخالات الشهرية: ${entriesSnapshot.size}`);
    
    if (entriesSnapshot.size > 0) {
      console.log('\n📝 عينة من الإدخالات:');
      entriesSnapshot.forEach((doc, index) => {
        if (index < 3) {
          const data = doc.data();
          console.log(`  ${index + 1}. ${data.employeeId} - ${data.monthKey} (${data.status || 'بدون حالة'})`);
        }
      });
    }
    
    console.log('\n🎉 اختبار الاتصال مكتمل بنجاح!');
    
  } catch (error) {
    console.error('❌ فشل في الاتصال:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 حلول مقترحة:');
      console.log('  1. تأكد من تسجيل الدخول إلى Firebase CLI');
      console.log('  2. تحقق من قواعد الأمان في Firebase Console');
      console.log('  3. تأكد من أن المشروع صحيح');
      console.log('  4. جرب تشغيل: firebase login --reauth');
    }
    
    process.exit(1);
  }
}

// تشغيل الاختبار
testConnection();
