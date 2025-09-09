import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs,
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
let db: any;

try {
  db = initializeFirestore(app, {
    cacheSizeBytes: 50 * 1024 * 1024,
    ignoreUndefinedProperties: true
  });
} catch (error) {
  db = getFirestore(app);
}

// دالة للتحقق من البيانات المستوردة
async function verifyImport(): Promise<void> {
  try {
    console.log('🔍 التحقق من البيانات المستوردة...\n');
    
    // التحقق من المناطق
    console.log('📊 المناطق:');
    const regionsSnapshot = await getDocs(collection(db, 'regions'));
    console.log(`- عدد المناطق: ${regionsSnapshot.size}`);
    regionsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  ✓ ${data.name} (${doc.id})`);
    });
    
    // التحقق من المستخدمين
    console.log('\n👥 المستخدمين:');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`- عدد المستخدمين: ${usersSnapshot.size}`);
    
    const roleCounts: Record<string, number> = {};
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      roleCounts[data.role] = (roleCounts[data.role] || 0) + 1;
      console.log(`  ✓ ${data.name} (${data.role}) - ${data.email}`);
    });
    
    console.log('\n📈 توزيع المستخدمين حسب الدور:');
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`  - ${role}: ${count} مستخدم`);
    });
    
    // التحقق من الموظفين
    console.log('\n👷 الموظفين:');
    const employeesSnapshot = await getDocs(collection(db, 'employees'));
    console.log(`- عدد الموظفين: ${employeesSnapshot.size}`);
    
    const regionCounts: Record<string, number> = {};
    let totalSalary = 0;
    
    employeesSnapshot.forEach(doc => {
      const data = doc.data();
      regionCounts[data.regionId] = (regionCounts[data.regionId] || 0) + 1;
      totalSalary += data.baseSalary || 0;
    });
    
    console.log('\n🏢 توزيع الموظفين حسب المنطقة:');
    Object.entries(regionCounts).forEach(([regionId, count]) => {
      console.log(`  - ${regionId}: ${count} موظف`);
    });
    
    console.log(`\n💰 إجمالي الرواتب: ${totalSalary.toLocaleString()} دينار`);
    console.log(`📊 متوسط الراتب: ${Math.round(totalSalary / employeesSnapshot.size).toLocaleString()} دينار`);
    
    // التحقق من قواعد الرواتب
    console.log('\n⚙️ قواعد الرواتب:');
    const salaryRulesSnapshot = await getDocs(collection(db, 'salaryRules'));
    if (salaryRulesSnapshot.size > 0) {
      const rules = salaryRulesSnapshot.docs[0].data();
      console.log('  ✓ تم إضافة قواعد الرواتب بنجاح');
      console.log(`  - أيام الشهر المرجعية: ${rules.daysInMonthReference}`);
      console.log(`  - معامل العمل الإضافي: ${rules.overtimeFactor}`);
      console.log(`  - معامل العطل: ${rules.weekendFactor}`);
      console.log(`  - نوع التقريب: ${rules.rounding}`);
    } else {
      console.log('  ❌ لم يتم العثور على قواعد الرواتب');
    }
    
    // إحصائيات إضافية
    console.log('\n📋 إحصائيات إضافية:');
    console.log(`- إجمالي السجلات: ${regionsSnapshot.size + usersSnapshot.size + employeesSnapshot.size + salaryRulesSnapshot.size}`);
    console.log(`- متوسط الراتب للموظف: ${Math.round(totalSalary / employeesSnapshot.size).toLocaleString()} دينار`);
    
    // عرض عينة من الموظفين
    console.log('\n👷 عينة من الموظفين:');
    const sampleEmployees = employeesSnapshot.docs.slice(0, 5);
    sampleEmployees.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.name} (رقم ${data.jobNumber}) - ${data.baseSalary.toLocaleString()} دينار`);
    });
    
    console.log('\n✅ تم التحقق من جميع البيانات بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في التحقق من البيانات:', error);
  }
}

// تشغيل الدالة
verifyImport().catch(console.error);

export { verifyImport };
