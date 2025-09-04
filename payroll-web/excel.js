import { collection, getDocs, query, where, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export function initExcel({ db }) {
  const monthKeyAdmin = document.getElementById('monthKeyAdmin');
  const btnExportExcel = document.getElementById('btnExportExcel');
  const exportLink = document.getElementById('exportLink');

  btnExportExcel?.addEventListener('click', async () => {
    const v = monthKeyAdmin.value; // 2025-05
    if (!v) { alert('اختر شهرًا'); return; }
    const [y, m] = v.split('-').map(Number);
    const monthKey = `${y}${String(m).padStart(2,'0')}`;

    // تحميل الإعدادات
    const sSnap = await getDoc(doc(db, 'settings', 'salaryRules'));
    const rules = sSnap.exists() ? sSnap.data() : { overtimeFactor: 0.5, weekendFactor: 1.0, rounding: 0.01 };

    // حساب عدد أيام الشهر الفعلية
    const daysInMonth = new Date(y, m, 0).getDate();

    // جلب العمال وكافة إدخالات الشهر المعتمدة أو المرسلة
    const empSnaps = await getDocs(collection(db, 'employees'));
    const empById = {};
    empSnaps.forEach((s) => empById[s.id] = { id: s.id, ...s.data() });

    const entrySnaps = await getDocs(query(collection(db, 'monthlyEntries'), where('monthKey', '==', monthKey)));
    const rows = [];
    entrySnaps.forEach((e) => {
      const d = e.data();
      const empId = e.id.split('_')[1];
      const emp = empById[empId];
      if (!emp) return;
      const daily = Number(emp.baseSalary) / daysInMonth;
      const total = daily * (Number(d.daysWorked||0) + Number(d.overtimeDays||0) * Number(rules.overtimeFactor||0) + Number(d.weekendDays||0) * Number(rules.weekendFactor||0));
      rows.push({
        seq: rows.length+1,
        name: emp.name,
        jobNumber: emp.jobNumber,
        region: emp.regionId,
        daysWorked: d.daysWorked||0,
        overtimeDays: d.overtimeDays||0,
        weekendDays: d.weekendDays||0,
        notes: d.notes||'',
        dailyWage: roundTo(daily, rules.rounding||0.01),
        total: roundTo(total, rules.rounding||0.01),
      });
    });

    // تحميل قالب Excel من Firestore
    const templateSnap = await getDoc(doc(db, 'templates', 'كشف_شهري'));
    if (!templateSnap.exists()) {
      alert('لم يتم العثور على قالب Excel. ارفعه أولاً من تبويب "قالب Excel"');
      return;
    }
    const base64 = templateSnap.data().data;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const ab = bytes.buffer;
    const wb = XLSX.read(ab, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];

    // الكتابة بدءًا من الصف 3 (يمكن تخصيصه حسب قالبكم)
    let r = 3;
    for (const row of rows) {
      XLSX.utils.sheet_add_aoa(ws, [[
        row.seq,
        row.name,
        row.jobNumber,
        row.region,
        row.daysWorked,
        row.overtimeDays,
        row.weekendDays,
        row.notes,
        row.dailyWage,
        row.total,
      ]], { origin: `A${r}` });
      r++;
    }

    const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
         // تحويل إلى Base64 وحفظ في Firestore
     const outputBytes = new Uint8Array(out);
     let outputBinary = '';
     for (let i = 0; i < outputBytes.length; i++) {
       outputBinary += String.fromCharCode(outputBytes[i]);
     }
     const outputBase64 = btoa(outputBinary);
    
         await setDoc(doc(db, 'payroll', monthKey), {
       data: outputBase64,
       fileName: `${monthKey}.xlsx`,
       contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
       monthKey: monthKey,
       rowsCount: rows.length,
       generatedAt: new Date().toISOString(),
     });
    
    // إنشاء رابط تنزيل مباشر
    const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    exportLink.href = url;
    exportLink.download = `كشف_شهري_${monthKey}.xlsx`;
    alert('تم توليد الكشف وحفظه في Firestore. اضغط "فتح آخر كشف" للتنزيل.');
  });
}

function roundTo(value, step) {
  if (!step || step <= 0) return Math.round(value * 100) / 100;
  return Math.round(value / step) * step;
}


