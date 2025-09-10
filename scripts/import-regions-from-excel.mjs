// سكريبت استيراد المناطق والمراقبين من ملف Excel
import XLSX from 'xlsx';
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

// دالة لقراءة ملف Excel
function readExcelFile(filePath) {
  try {
    console.log('📖 قراءة ملف Excel...');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`✅ تم قراءة ${data.length} صف من الملف`);
    return data;
  } catch (error) {
    console.error('❌ خطأ في قراءة ملف Excel:', error);
    throw error;
  }
}

// دالة لإنشاء معرفات فريدة
function createUniqueId(name, type) {
  const cleanName = name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '').toLowerCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${type}-${cleanName}-${timestamp}`;
}

// دالة لإنشاء المناطق
async function createRegions(data) {
  console.log('🏢 إنشاء المناطق...');
  
  const regionMap = new Map();
  const regions = [];
  
  data.forEach((row, index) => {
    const regionName = row.regionId || row.region || 'منطقة غير محددة';
    
    if (!regionMap.has(regionName)) {
      const regionId = createUniqueId(regionName, 'region');
      const region = {
        id: regionId,
        name: regionName,
        description: `منطقة ${regionName}`,
        employeeCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      regionMap.set(regionName, region);
      regions.push(region);
    }
    
    // زيادة عدد الموظفين
    const region = regionMap.get(regionName);
    region.employeeCount++;
  });
  
  console.log(`📊 تم إنشاء ${regions.length} منطقة`);
  
  // حفظ المناطق في Firestore
  for (const region of regions) {
    try {
      await setDoc(doc(db, 'regions', region.id), region);
      console.log(`✅ تم إنشاء المنطقة: ${region.name} (${region.employeeCount} موظف)`);
    } catch (error) {
      console.error(`❌ خطأ في إنشاء المنطقة ${region.name}:`, error.message);
    }
  }
  
  return regionMap;
}

// دالة لإنشاء المراقبين
async function createSupervisors(data, regionMap) {
  console.log('👨‍💼 إنشاء المراقبين...');
  
  const supervisorMap = new Map();
  const supervisors = [];
  
  data.forEach((row, index) => {
    const supervisorName = row.supervisor || 'مراقب غير محدد';
    const regionName = row.regionId || row.region || 'منطقة غير محددة';
    const region = regionMap.get(regionName);
    
    if (!supervisorMap.has(supervisorName)) {
      const supervisorId = createUniqueId(supervisorName, 'supervisor');
      const email = `${supervisorId}@nazafati.com`;
      const password = `${supervisorName.replace(/\s+/g, '')}2025!`;
      
      const supervisor = {
        uid: supervisorId,
        name: supervisorName,
        email: email,
        password: password,
        role: 'supervisor',
        regionIds: region ? [region.id] : [],
        regionNames: region ? [region.name] : [],
        assignedRegions: region ? [region.id] : [],
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
        lastLogin: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      supervisorMap.set(supervisorName, supervisor);
      supervisors.push(supervisor);
    } else {
      // إضافة المنطقة الإضافية للمراقب الموجود
      const supervisor = supervisorMap.get(supervisorName);
      if (region && !supervisor.regionIds.includes(region.id)) {
        supervisor.regionIds.push(region.id);
        supervisor.regionNames.push(region.name);
        supervisor.assignedRegions.push(region.id);
      }
    }
  });
  
  console.log(`📊 تم إنشاء ${supervisors.length} مراقب`);
  
  // حفظ المراقبين في Firestore
  for (const supervisor of supervisors) {
    try {
      await setDoc(doc(db, 'users', supervisor.uid), supervisor);
      console.log(`✅ تم إنشاء المراقب: ${supervisor.name} (${supervisor.regionIds.length} منطقة)`);
      console.log(`   📧 الإيميل: ${supervisor.email}`);
      console.log(`   🔑 كلمة المرور: ${supervisor.password}`);
      console.log(`   🏢 المناطق: ${supervisor.regionNames.join(', ')}`);
    } catch (error) {
      console.error(`❌ خطأ في إنشاء المراقب ${supervisor.name}:`, error.message);
    }
  }
  
  return supervisorMap;
}

// دالة لتحديث الموظفين بالمناطق الجديدة
async function updateEmployeesWithRegions(data, regionMap, supervisorMap) {
  console.log('👥 تحديث الموظفين بالمناطق الجديدة...');
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const row of data) {
    try {
      const jobNumber = row.jobNumber || row.رقم_الوظيفة || row.رقم || 'غير محدد';
      const regionName = row.regionId || row.region || 'منطقة غير محددة';
      const supervisorName = row.supervisor || 'مراقب غير محدد';
      
      const region = regionMap.get(regionName);
      const supervisor = supervisorMap.get(supervisorName);
      
      if (region && supervisor) {
        // البحث عن الموظف في قاعدة البيانات
        const employeesQuery = query(
          collection(db, 'employees'),
          where('jobNumber', '==', jobNumber.toString())
        );
        
        const snapshot = await getDocs(employeesQuery);
        
        if (!snapshot.empty) {
          const employeeDoc = snapshot.docs[0];
          await setDoc(doc(db, 'employees', employeeDoc.id), {
            ...employeeDoc.data(),
            regionId: region.id,
            regionName: region.name,
            supervisorId: supervisor.uid,
            supervisorName: supervisor.name,
            updatedAt: serverTimestamp()
          }, { merge: true });
          
          updatedCount++;
          console.log(`✅ تم تحديث الموظف: ${row.name || 'غير محدد'} (${jobNumber}) → ${region.name}`);
        } else {
          console.log(`⚠️  لم يتم العثور على الموظف: ${jobNumber}`);
        }
      } else {
        console.log(`⚠️  لم يتم العثور على المنطقة أو المراقب للموظف: ${jobNumber}`);
      }
    } catch (error) {
      errorCount++;
      console.error(`❌ خطأ في تحديث الموظف ${row.jobNumber}:`, error.message);
    }
  }
  
  console.log(`\n📊 ملخص تحديث الموظفين:`);
  console.log(`✅ تم التحديث: ${updatedCount} موظف`);
  console.log(`❌ أخطاء: ${errorCount} موظف`);
}

// دالة لإنشاء حسابات المراقبين في Firebase Authentication
async function createSupervisorAccounts(supervisors) {
  console.log('🔐 إنشاء حسابات المراقبين في Firebase Authentication...');
  
  const { createUserWithEmailAndPassword } = await import('firebase/auth');
  
  for (const supervisor of supervisors) {
    try {
      console.log(`🔄 إنشاء حساب ${supervisor.name}...`);
      
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        supervisor.email, 
        supervisor.password
      );
      
      console.log(`✅ تم إنشاء حساب المصادقة: ${supervisor.email}`);
      
      // تحديث UID في Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        ...supervisor,
        uid: userCredential.user.uid,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️  الحساب موجود مسبقاً: ${supervisor.email}`);
      } else {
        console.error(`❌ خطأ في إنشاء حساب ${supervisor.name}:`, error.message);
      }
    }
  }
}

// الدالة الرئيسية
async function importRegionsFromExcel() {
  try {
    console.log('🚀 بدء استيراد المناطق والمراقبين من Excel...');
    console.log('===============================================');
    
    const filePath = 'C:\\Users\\skyli\\nazafati-app\\nazafati-app\\8-2025.xlsx';
    
    // تسجيل الدخول كضيف
    await signInAnonymously(auth);
    console.log('✅ تم تسجيل الدخول إلى Firebase');
    
    // قراءة ملف Excel
    const data = readExcelFile(filePath);
    
    // إنشاء المناطق
    const regionMap = await createRegions(data);
    
    // إنشاء المراقبين
    const supervisorMap = await createSupervisors(data, regionMap);
    
    // تحديث الموظفين بالمناطق الجديدة
    await updateEmployeesWithRegions(data, regionMap, supervisorMap);
    
    // إنشاء حسابات المراقبين
    const supervisors = Array.from(supervisorMap.values());
    await createSupervisorAccounts(supervisors);
    
    console.log('\n🎉 تم إنجاز جميع المهام بنجاح!');
    console.log('===============================================');
    console.log(`🏢 تم إنشاء ${regionMap.size} منطقة`);
    console.log(`👨‍💼 تم إنشاء ${supervisorMap.size} مراقب`);
    console.log(`👥 تم تحديث الموظفين بالمناطق الجديدة`);
    console.log(`🔐 تم إنشاء حسابات المراقبين`);
    
    // إنشاء ملف بيانات تسجيل الدخول
    await createLoginCredentialsFile(supervisors);
    
  } catch (error) {
    console.error('❌ خطأ في استيراد البيانات:', error);
    throw error;
  }
}

// دالة لإنشاء ملف بيانات تسجيل الدخول
async function createLoginCredentialsFile(supervisors) {
  const fs = await import('fs');
  const path = await import('path');
  
  const credentials = supervisors.map((supervisor, index) => ({
    name: supervisor.name,
    email: supervisor.email,
    password: supervisor.password,
    regions: supervisor.regionNames.join(', '),
    permissions: Object.keys(supervisor.permissions)
      .filter(key => supervisor.permissions[key])
      .join(', ')
  }));
  
  const credentialsText = `# بيانات تسجيل الدخول للمراقبين الجدد
# تاريخ الإنشاء: ${new Date().toLocaleString('ar-SA')}
# تم استيرادها من ملف Excel

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

  const filePath = path.join(process.cwd(), 'scripts', 'supervisors-credentials-excel-import.txt');
  fs.writeFileSync(filePath, credentialsText, 'utf8');
  
  console.log(`📄 تم إنشاء ملف بيانات تسجيل الدخول: ${filePath}`);
}

// تشغيل الاستيراد
importRegionsFromExcel();
