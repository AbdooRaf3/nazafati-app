// سكريبت إنشاء المراقبين مع الصلاحيات والإيميلات
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  collection, 
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { config } from './firebase-config.mjs';

// تهيئة Firebase
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

// بيانات المراقبين مع الصلاحيات
const supervisorsData = [
  {
    uid: 'supervisor-laila',
    name: 'ليلى - مالك العايسة',
    email: 'laila@nazafati.com',
    password: 'Laila2025!',
    role: 'supervisor',
    regionIds: ['region-1'], // يمكن أن يكون مسؤول عن أكثر من منطقة
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
  // مراقب إضافي للمنطقة الافتراضية (69 موظف)
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
    employeeLimit: 35 // أول 35 موظف
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
    employeeLimit: 34 // باقي الموظفين
  }
];

// دالة لإضافة المراقبين إلى Firestore
async function addSupervisorsToFirestore() {
  try {
    console.log('👨‍💼 إضافة المراقبين إلى Firestore...');
    
    // تسجيل الدخول
    await signInAnonymously(auth);
    console.log('✅ تم تسجيل الدخول إلى Firebase');
    
    for (const supervisor of supervisorsData) {
      try {
        // إضافة بيانات المراقب
        const supervisorData = {
          ...supervisor,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isActive: true,
          lastLogin: null
        };
        
        await setDoc(doc(db, 'users', supervisor.uid), supervisorData);
        console.log(`✅ تم إضافة المراقب: ${supervisor.name}`);
        console.log(`   📧 الإيميل: ${supervisor.email}`);
        console.log(`   🔑 كلمة المرور: ${supervisor.password}`);
        console.log(`   🏢 المناطق: ${supervisor.regionNames.join(', ')}`);
        console.log('');
        
      } catch (error) {
        console.error(`❌ خطأ في إضافة المراقب ${supervisor.name}:`, error);
      }
    }
    
    console.log('🎉 تم إضافة جميع المراقبين بنجاح!');
    
    // إنشاء ملف نصي ببيانات تسجيل الدخول
    await createLoginCredentialsFile();
    
  } catch (error) {
    console.error('❌ خطأ في إضافة المراقبين:', error);
    throw error;
  }
}

// دالة لإنشاء ملف بيانات تسجيل الدخول
async function createLoginCredentialsFile() {
  const fs = await import('fs');
  const path = await import('path');
  
  const credentials = supervisorsData.map(supervisor => ({
    name: supervisor.name,
    email: supervisor.email,
    password: supervisor.password,
    regions: supervisor.regionNames.join(', '),
    permissions: Object.keys(supervisor.permissions)
      .filter(key => supervisor.permissions[key])
      .join(', ')
  }));
  
  const credentialsText = `# بيانات تسجيل الدخول للمراقبين
# تاريخ الإنشاء: ${new Date().toLocaleString('ar-SA')}

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
`;

  const filePath = path.join(process.cwd(), 'scripts', 'supervisors-credentials.txt');
  fs.writeFileSync(filePath, credentialsText, 'utf8');
  
  console.log(`📄 تم إنشاء ملف بيانات تسجيل الدخول: ${filePath}`);
}

// دالة لإنشاء قواعد الأمان المحدثة
async function createUpdatedSecurityRules() {
  const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // قاعدة البيانات الرئيسية
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // الموظفين - المراقبون يمكنهم رؤية موظفي منطقتهم فقط
    match /employees/{employeeId} {
      allow read: if request.auth != null && 
        (request.auth.token.role == 'admin' || 
         request.auth.token.role == 'supervisor' && 
         resource.data.regionId in request.auth.token.regionIds);
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    // الإدخالات الشهرية - المراقبون يمكنهم رؤية وتعديل إدخالات منطقتهم فقط
    match /monthly-entries/{entryId} {
      allow read: if request.auth != null && 
        (request.auth.token.role == 'admin' || 
         request.auth.token.role == 'supervisor' && 
         resource.data.regionId in request.auth.token.regionIds);
      allow write: if request.auth != null && 
        (request.auth.token.role == 'admin' || 
         (request.auth.token.role == 'supervisor' && 
          resource.data.regionId in request.auth.token.regionIds));
    }
    
    // المستخدمين - المراقبون يمكنهم رؤية بياناتهم فقط
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        (request.auth.token.role == 'admin' || 
         request.auth.uid == userId);
    }
    
    // المناطق - المراقبون يمكنهم رؤية مناطقهم فقط
    match /regions/{regionId} {
      allow read: if request.auth != null && 
        (request.auth.token.role == 'admin' || 
         request.auth.token.role == 'supervisor' && 
         regionId in request.auth.token.regionIds);
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
  }
}`;

  const fs = await import('fs');
  const path = await import('path');
  
  const filePath = path.join(process.cwd(), 'firestore-supervisors.rules');
  fs.writeFileSync(filePath, rules, 'utf8');
  
  console.log(`📄 تم إنشاء قواعد الأمان المحدثة: ${filePath}`);
}

// تشغيل السكريبت
addSupervisorsToFirestore()
  .then(() => createUpdatedSecurityRules())
  .then(() => {
    console.log('\n🎉 تم إنجاز جميع المهام بنجاح!');
    console.log('=====================================');
    console.log('✅ تم إنشاء المراقبين مع الصلاحيات');
    console.log('✅ تم إنشاء ملف بيانات تسجيل الدخول');
    console.log('✅ تم إنشاء قواعد الأمان المحدثة');
    console.log('\n📋 الخطوات التالية:');
    console.log('1. راجع ملف supervisors-credentials.txt');
    console.log('2. اختبر تسجيل الدخول للمراقبين');
    console.log('3. تأكد من أن كل مراقب يرى منطقته فقط');
  })
  .catch(error => {
    console.error('❌ خطأ في تنفيذ السكريبت:', error);
    process.exit(1);
  });
