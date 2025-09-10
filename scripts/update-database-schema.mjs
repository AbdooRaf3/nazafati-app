// سكريبت تحديث قاعدة البيانات لتتماشى مع المعادلات الجديدة
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { config } from './firebase-config.mjs';

console.log('🔄 بدء تحديث قاعدة البيانات...');
console.log('===============================');

// تهيئة Firebase
const app = initializeApp(config);
const db = getFirestore(app);

// دالة لتحديث الإدخالات الشهرية
async function updateMonthlyEntries() {
  console.log('\n📝 تحديث الإدخالات الشهرية...');
  
  try {
    // جلب جميع الإدخالات الشهرية
    const entriesRef = collection(db, 'monthly-entries');
    const snapshot = await getDocs(entriesRef);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const docSnapshot of snapshot.docs) {
      const entry = docSnapshot.data();
      const entryId = docSnapshot.id;
      
      // التحقق من وجود الحقول الجديدة
      const hasNewFields = entry.holidays !== undefined && 
                          entry.fridaysAndHolidays !== undefined && 
                          entry.overtimeAfterReference !== undefined && 
                          entry.daysInMonth !== undefined;
      
      if (hasNewFields) {
        console.log(`  ⏭️  تم تخطي الإدخال ${entryId} - يحتوي على الحقول الجديدة بالفعل`);
        skippedCount++;
        continue;
      }
      
      // إضافة الحقول الجديدة بالقيم الافتراضية
      const updateData = {
        holidays: 0,
        fridaysAndHolidays: 0,
        overtimeAfterReference: 0,
        daysInMonth: 31,
        // تحديث totals لتشمل الحقول الجديدة
        totals: {
          ...entry.totals,
          totalOvertime: 0,
          totalSalary: 0,
          netSalary: entry.totals?.total || 0
        }
      };
      
      await updateDoc(doc(db, 'monthly-entries', entryId), updateData);
      console.log(`  ✅ تم تحديث الإدخال ${entryId}`);
      updatedCount++;
    }
    
    console.log(`\n📊 ملخص تحديث الإدخالات الشهرية:`);
    console.log(`  - تم تحديث: ${updatedCount} إدخال`);
    console.log(`  - تم تخطي: ${skippedCount} إدخال`);
    
  } catch (error) {
    console.error('❌ خطأ في تحديث الإدخالات الشهرية:', error);
    throw error;
  }
}

// دالة لتحديث قواعد الرواتب
async function updateSalaryRules() {
  console.log('\n⚙️  تحديث قواعد الرواتب...');
  
  try {
    const salaryRulesRef = doc(db, 'salaryRules', 'salaryRules');
    
    // التحقق من وجود قواعد الرواتب
    const snapshot = await getDocs(collection(db, 'salaryRules'));
    
    if (snapshot.empty) {
      console.log('  ℹ️  لا توجد قواعد رواتب موجودة، سيتم إنشاؤها عند الحاجة');
      return;
    }
    
    // قواعد الرواتب الحالية لا تحتاج تحديث لأنها مستقلة عن المعادلات الجديدة
    console.log('  ✅ قواعد الرواتب لا تحتاج تحديث');
    
  } catch (error) {
    console.error('❌ خطأ في تحديث قواعد الرواتب:', error);
    throw error;
  }
}

// دالة لإنشاء فهارس جديدة
async function createNewIndexes() {
  console.log('\n🔍 إنشاء فهارس جديدة...');
  
  try {
    // الفهارس الجديدة ستتم إضافتها عبر firestore.indexes.json
    console.log('  ℹ️  سيتم تحديث الفهارس عبر ملف firestore.indexes.json');
    
    // يمكن إضافة فهارس جديدة هنا إذا لزم الأمر
    const newIndexes = [
      {
        collectionGroup: "monthly-entries",
        queryScope: "COLLECTION",
        fields: [
          { fieldPath: "monthKey", order: "ASCENDING" },
          { fieldPath: "regionId", order: "ASCENDING" },
          { fieldPath: "status", order: "ASCENDING" }
        ]
      },
      {
        collectionGroup: "monthly-entries",
        queryScope: "COLLECTION", 
        fields: [
          { fieldPath: "monthKey", order: "ASCENDING" },
          { fieldPath: "holidays", order: "ASCENDING" }
        ]
      }
    ];
    
    console.log('  ✅ تم تحديد الفهارس الجديدة');
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء الفهارس:', error);
    throw error;
  }
}

// دالة رئيسية لتشغيل جميع التحديثات
async function updateDatabase() {
  try {
    console.log('🚀 بدء عملية تحديث قاعدة البيانات...');
    
    // تحديث الإدخالات الشهرية
    await updateMonthlyEntries();
    
    // تحديث قواعد الرواتب
    await updateSalaryRules();
    
    // إنشاء فهارس جديدة
    await createNewIndexes();
    
    console.log('\n🎉 تم تحديث قاعدة البيانات بنجاح!');
    console.log('================================');
    console.log('✅ تم إضافة الحقول الجديدة:');
    console.log('  - holidays (عدد العطل)');
    console.log('  - fridaysAndHolidays (الجمع والعطل)');
    console.log('  - overtimeAfterReference (الإضافي بعد المرجع)');
    console.log('  - daysInMonth (أيام الشهر)');
    console.log('✅ تم تحديث totals لتشمل:');
    console.log('  - totalOvertime (إجمالي الإضافي)');
    console.log('  - totalSalary (إجمالي الراتب)');
    console.log('  - netSalary (صافي الراتب)');
    
  } catch (error) {
    console.error('\n💥 فشل في تحديث قاعدة البيانات:', error);
    process.exit(1);
  }
}

// تشغيل التحديث
updateDatabase();
