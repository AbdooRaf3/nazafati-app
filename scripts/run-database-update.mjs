// سكريبت شامل لتحديث قاعدة البيانات
import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('🎯 سكريبت تحديث قاعدة البيانات الشامل');
console.log('=====================================');

// دالة لتشغيل أمر مع معالجة الأخطاء
function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} - تم بنجاح`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} - فشل:`, error.message);
    return false;
  }
}

// دالة للتحقق من وجود الملفات المطلوبة
function checkRequiredFiles() {
  console.log('\n🔍 التحقق من الملفات المطلوبة...');
  
  const requiredFiles = [
    'firestore.indexes.json',
    'firestore.rules',
    'scripts/firebase-config.mjs'
  ];
  
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    if (existsSync(file)) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} - غير موجود`);
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

// دالة رئيسية
async function runDatabaseUpdate() {
  try {
    console.log('🚀 بدء عملية تحديث قاعدة البيانات...');
    
    // التحقق من الملفات المطلوبة
    if (!checkRequiredFiles()) {
      console.log('\n❌ بعض الملفات المطلوبة غير موجودة. يرجى التحقق من الملفات.');
      process.exit(1);
    }
    
    // قائمة الأوامر للتشغيل
    const commands = [
      {
        command: 'firebase --version',
        description: 'التحقق من Firebase CLI'
      },
      {
        command: 'firebase projects:list',
        description: 'التحقق من تسجيل الدخول'
      },
      {
        command: 'firebase deploy --only firestore:indexes',
        description: 'نشر الفهارس الجديدة'
      },
      {
        command: 'firebase deploy --only firestore:rules',
        description: 'نشر قواعد الأمان'
      }
    ];
    
    // تشغيل الأوامر
    let allSuccessful = true;
    
    for (const cmd of commands) {
      if (!runCommand(cmd.command, cmd.description)) {
        allSuccessful = false;
        console.log(`⚠️  فشل في: ${cmd.description}`);
      }
    }
    
    // عرض النتائج
    console.log('\n📊 ملخص النتائج:');
    console.log('================');
    
    if (allSuccessful) {
      console.log('🎉 تم تحديث قاعدة البيانات بنجاح!');
      console.log('\n📝 الخطوات التالية:');
      console.log('  1. تشغيل: node scripts/update-database-schema.mjs');
      console.log('  2. اختبار التطبيق');
      console.log('  3. التحقق من صحة الحسابات');
    } else {
      console.log('⚠️  تم تحديث بعض الأجزاء، لكن هناك مشاكل');
      console.log('\n🔧 يرجى:');
      console.log('  1. مراجعة الأخطاء أعلاه');
      console.log('  2. حل المشاكل');
      console.log('  3. إعادة تشغيل السكريبت');
    }
    
  } catch (error) {
    console.error('\n💥 خطأ في تشغيل السكريبت:', error.message);
    process.exit(1);
  }
}

// تشغيل السكريبت
runDatabaseUpdate();
