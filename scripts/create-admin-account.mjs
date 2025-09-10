// سكريبت إنشاء حساب مدير
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { config } from './firebase-config.mjs';

// تهيئة Firebase
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminAccount() {
  try {
    console.log('🔐 إنشاء حساب مدير...');
    
    const adminEmail = 'admin@nazafati.com';
    const adminPassword = 'admin123';
    
    // إنشاء حساب المصادقة
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log('✅ تم إنشاء حساب المصادقة:', userCredential.user.email);
    
    // إنشاء بيانات المدير في Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email: adminEmail,
      name: 'مدير النظام',
      role: 'admin',
      permissions: {
        canViewEmployees: true,
        canEditEmployees: true,
        canViewMonthlyEntries: true,
        canEditMonthlyEntries: true,
        canViewPayroll: true,
        canEditPayroll: true,
        canViewSettings: true,
        canManageUsers: true
      },
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ تم إنشاء بيانات المدير في Firestore');
    
    console.log('\n🎉 تم إنشاء حساب المدير بنجاح!');
    console.log('===============================================');
    console.log(`📧 الإيميل: ${adminEmail}`);
    console.log(`🔑 كلمة المرور: ${adminPassword}`);
    console.log('🔐 يمكنك الآن تسجيل الدخول كمدير');
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('⚠️  حساب المدير موجود مسبقاً');
      console.log('📧 الإيميل: admin@nazafati.com');
      console.log('🔑 كلمة المرور: admin123');
    } else {
      console.error('❌ خطأ في إنشاء حساب المدير:', error.message);
      throw error;
    }
  }
}

// تشغيل إنشاء الحساب
createAdminAccount();
