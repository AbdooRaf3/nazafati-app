// سكريبت تحديث قواعد Firestore للمراقبين
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function updateFirestoreRules() {
  try {
    console.log('🔄 تحديث قواعد Firestore للمراقبين...');
    
    // نسخ ملف القواعد الجديد
    const sourceRules = join(__dirname, '..', 'firestore-supervisors-updated.rules');
    const targetRules = join(__dirname, '..', 'firestore.rules');
    
    const fs = await import('fs');
    const rulesContent = fs.readFileSync(sourceRules, 'utf8');
    fs.writeFileSync(targetRules, rulesContent, 'utf8');
    
    console.log('✅ تم نسخ قواعد الأمان الجديدة');
    
    // نشر القواعد إلى Firebase
    console.log('🚀 نشر قواعد الأمان إلى Firebase...');
    
    try {
      const { stdout, stderr } = await execAsync('firebase deploy --only firestore:rules');
      console.log('✅ تم نشر قواعد الأمان بنجاح');
      console.log(stdout);
      
      if (stderr) {
        console.log('⚠️  تحذيرات:', stderr);
      }
    } catch (deployError) {
      console.error('❌ خطأ في نشر قواعد الأمان:', deployError.message);
      console.log('💡 يمكنك نشر القواعد يدوياً باستخدام:');
      console.log('   firebase deploy --only firestore:rules');
    }
    
    console.log('\n🎉 تم تحديث قواعد الأمان!');
    console.log('الآن يمكن للمراقبين الوصول إلى موظفي منطقتهم');
    
  } catch (error) {
    console.error('❌ خطأ في تحديث قواعد الأمان:', error);
  }
}

// تشغيل التحديث
updateFirestoreRules();
