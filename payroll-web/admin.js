import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export function initAdmin({ db }) {
  const empJobNumber = document.getElementById('empJobNumber');
  const empName = document.getElementById('empName');
  const empBaseSalary = document.getElementById('empBaseSalary');
  const empRegionId = document.getElementById('empRegionId');
  const btnSaveEmployee = document.getElementById('btnSaveEmployee');
  const btnResetEmployee = document.getElementById('btnResetEmployee');
  const filterRegion = document.getElementById('filterRegion');
  const btnReloadEmployees = document.getElementById('btnReloadEmployees');
  const employeesTableBody = document.querySelector('#employeesTable tbody');

  const overtimeFactor = document.getElementById('overtimeFactor');
  const weekendFactor = document.getElementById('weekendFactor');
  const rounding = document.getElementById('rounding');
  const btnSaveSettings = document.getElementById('btnSaveSettings');
  const settingsMsg = document.getElementById('settingsMsg');

  const templateFile = document.getElementById('templateFile');
  const btnUploadTemplate = document.getElementById('btnUploadTemplate');
  const templateMsg = document.getElementById('templateMsg');

  // تحميل الإعدادات الحالية
  (async function loadSettings() {
    const s = await getDoc(doc(db, 'settings', 'salaryRules'));
    if (s.exists()) {
      const d = s.data();
      overtimeFactor.value = d.overtimeFactor ?? 0.5; // نصف أجر لليوم الإضافي حسب اتفاق سابق
      weekendFactor.value = d.weekendFactor ?? 1.0;
      rounding.value = d.rounding ?? 0.01;
    } else {
      overtimeFactor.value = 0.5;
      weekendFactor.value = 1.0;
      rounding.value = 0.01;
    }
  })();

  btnSaveSettings?.addEventListener('click', async () => {
    await setDoc(doc(db, 'settings', 'salaryRules'), {
      overtimeFactor: Number(overtimeFactor.value),
      weekendFactor: Number(weekendFactor.value),
      rounding: Number(rounding.value),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    settingsMsg.textContent = 'تم حفظ الإعدادات.';
    setTimeout(() => settingsMsg.textContent = '', 2500);
  });

  async function loadEmployees() {
    employeesTableBody.innerHTML = '';
    const col = collection(db, 'employees');
    const q = filterRegion.value ? query(col, where('regionId', '==', filterRegion.value.trim())) : col;
    const snaps = await getDocs(q);
    snaps.forEach((docSnap) => {
      const d = docSnap.data();
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${d.jobNumber ?? ''}</td>
        <td>${d.name ?? ''}</td>
        <td>${d.baseSalary ?? ''}</td>
        <td>${d.regionId ?? ''}</td>
        <td>
          <button class="btn" data-id="${docSnap.id}">تحميل</button>
          <button class="btn danger" data-del="${docSnap.id}">حذف</button>
        </td>`;
      employeesTableBody.appendChild(tr);
    });

    // أزرار التحميل والحذف
    employeesTableBody.querySelectorAll('button[data-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const s = await getDoc(doc(db, 'employees', id));
        if (s.exists()) {
          const d = s.data();
          empJobNumber.value = d.jobNumber ?? '';
          empName.value = d.name ?? '';
          empBaseSalary.value = d.baseSalary ?? '';
          empRegionId.value = d.regionId ?? '';
          btnSaveEmployee.dataset.editId = id;
        }
      });
    });
    employeesTableBody.querySelectorAll('button[data-del]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-del');
        await deleteDoc(doc(db, 'employees', id));
        await loadEmployees();
      });
    });
  }

  btnReloadEmployees?.addEventListener('click', loadEmployees);
  loadEmployees();

  btnSaveEmployee?.addEventListener('click', async () => {
    const payload = {
      jobNumber: empJobNumber.value.trim(),
      name: empName.value.trim(),
      baseSalary: Number(empBaseSalary.value),
      regionId: empRegionId.value.trim(),
      status: 'active',
      updatedAt: new Date().toISOString(),
    };
    const editId = btnSaveEmployee.dataset.editId;
    if (editId) {
      await updateDoc(doc(db, 'employees', editId), payload);
    } else {
      await addDoc(collection(db, 'employees'), payload);
    }
    btnResetEmployee.click();
    await loadEmployees();
  });

  btnResetEmployee?.addEventListener('click', () => {
    empJobNumber.value = '';
    empName.value = '';
    empBaseSalary.value = '';
    empRegionId.value = '';
    delete btnSaveEmployee.dataset.editId;
  });

  // رفع قالب Excel
  btnUploadTemplate?.addEventListener('click', async () => {
    const file = templateFile.files?.[0];
    if (!file) { templateMsg.textContent = 'اختر ملف قالب .xlsx أولاً'; return; }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1]; // إزالة data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,
      await setDoc(doc(db, 'templates', 'كشف_شهري'), {
        data: base64,
        fileName: 'كشف_شهري.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadedAt: new Date().toISOString(),
      });
      templateMsg.textContent = 'تم حفظ القالب في Firestore';
    };
    reader.readAsDataURL(file);
  });

  // استيراد CSV شامل
  const csvImportFile = document.getElementById('csvImportFile');
  const btnImportCsvComprehensive = document.getElementById('btnImportCsvComprehensive');
  const csvImportMsg = document.getElementById('csvImportMsg');

  btnImportCsvComprehensive?.addEventListener('click', async () => {
    const file = csvImportFile.files?.[0];
    if (!file) { csvImportMsg.textContent = 'اختر ملف CSV أولاً'; return; }
    
    csvImportMsg.textContent = 'جاري الاستيراد...';
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) { csvImportMsg.textContent = 'ملف فارغ'; return; }

      // تحليل الرؤوس: الرقم, الموظف, اسم الموظف, عدد ايام العمل, الإضافي بعد الدوام, الجمع والعطل, الأعياد, المراقب والمنطقة, الراتب الاساسي, ملاحظات, مجموع الاضافي, مجموع الراتب
      const header = lines[0].split(',').map(h => h.trim());
      const idx = {
        jobNumber: header.findIndex(h => h.includes('الموظف') && !h.includes('اسم')),
        name: header.findIndex(h => h.includes('اسم')),
        baseSalary: header.findIndex(h => h.includes('الراتب')),
        supervisorRegion: header.findIndex(h => h.includes('المراقب') || h.includes('المنطقة')),
        daysWorked: header.findIndex(h => h.includes('عدد ايام العمل')),
        overtimeDays: header.findIndex(h => h.includes('الإضافي')),
        weekendDays: header.findIndex(h => h.includes('الجمع') || h.includes('العطل')),
        notes: header.findIndex(h => h.includes('ملاحظات')),
      };

      // تجميع المناطق والمراقبين
      const regions = new Set();
      const supervisors = new Map(); // region -> supervisor
      
      // تجميع العمال
      const employees = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length < 3) continue;
        
        const jobNumber = idx.jobNumber >= 0 ? cols[idx.jobNumber].trim() : '';
        const name = idx.name >= 0 ? cols[idx.name].trim() : '';
        const baseSalary = idx.baseSalary >= 0 ? parseFloat(cols[idx.baseSalary]) || 0 : 0;
        const supervisorRegion = idx.supervisorRegion >= 0 ? cols[idx.supervisorRegion].trim() : '';
        
        if (jobNumber && name) {
          // استخراج المنطقة من "المراقب - المنطقة"
          let regionId = supervisorRegion;
          if (supervisorRegion.includes('-')) {
            const parts = supervisorRegion.split('-').map(p => p.trim());
            if (parts.length >= 2) {
              regionId = parts[1]; // الجزء الثاني بعد "-"
            }
          }
          
          regions.add(regionId);
          supervisors.set(regionId, supervisorRegion);
          
          employees.push({
            jobNumber,
            name,
            baseSalary,
            regionId,
            status: 'active',
            importedFrom: 'csv-2025-05',
            importedAt: new Date().toISOString(),
          });
        }
      }

      // إنشاء المناطق
      for (const regionId of regions) {
        if (regionId) {
          await setDoc(doc(db, 'regions', regionId), {
            name: regionId,
            supervisor: supervisors.get(regionId) || '',
            createdAt: new Date().toISOString(),
          }, { merge: true });
        }
      }

      // إنشاء العمال
      let createdCount = 0;
      for (const emp of employees) {
        try {
          await addDoc(collection(db, 'employees'), emp);
          createdCount++;
        } catch (e) {
          console.log('خطأ في إنشاء عامل:', emp.name, e);
        }
      }

      csvImportMsg.textContent = `تم استيراد ${createdCount} عامل و ${regions.size} منطقة`;
      setTimeout(() => csvImportMsg.textContent = '', 5000);
      
      // تحديث قائمة العمال
      await loadEmployees();
      
    } catch (e) {
      csvImportMsg.textContent = `خطأ في الاستيراد: ${e.message}`;
      console.error('خطأ CSV:', e);
    }
  });
}


