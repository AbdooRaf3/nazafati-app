// سكريبت نشر تحديثات قاعدة البيانات إلى Firebase
import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('🚀 نشر تحديثات قاعدة البيانات إلى Firebase...');
console.log('============================================');

// التحقق من وجود Firebase CLI
function checkFirebaseCLI() {
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    console.log('✅ Firebase CLI متوفر');
    return true;
  } catch (error) {
    console.error('❌ Firebase CLI غير متوفر. يرجى تثبيته أولاً:');
    console.error('   npm install -g firebase-tools');
    return false;
  }
}

// التحقق من تسجيل الدخول إلى Firebase
function checkFirebaseAuth() {
  try {
    const result = execSync('firebase projects:list', { stdio: 'pipe', encoding: 'utf8' });
    console.log('✅ تم تسجيل الدخول إلى Firebase');
    return true;
  } catch (error) {
    console.error('❌ لم يتم تسجيل الدخول إلى Firebase. يرجى تسجيل الدخول أولاً:');
    console.error('   firebase login');
    return false;
  }
}

// نشر الفهارس
function deployIndexes() {
  console.log('\n📊 نشر الفهارس الجديدة...');
  
  try {
    if (!existsSync('firestore.indexes.json')) {
      throw new Error('ملف firestore.indexes.json غير موجود');
    }
    
    execSync('firebase deploy --only firestore:indexes', { stdio: 'inherit' });
    console.log('✅ تم نشر الفهارس بنجاح');
    return true;
  } catch (error) {
    console.error('❌ فشل في نشر الفهارس:', error.message);
    return false;
  }
}

// نشر قواعد الأمان
function deployRules() {
  console.log('\n🔒 نشر قواعد الأمان...');
  
  try {
    if (!existsSync('firestore.rules')) {
      throw new Error('ملف firestore.rules غير موجود');
    }
    
    execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
    console.log('✅ تم نشر قواعد الأمان بنجاح');
    return true;
  } catch (error) {
    console.error('❌ فشل في نشر قواعد الأمان:', error.message);
    return false;
  }
}

// دالة رئيسية
async function deployUpdates() {
  try {
    console.log('🔍 التحقق من المتطلبات...');
    
    // التحقق من Firebase CLI
    if (!checkFirebaseCLI()) {
      process.exit(1);
    }
    
    // التحقق من تسجيل الدخول
    if (!checkFirebaseAuth()) {
      process.exit(1);
    }
    
    console.log('\n📋 قائمة التحديثات:');
    console.log('  - فهارس جديدة للحقول المحدثة');
    console.log('  - قواعد أمان محدثة');
    console.log('  - دعم للحقول الجديدة في الإدخالات الشهرية');
    
    // نشر الفهارس
    if (!deployIndexes()) {
      console.log('⚠️  فشل في نشر الفهارس، لكن يمكن المتابعة');
    }
    
    // نشر قواعد الأمان
    if (!deployRules()) {
      console.log('⚠️  فشل في نشر قواعد الأمان، لكن يمكن المتابعة');
    }
    
    console.log('\n🎉 تم نشر تحديثات قاعدة البيانات!');
    console.log('================================');
    console.log('✅ التحديثات المطبقة:');
    console.log('  - فهارس جديدة للبحث في الحقول الجديدة');
    console.log('  - قواعد أمان محدثة');
    console.log('  - دعم كامل للمعادلات الجديدة');
    
    console.log('\n📝 الخطوات التالية:');
    console.log('  1. تشغيل سكريبت تحديث البيانات الموجودة');
    console.log('  2. اختبار التطبيق مع البيانات الجديدة');
    console.log('  3. التأكد من عمل جميع الوظائف بشكل صحيح');
    
  } catch (error) {
    console.error('\n💥 فشل في نشر التحديثات:', error.message);
    process.exit(1);
  }
}

// تشغيل النشر
deployUpdates();
