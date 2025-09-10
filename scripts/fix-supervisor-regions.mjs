// سكريبت إصلاح مناطق المراقبين
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  updateDoc,
  getDocs,
  collection,
  query
} from 'firebase/firestore';
import { config } from './firebase-config.mjs';

// تهيئة Firebase
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

// توزيع المراقبين على المناطق التي تحتوي على موظفين
const supervisorRegionMapping = {
  'laila@nazafati.com': ['region-default'], // 69 موظف
  'hanina@nazafati.com': ['region-3'], // 18 موظف
  'agriculture@nazafati.com': ['region-4'], // 11 موظف
  'camp@nazafati.com': ['region-5'], // 5 موظف
  'city-center@nazafati.com': ['region-default'], // مشاركة مع ليلى
  'cleaning@nazafati.com': ['region-default'], // مشاركة مع ليلى
  'messengers@nazafati.com': ['region-default'], // مشاركة مع ليلى
  'default1@nazafati.com': ['region-default'], // مشاركة مع ليلى
  'default2@nazafati.com': ['region-default'] // مشاركة مع ليلى
};

async function fixSupervisorRegions() {
  try {
    console.log('🔧 إصلاح مناطق المراقبين...');
    console.log('=====================================');
    
    // تسجيل الدخول كضيف
    await signInAnonymously(auth);
    console.log('✅ تم تسجيل الدخول كضيف');
    
    // جلب جميع المراقبين
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const supervisors = users.filter(user => user.role === 'supervisor');
    console.log(`👨‍💼 عدد المراقبين: ${supervisors.length}`);
    
    // تحديث مناطق كل مراقب
    for (const supervisor of supervisors) {
      const email = supervisor.email;
      const newRegions = supervisorRegionMapping[email];
      
      if (newRegions) {
        console.log(`\n🔄 تحديث ${supervisor.name} (${email})`);
        console.log(`   المناطق الجديدة: ${newRegions.join(', ')}`);
        
        try {
          await updateDoc(doc(db, 'users', supervisor.id), {
            regionIds: newRegions,
            assignedRegions: newRegions,
            regionNames: newRegions.map(regionId => {
              const regionNames = {
                'region-default': 'المنطقة الافتراضية',
                'region-3': 'حي الزراعة - أحمد سعيد',
                'region-4': 'المخيم - حمزة الكراملة',
                'region-5': 'وسط المدينة - عثمان الرفاعي'
              };
              return regionNames[regionId] || regionId;
            }),
            updatedAt: new Date()
          });
          
          console.log(`   ✅ تم التحديث بنجاح`);
        } catch (error) {
          console.error(`   ❌ خطأ في التحديث:`, error.message);
        }
      } else {
        console.log(`⚠️  لا توجد مناطق محددة لـ ${email}`);
      }
    }
    
    console.log('\n🎉 تم إصلاح مناطق المراقبين!');
    console.log('\n📊 التوزيع الجديد:');
    console.log('=====================================');
    
    Object.keys(supervisorRegionMapping).forEach(email => {
      const regions = supervisorRegionMapping[email];
      console.log(`${email}: ${regions.join(', ')}`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح مناطق المراقبين:', error);
  }
}

// تشغيل الإصلاح
fixSupervisorRegions();
