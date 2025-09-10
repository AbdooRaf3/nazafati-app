// سكريبت إنشاء حسابات المراقبين في Firebase Authentication
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
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

// بيانات المراقبين
const supervisorsData = [
  {
    uid: 'supervisor-laila',
    name: 'ليلى - مالك العايسة',
    email: 'laila@nazafati.com',
    password: 'Laila2025!',
    role: 'supervisor',
    regionIds: ['region-1'],
    regionNames: ['ليلى - مالك العايسة'],
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
    assignedRegions: ['region-1']
  },
  {
    uid: 'supervisor-hanina',
    name: 'حنينا - أحمد سعيد الرواجح',
    email: 'hanina@nazafati.com',
    password: 'Hanina2025!',
    role: 'supervisor',
    regionIds: ['region-2'],
    regionNames: ['حنينا - أحمد سعيد الرواجح'],
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
    assignedRegions: ['region-2']
  },
  {
    uid: 'supervisor-agriculture',
    name: 'حي الزراعة - أحمد سعيد',
    email: 'agriculture@nazafati.com',
    password: 'Agriculture2025!',
    role: 'supervisor',
    regionIds: ['region-3'],
    regionNames: ['حي الزراعة - أحمد سعيد'],
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
    assignedRegions: ['region-3']
  },
  {
    uid: 'supervisor-camp',
    name: 'المخيم - حمزة الكراملة',
    email: 'camp@nazafati.com',
    password: 'Camp2025!',
    role: 'supervisor',
    regionIds: ['region-4'],
    regionNames: ['المخيم - حمزة الكراملة'],
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
    assignedRegions: ['region-4']
  },
  {
    uid: 'supervisor-city-center',
    name: 'وسط المدينة - عثمان الرفاعي',
    email: 'city-center@nazafati.com',
    password: 'CityCenter2025!',
    role: 'supervisor',
    regionIds: ['region-5'],
    regionNames: ['وسط المدينة - عثمان الرفاعي'],
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
    assignedRegions: ['region-5']
  },
  {
    uid: 'supervisor-cleaning',
    name: 'النظافة - أحمد القطيفش',
    email: 'cleaning@nazafati.com',
    password: 'Cleaning2025!',
    role: 'supervisor',
    regionIds: ['region-6'],
    regionNames: ['النظافة - أحمد القطيفش'],
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
    assignedRegions: ['region-6']
  },
  {
    uid: 'supervisor-messengers',
    name: 'المراسلين',
    email: 'messengers@nazafati.com',
    password: 'Messengers2025!',
    role: 'supervisor',
    regionIds: ['region-7'],
    regionNames: ['المراسلين'],
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
    assignedRegions: ['region-7']
  },
  {
    uid: 'supervisor-default-1',
    name: 'المنطقة الافتراضية - مراقب 1',
    email: 'default1@nazafati.com',
    password: 'Default12025!',
    role: 'supervisor',
    regionIds: ['region-default'],
    regionNames: ['المنطقة الافتراضية'],
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
    assignedRegions: ['region-default'],
    employeeLimit: 35
  },
  {
    uid: 'supervisor-default-2',
    name: 'المنطقة الافتراضية - مراقب 2',
    email: 'default2@nazafati.com',
    password: 'Default22025!',
    role: 'supervisor',
    regionIds: ['region-default'],
    regionNames: ['المنطقة الافتراضية'],
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
    assignedRegions: ['region-default'],
    employeeLimit: 34
  }
];

// دالة لإنشاء حساب مراقب
async function createSupervisorAccount(supervisor) {
  try {
    console.log(`🔄 إنشاء حساب ${supervisor.name}...`);
    
    // إنشاء الحساب في Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      supervisor.email, 
      supervisor.password
    );
    
    const user = userCredential.user;
    console.log(`✅ تم إنشاء حساب المصادقة: ${user.uid}`);
    
    // إضافة بيانات المراقب إلى Firestore
    const supervisorData = {
      ...supervisor,
      uid: user.uid, // استخدام UID الفعلي من Firebase
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
      lastLogin: null
    };
    
    await setDoc(doc(db, 'users', user.uid), supervisorData);
    console.log(`✅ تم إضافة بيانات المراقب إلى Firestore`);
    
    return {
      success: true,
      uid: user.uid,
      email: supervisor.email
    };
    
  } catch (error) {
    console.error(`❌ خطأ في إنشاء حساب ${supervisor.name}:`, error.message);
    
    // إذا كان الحساب موجود مسبقاً، جرب تسجيل الدخول
    if (error.code === 'auth/email-already-in-use') {
      try {
        console.log(`🔄 الحساب موجود مسبقاً، جاري تسجيل الدخول...`);
        const signInResult = await signInWithEmailAndPassword(
          auth, 
          supervisor.email, 
          supervisor.password
        );
        
        console.log(`✅ تم تسجيل الدخول بنجاح: ${signInResult.user.uid}`);
        
        // تحديث بيانات المراقب
        const supervisorData = {
          ...supervisor,
          uid: signInResult.user.uid,
          updatedAt: serverTimestamp(),
          isActive: true
        };
        
        await setDoc(doc(db, 'users', signInResult.user.uid), supervisorData);
        console.log(`✅ تم تحديث بيانات المراقب`);
        
        return {
          success: true,
          uid: signInResult.user.uid,
          email: supervisor.email,
          message: 'تم تحديث الحساب الموجود'
        };
        
      } catch (signInError) {
        console.error(`❌ خطأ في تسجيل الدخول:`, signInError.message);
        return {
          success: false,
          error: signInError.message
        };
      }
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// دالة لإنشاء جميع حسابات المراقبين
async function createAllSupervisorAccounts() {
  try {
    console.log('🚀 بدء إنشاء حسابات المراقبين...');
    console.log('=====================================');
    
    const results = [];
    
    for (const supervisor of supervisorsData) {
      const result = await createSupervisorAccount(supervisor);
      results.push({
        name: supervisor.name,
        email: supervisor.email,
        ...result
      });
      
      // انتظار قصير بين كل حساب
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n📊 ملخص النتائج:');
    console.log('=====================================');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ نجح: ${successful.length} حساب`);
    console.log(`❌ فشل: ${failed.length} حساب`);
    
    if (successful.length > 0) {
      console.log('\n✅ الحسابات الناجحة:');
      successful.forEach(result => {
        console.log(`   📧 ${result.email} - ${result.name}`);
        if (result.message) {
          console.log(`      ${result.message}`);
        }
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ الحسابات الفاشلة:');
      failed.forEach(result => {
        console.log(`   📧 ${result.email} - ${result.name}`);
        console.log(`      خطأ: ${result.error}`);
      });
    }
    
    // إنشاء ملف بيانات تسجيل الدخول
    await createLoginCredentialsFile(successful);
    
    console.log('\n🎉 تم إنجاز العملية!');
    console.log('يمكنك الآن تسجيل الدخول باستخدام أي من الحسابات الناجحة');
    
  } catch (error) {
    console.error('💥 خطأ في إنشاء حسابات المراقبين:', error);
    process.exit(1);
  }
}

// دالة لإنشاء ملف بيانات تسجيل الدخول
async function createLoginCredentialsFile(successfulAccounts) {
  const fs = await import('fs');
  const path = await import('path');
  
  const credentials = successfulAccounts.map(account => {
    const supervisor = supervisorsData.find(s => s.email === account.email);
    return {
      name: supervisor.name,
      email: account.email,
      password: supervisor.password,
      regions: supervisor.regionNames.join(', '),
      permissions: Object.keys(supervisor.permissions)
        .filter(key => supervisor.permissions[key])
        .join(', ')
    };
  });
  
  const credentialsText = `# بيانات تسجيل الدخول للمراقبين
# تاريخ الإنشاء: ${new Date().toLocaleString('ar-SA')}
# الحسابات الناجحة: ${successfulAccounts.length}

${credentials.map((cred, index) => `
## ${index + 1}. ${cred.name}
- **الإيميل:** ${cred.email}
- **كلمة المرور:** ${cred.password}
- **المناطق المسؤول عنها:** ${cred.regions}
- **الصلاحيات:** ${cred.permissions}
`).join('')}

## ملاحظات مهمة:
1. يرجى تغيير كلمات المرور بعد تسجيل الدخول الأول
2. كل مراقب يمكنه رؤية وتعديل بيانات موظفي منطقته فقط
3. المراقب لا يمكنه رؤية بيانات المناطق الأخرى
4. يمكن للمراقب الواحد أن يكون مسؤولاً عن أكثر من منطقة

## كيفية تسجيل الدخول:
1. افتح التطبيق
2. اضغط على "تسجيل الدخول"
3. استخدم الإيميل وكلمة المرور المذكورة أعلاه
4. ستظهر لك لوحة المراقب مع موظفي منطقتك فقط

## استكشاف الأخطاء:
- إذا ظهر خطأ "invalid-credential"، تأكد من صحة الإيميل وكلمة المرور
- إذا ظهر خطأ "user-not-found"، تأكد من أن الحساب تم إنشاؤه بنجاح
- إذا ظهر خطأ "wrong-password"، تأكد من كلمة المرور الصحيحة
`;

  const filePath = path.join(process.cwd(), 'scripts', 'supervisors-credentials-updated.txt');
  fs.writeFileSync(filePath, credentialsText, 'utf8');
  
  console.log(`📄 تم إنشاء ملف بيانات تسجيل الدخول: ${filePath}`);
}

// تشغيل السكريبت
createAllSupervisorAccounts();
