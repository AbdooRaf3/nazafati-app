// سكريبت تحليل المناطق من ملف Excel
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// الحصول على مسار الملف الحالي
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// دالة لتحليل المناطق
function analyzeRegions(data) {
  console.log('🔍 تحليل المناطق من البيانات...');
  console.log('=====================================');
  
  // عرض أسماء الأعمدة
  if (data.length > 0) {
    console.log('📋 أسماء الأعمدة الموجودة:');
    Object.keys(data[0]).forEach((key, index) => {
      console.log(`   ${index + 1}. ${key}`);
    });
  }
  
  // تحليل المناطق
  const regionStats = {};
  const supervisorStats = {};
  
  data.forEach((row, index) => {
    // البحث عن عمود المنطقة أو المراقب
    const regionColumn = Object.keys(row).find(key => 
      key.includes('منطقة') || key.includes('region') || 
      key.includes('المراقب') || key.includes('supervisor')
    );
    
    if (regionColumn) {
      const regionValue = row[regionColumn];
      if (regionValue && regionValue.toString().trim()) {
        if (!regionStats[regionValue]) {
          regionStats[regionValue] = [];
        }
        regionStats[regionValue].push({
          index: index + 1,
          data: row
        });
      }
    }
    
    // البحث عن عمود المراقب
    const supervisorColumn = Object.keys(row).find(key => 
      key.includes('مراقب') || key.includes('supervisor') || 
      key.includes('مدير') || key.includes('manager')
    );
    
    if (supervisorColumn) {
      const supervisorValue = row[supervisorColumn];
      if (supervisorValue && supervisorValue.toString().trim()) {
        if (!supervisorStats[supervisorValue]) {
          supervisorStats[supervisorValue] = [];
        }
        supervisorStats[supervisorValue].push({
          index: index + 1,
          data: row
        });
      }
    }
  });
  
  // عرض إحصائيات المناطق
  console.log('\n🏢 إحصائيات المناطق:');
  console.log('=====================================');
  Object.keys(regionStats).forEach(region => {
    console.log(`\n📍 ${region}: ${regionStats[region].length} موظف`);
    if (regionStats[region].length <= 5) {
      regionStats[region].forEach(item => {
        const name = item.data[Object.keys(item.data).find(key => 
          key.includes('اسم') || key.includes('name')
        )] || 'غير محدد';
        console.log(`   - ${name} (صف ${item.index})`);
      });
    } else {
      console.log(`   أول 5 موظفين:`);
      regionStats[region].slice(0, 5).forEach(item => {
        const name = item.data[Object.keys(item.data).find(key => 
          key.includes('اسم') || key.includes('name')
        )] || 'غير محدد';
        console.log(`   - ${name} (صف ${item.index})`);
      });
      console.log(`   ... و ${regionStats[region].length - 5} موظف آخر`);
    }
  });
  
  // عرض إحصائيات المراقبين
  console.log('\n👨‍💼 إحصائيات المراقبين:');
  console.log('=====================================');
  Object.keys(supervisorStats).forEach(supervisor => {
    console.log(`\n👤 ${supervisor}: ${supervisorStats[supervisor].length} موظف`);
    if (supervisorStats[supervisor].length <= 5) {
      supervisorStats[supervisor].forEach(item => {
        const name = item.data[Object.keys(item.data).find(key => 
          key.includes('اسم') || key.includes('name')
        )] || 'غير محدد';
        console.log(`   - ${name} (صف ${item.index})`);
      });
    } else {
      console.log(`   أول 5 موظفين:`);
      supervisorStats[supervisor].slice(0, 5).forEach(item => {
        const name = item.data[Object.keys(item.data).find(key => 
          key.includes('اسم') || key.includes('name')
        )] || 'غير محدد';
        console.log(`   - ${name} (صف ${item.index})`);
      });
      console.log(`   ... و ${supervisorStats[supervisor].length - 5} موظف آخر`);
    }
  });
  
  return {
    regions: regionStats,
    supervisors: supervisorStats,
    totalRows: data.length
  };
}

// دالة لإنشاء خريطة المناطق
function createRegionMapping(analysis) {
  console.log('\n🗺️ إنشاء خريطة المناطق...');
  console.log('=====================================');
  
  const regionMapping = {};
  const supervisorMapping = {};
  
  // إنشاء معرفات للمناطق
  let regionCounter = 1;
  Object.keys(analysis.regions).forEach(regionName => {
    const regionId = `region-${regionCounter}`;
    regionMapping[regionName] = {
      id: regionId,
      name: regionName,
      count: analysis.regions[regionName].length
    };
    regionCounter++;
  });
  
  // إنشاء معرفات للمراقبين
  let supervisorCounter = 1;
  Object.keys(analysis.supervisors).forEach(supervisorName => {
    const supervisorId = `supervisor-${supervisorCounter}`;
    supervisorMapping[supervisorName] = {
      id: supervisorId,
      name: supervisorName,
      count: analysis.supervisors[supervisorName].length
    };
    supervisorCounter++;
  });
  
  console.log('🏢 خريطة المناطق:');
  Object.keys(regionMapping).forEach(regionName => {
    const region = regionMapping[regionName];
    console.log(`   ${regionName} → ${region.id} (${region.count} موظف)`);
  });
  
  console.log('\n👨‍💼 خريطة المراقبين:');
  Object.keys(supervisorMapping).forEach(supervisorName => {
    const supervisor = supervisorMapping[supervisorName];
    console.log(`   ${supervisorName} → ${supervisor.id} (${supervisor.count} موظف)`);
  });
  
  return { regionMapping, supervisorMapping };
}

// الدالة الرئيسية
async function analyzeExcelRegions() {
  try {
    const filePath = 'C:\\Users\\skyli\\nazafati-app\\nazafati-app\\8-2025.xlsx';
    
    console.log('🔍 تحليل المناطق من ملف Excel...');
    console.log(`📁 الملف: ${filePath}`);
    console.log('=====================================');
    
    // قراءة ملف Excel
    const data = readExcelFile(filePath);
    
    // تحليل المناطق
    const analysis = analyzeRegions(data);
    
    // إنشاء خريطة المناطق
    const mapping = createRegionMapping(analysis);
    
    console.log('\n📊 ملخص التحليل:');
    console.log('=====================================');
    console.log(`📈 إجمالي الصفوف: ${analysis.totalRows}`);
    console.log(`🏢 عدد المناطق: ${Object.keys(analysis.regions).length}`);
    console.log(`👨‍💼 عدد المراقبين: ${Object.keys(analysis.supervisors).length}`);
    
    return {
      data,
      analysis,
      mapping
    };
    
  } catch (error) {
    console.error('❌ خطأ في تحليل الملف:', error);
    throw error;
  }
}

// تشغيل التحليل
analyzeExcelRegions();
