import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc,
  initializeFirestore
} from 'firebase/firestore';

// إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyByHh2_r9j1npQ-DQyaye9bbge4lEX5Go8",
  authDomain: "nazafati-system.firebaseapp.com",
  projectId: "nazafati-system",
  storageBucket: "nazafati-system.firebasestorage.app",
  messagingSenderId: "233027790289",
  appId: "1:233027790289:web:269414e8ed8f3091b5ecf0",
  measurementId: "G-MTQ23LS55N"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let db: any;

try {
  db = initializeFirestore(app, {
    cacheSizeBytes: 50 * 1024 * 1024,
    ignoreUndefinedProperties: true
  });
} catch (error) {
  db = getFirestore(app);
}

// بيانات المستخدمين المراد إنشاؤها
const usersToCreate = [
  {
    email: 'admin@madaba.gov.jo',
    password: 'Admin123!',
    name: 'مدير نظام نظافتي - بلدية مادبا',
    role: 'admin'
  },
  {
    email: 'finance@madaba.gov.jo',
    password: 'Finance123!',
    name: 'قسم الرواتب - بلدية مادبا',
    role: 'finance'
  },
  {
    email: 'supervisor1@madaba.gov.jo',
    password: 'Supervisor1!',
    name: 'أحمد محمد - مراقب المنطقة الشمالية',
    role: 'supervisor',
    regionId: 'region-1'
  },
  {
    email: 'supervisor2@madaba.gov.jo',
    password: 'Supervisor2!',
    name: 'فاطمة علي - مراقب المنطقة الجنوبية',
    role: 'supervisor',
    regionId: 'region-2'
  },
  {
    email: 'supervisor3@madaba.gov.jo',
    password: 'Supervisor3!',
    name: 'محمد حسن - مراقب المنطقة الشرقية',
    role: 'supervisor',
    regionId: 'region-3'
  },
  {
    email: 'supervisor4@madaba.gov.jo',
    password: 'Supervisor4!',
    name: 'سارة أحمد - مراقب المنطقة الغربية',
    role: 'supervisor',
    regionId: 'region-4'
  }
];

// دالة لإنشاء حساب مصادقة
async function createAuthAccount(email: string, password: string, userData: any): Promise<void> {
  try {
    console.log(`إنشاء حساب مصادقة لـ: ${email}`);
    
    // إنشاء الحساب في Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log(`✅ تم إنشاء حساب المصادقة: ${email}`);
    
    // إضافة بيانات المستخدم إلى Firestore
    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      uid: user.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`✅ تم إضافة بيانات المستخدم: ${userData.name}`);
    
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`⚠️ الحساب موجود مسبقاً: ${email}`);
    } else {
      console.error(`❌ خطأ في إنشاء حساب ${email}:`, error.message);
    }
  }
}

// الدالة الرئيسية
async function createAllAccounts(): Promise<void> {
  try {
    console.log('🚀 بدء إنشاء حسابات المصادقة...\n');
    
    for (const userData of usersToCreate) {
      const { email, password, ...restData } = userData;
      await createAuthAccount(email, password, restData);
      console.log(''); // سطر فارغ للفصل
    }
    
    console.log('🎉 تم إنشاء جميع الحسابات بنجاح!');
    console.log('\n🔑 بيانات تسجيل الدخول:');
    console.log('================================');
    
    usersToCreate.forEach(user => {
      console.log(`📧 ${user.email}`);
      console.log(`🔐 ${user.password}`);
      console.log(`👤 ${user.name}`);
      console.log(`🎭 ${user.role}`);
      if (user.regionId) {
        console.log(`🏢 ${user.regionId}`);
      }
      console.log('--------------------------------');
    });
    
    console.log('\n⚠️ مهم: احتفظ بكلمات المرور في مكان آمن!');
    console.log('💡 يمكنك تغيير كلمات المرور من لوحة تحكم Firebase Authentication');
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء الحسابات:', error);
  }
}

// تشغيل الدالة
createAllAccounts().catch(console.error);

export { createAllAccounts };
