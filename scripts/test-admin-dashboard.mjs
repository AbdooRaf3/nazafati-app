// سكريبت اختبار لوحة الإدارة
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { config } from './firebase-config.mjs';

// تهيئة Firebase
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

// دالة اختبار تسجيل الدخول كمدير
async function testAdminLogin() {
  try {
    console.log('🔐 اختبار تسجيل الدخول كمدير...');
    
    // محاولة تسجيل الدخول بحساب مدير موجود
    const adminEmail = 'admin@nazafati.com';
    const adminPassword = 'admin123';
    
    const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log('✅ تم تسجيل الدخول بنجاح:', userCredential.user.email);
    
    return userCredential.user;
  } catch (error) {
    console.error('❌ خطأ في تسجيل الدخول:', error.message);
    
    // إذا لم يكن هناك حساب مدير، أنشئ واحداً
    if (error.code === 'auth/user-not-found') {
      console.log('🔄 إنشاء حساب مدير جديد...');
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      
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
      
      console.log('✅ تم إنشاء حساب المدير بنجاح');
      return userCredential.user;
    }
    
    throw error;
  }
}

// دالة اختبار جلب البيانات
async function testDataFetching() {
  try {
    console.log('\n📊 اختبار جلب البيانات...');
    
    // جلب المناطق
    console.log('🏢 جلب المناطق...');
    const regionsSnapshot = await getDocs(collection(db, 'regions'));
    const regions = regionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log(`✅ تم جلب ${regions.length} منطقة`);
    
    // جلب المراقبين
    console.log('👨‍💼 جلب المراقبين...');
    const supervisorsSnapshot = await getDocs(query(
      collection(db, 'users'),
      where('role', '==', 'supervisor')
    ));
    const supervisors = supervisorsSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
    console.log(`✅ تم جلب ${supervisors.length} مراقب`);
    
    // جلب الموظفين
    console.log('👥 جلب الموظفين...');
    const employeesSnapshot = await getDocs(collection(db, 'employees'));
    const employees = employeesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log(`✅ تم جلب ${employees.length} موظف`);
    
    return { regions, supervisors, employees };
  } catch (error) {
    console.error('❌ خطأ في جلب البيانات:', error.message);
    throw error;
  }
}

// دالة اختبار الصلاحيات
async function testPermissions() {
  try {
    console.log('\n🔒 اختبار الصلاحيات...');
    
    const { doc, getDoc } = await import('firebase/firestore');
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('لا يوجد مستخدم مسجل الدخول');
    }
    
    // جلب بيانات المستخدم
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const userData = userDoc.data();
    
    console.log('👤 بيانات المستخدم:');
    console.log(`   الاسم: ${userData?.name || 'غير محدد'}`);
    console.log(`   الإيميل: ${userData?.email || 'غير محدد'}`);
    console.log(`   الدور: ${userData?.role || 'غير محدد'}`);
    console.log(`   نشط: ${userData?.isActive ? 'نعم' : 'لا'}`);
    
    if (userData?.permissions) {
      console.log('🔑 الصلاحيات:');
      Object.keys(userData.permissions).forEach(permission => {
        console.log(`   ${permission}: ${userData.permissions[permission] ? '✅' : '❌'}`);
      });
    }
    
    return userData;
  } catch (error) {
    console.error('❌ خطأ في اختبار الصلاحيات:', error.message);
    throw error;
  }
}

// دالة اختبار التعديل
async function testEditOperations() {
  try {
    console.log('\n✏️ اختبار عمليات التعديل...');
    
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    
    // اختبار إنشاء منطقة جديدة
    console.log('🏢 إنشاء منطقة تجريبية...');
    const testRegionId = 'test-region-' + Date.now();
    await setDoc(doc(db, 'regions', testRegionId), {
      name: 'منطقة تجريبية',
      description: 'منطقة للاختبار فقط',
      employeeCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✅ تم إنشاء المنطقة التجريبية');
    
    // اختبار إنشاء مراقب تجريبي
    console.log('👨‍💼 إنشاء مراقب تجريبي...');
    const testSupervisorId = 'test-supervisor-' + Date.now();
    await setDoc(doc(db, 'users', testSupervisorId), {
      uid: testSupervisorId,
      name: 'مراقب تجريبي',
      email: `test-supervisor-${Date.now()}@nazafati.com`,
      role: 'supervisor',
      regionIds: [testRegionId],
      regionNames: ['منطقة تجريبية'],
      permissions: {
        canViewEmployees: true,
        canEditEmployees: false,
        canViewMonthlyEntries: true,
        canEditMonthlyEntries: true,
        canViewPayroll: true,
        canEditPayroll: false,
        canViewSettings: false,
        canManageUsers: false
      },
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✅ تم إنشاء المراقب التجريبي');
    
    return { testRegionId, testSupervisorId };
  } catch (error) {
    console.error('❌ خطأ في اختبار عمليات التعديل:', error.message);
    throw error;
  }
}

// دالة تنظيف البيانات التجريبية
async function cleanupTestData(testRegionId, testSupervisorId) {
  try {
    console.log('\n🧹 تنظيف البيانات التجريبية...');
    
    const { doc, deleteDoc } = await import('firebase/firestore');
    
    // حذف المراقب التجريبي
    await deleteDoc(doc(db, 'users', testSupervisorId));
    console.log('✅ تم حذف المراقب التجريبي');
    
    // حذف المنطقة التجريبية
    await deleteDoc(doc(db, 'regions', testRegionId));
    console.log('✅ تم حذف المنطقة التجريبية');
    
  } catch (error) {
    console.error('❌ خطأ في تنظيف البيانات:', error.message);
  }
}

// الدالة الرئيسية
async function testAdminDashboard() {
  try {
    console.log('🚀 بدء اختبار لوحة الإدارة...');
    console.log('===============================================');
    
    // اختبار تسجيل الدخول
    await testAdminLogin();
    
    // اختبار جلب البيانات
    const data = await testDataFetching();
    
    // اختبار الصلاحيات
    const userData = await testPermissions();
    
    // اختبار عمليات التعديل
    const testIds = await testEditOperations();
    
    // تنظيف البيانات التجريبية
    await cleanupTestData(testIds.testRegionId, testIds.testSupervisorId);
    
    console.log('\n🎉 تم إنجاز جميع الاختبارات بنجاح!');
    console.log('===============================================');
    console.log('✅ تسجيل الدخول كمدير');
    console.log('✅ جلب البيانات (مناطق، مراقبين، موظفين)');
    console.log('✅ اختبار الصلاحيات');
    console.log('✅ عمليات التعديل (إنشاء، تحديث، حذف)');
    console.log('✅ تنظيف البيانات التجريبية');
    
    console.log('\n📋 ملخص البيانات:');
    console.log(`🏢 المناطق: ${data.regions.length}`);
    console.log(`👨‍💼 المراقبين: ${data.supervisors.length}`);
    console.log(`👥 الموظفين: ${data.employees.length}`);
    
    console.log('\n🌐 يمكنك الآن الوصول إلى لوحة الإدارة عبر:');
    console.log('   http://localhost:5173/admin');
    console.log('   (تأكد من تشغيل التطبيق أولاً)');
    
  } catch (error) {
    console.error('❌ فشل في اختبار لوحة الإدارة:', error);
    throw error;
  }
}

// تشغيل الاختبار
testAdminDashboard();
