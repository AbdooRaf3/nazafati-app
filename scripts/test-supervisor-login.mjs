// سكريبت اختبار تسجيل الدخول للمراقبين
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
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

// بيانات المراقبين للاختبار
const testAccounts = [
  {
    name: 'ليلى - مالك العايسة',
    email: 'laila@nazafati.com',
    password: 'Laila2025!'
  },
  {
    name: 'وسط المدينة - عثمان الرفاعي',
    email: 'city-center@nazafati.com',
    password: 'CityCenter2025!'
  },
  {
    name: 'المنطقة الافتراضية - مراقب 1',
    email: 'default1@nazafati.com',
    password: 'Default12025!'
  }
];

// دالة لاختبار تسجيل الدخول
async function testLogin(email, password) {
  try {
    console.log(`🔄 اختبار تسجيل الدخول: ${email}`);
    
    // تسجيل الدخول
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log(`✅ تم تسجيل الدخول بنجاح`);
    console.log(`   UID: ${user.uid}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Email Verified: ${user.emailVerified}`);
    
    // جلب بيانات المراقب من Firestore
    const supervisorDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (supervisorDoc.exists()) {
      const supervisorData = supervisorDoc.data();
      console.log(`✅ تم جلب بيانات المراقب`);
      console.log(`   الاسم: ${supervisorData.name}`);
      console.log(`   الدور: ${supervisorData.role}`);
      console.log(`   المناطق: ${supervisorData.regionNames?.join(', ') || 'غير محدد'}`);
      console.log(`   الصلاحيات: ${Object.keys(supervisorData.permissions || {}).filter(key => supervisorData.permissions[key]).join(', ')}`);
    } else {
      console.log(`⚠️  لم يتم العثور على بيانات المراقب في Firestore`);
    }
    
    // تسجيل الخروج
    await signOut(auth);
    console.log(`✅ تم تسجيل الخروج بنجاح`);
    
    return { success: true, uid: user.uid };
    
  } catch (error) {
    console.error(`❌ خطأ في تسجيل الدخول:`, error.message);
    console.error(`   كود الخطأ: ${error.code}`);
    
    return { success: false, error: error.message, code: error.code };
  }
}

// دالة لاختبار جميع الحسابات
async function testAllAccounts() {
  try {
    console.log('🧪 بدء اختبار تسجيل الدخول للمراقبين...');
    console.log('==========================================');
    
    const results = [];
    
    for (const account of testAccounts) {
      console.log(`\n📧 اختبار حساب: ${account.name}`);
      console.log('----------------------------------------');
      
      const result = await testLogin(account.email, account.password);
      results.push({
        name: account.name,
        email: account.email,
        ...result
      });
      
      // انتظار قصير بين كل اختبار
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n📊 ملخص نتائج الاختبار:');
    console.log('==========================================');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ نجح: ${successful.length} حساب`);
    console.log(`❌ فشل: ${failed.length} حساب`);
    
    if (successful.length > 0) {
      console.log('\n✅ الحسابات الناجحة:');
      successful.forEach(result => {
        console.log(`   📧 ${result.email} - ${result.name}`);
        console.log(`   UID: ${result.uid}`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ الحسابات الفاشلة:');
      failed.forEach(result => {
        console.log(`   📧 ${result.email} - ${result.name}`);
        console.log(`   خطأ: ${result.error} (${result.code})`);
      });
    }
    
    console.log('\n💡 ملاحظات:');
    console.log('- إذا نجح الاختبار، يمكنك استخدام هذه الحسابات في التطبيق');
    console.log('- إذا فشل الاختبار، تحقق من صحة الإيميل وكلمة المرور');
    console.log('- تأكد من أن Firebase Authentication مفعل في مشروعك');
    
  } catch (error) {
    console.error('💥 خطأ في اختبار الحسابات:', error);
  }
}

// تشغيل الاختبار
testAllAccounts();
