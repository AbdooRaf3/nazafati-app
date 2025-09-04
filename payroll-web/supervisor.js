import { collection, query, where, getDocs, doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export function initSupervisor({ db, uid, regionId }) {
  const monthKeyInput = document.getElementById('monthKey');
  const btnLoad = document.getElementById('btnLoadEmployeesForRegion');
  const btnSaveAll = document.getElementById('btnSaveAllEntries');
  const tbody = document.querySelector('#entriesTable tbody');
  const csvFile = document.getElementById('csvFile');
  const btnImportCsv = document.getElementById('btnImportCsv');

  function ymFromInput() {
    const v = monthKeyInput.value; // مثل 2025-05
    if (!v) return null;
    const [y, m] = v.split('-').map(Number);
    return { y, m, key: `${y}${String(m).padStart(2,'0')}` };
  }

  btnLoad?.addEventListener('click', async () => {
    const ym = ymFromInput();
    if (!ym) return;
    tbody.innerHTML = '';
    // تحميل العمال في المنطقة
    const q = query(collection(db, 'employees'), where('regionId', '==', regionId));
    const snaps = await getDocs(q);
    let i = 1;
    snaps.forEach((s) => {
      const d = s.data();
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i++}</td>
        <td>${d.name}</td>
        <td>${d.jobNumber}</td>
        <td><input class="num" type="number" min="0" step="1" data-field="daysWorked" data-emp="${s.id}" value="0"/></td>
        <td><input class="num" type="number" min="0" step="1" data-field="overtimeDays" data-emp="${s.id}" value="0"/></td>
        <td><input class="num" type="number" min="0" step="1" data-field="weekendDays" data-emp="${s.id}" value="0"/></td>
        <td><input type="text" data-field="notes" data-emp="${s.id}" /></td>
        <td class="est-total" data-emp="${s.id}">0</td>`;
      tbody.appendChild(tr);
    });

    // حساب تقديري فوري عند التعديل
    tbody.querySelectorAll('input.num').forEach(inp => inp.addEventListener('input', () => updateRowEstimate(inp.closest('tr'))));
  });

  btnSaveAll?.addEventListener('click', async () => {
    const ym = ymFromInput();
    if (!ym) return;
    const inputs = tbody.querySelectorAll('input');
    const byEmp = {};
    inputs.forEach((inp) => {
      const emp = inp.getAttribute('data-emp');
      const field = inp.getAttribute('data-field');
      byEmp[emp] = byEmp[emp] || { daysWorked:0, overtimeDays:0, weekendDays:0, notes:'' };
      if (field === 'notes') byEmp[emp].notes = inp.value;
      else byEmp[emp][field] = Number(inp.value);
    });
    const saves = Object.entries(byEmp).map(([empId, v]) =>
      setDoc(doc(db, 'monthlyEntries', `${ym.key}_${empId}`), {
        ...v,
        monthKey: ym.key,
        regionId,
        status: 'submitted',
        updatedAt: new Date().toISOString(),
      }, { merge: true })
    );
    await Promise.all(saves);
    alert('تم حفظ الإدخالات');
  });

  // استيراد CSV وفق الأعمدة العربية المعطاة
  btnImportCsv?.addEventListener('click', async () => {
    const ym = ymFromInput();
    if (!ym) { alert('اختر شهرًا'); return; }
    const file = csvFile.files?.[0];
    if (!file) { alert('اختر ملف CSV'); return; }
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) { alert('ملف فارغ'); return; }
    // توقع رؤوس بالعربية حسب رسالتك
    // الرقم, الموظف, اسم الموظف, عدد ايام العمل, الإضافي بعد الدوام, الجمع والعطل, الأعياد, المراقب والمنطقة, الراتب الاساسي, ملاحظات, مجموع الاضافي, مجموع الراتب
    const header = lines[0].split(',').map((h) => h.trim());
    const idx = {
      jobNumber: header.findIndex(h => h.includes('الموظف') && !h.includes('اسم')),
      name: header.findIndex(h => h.includes('اسم')),
      daysWorked: header.findIndex(h => h.includes('عدد ايام العمل')),
      overtimeDays: header.findIndex(h => h.includes('الإضافي')),
      weekendDays: header.findIndex(h => h.includes('الجمع') || h.includes('العطل')),
      notes: header.findIndex(h => h.includes('ملاحظات')),
    };
    const q = query(collection(db, 'employees'), where('regionId', '==', regionId));
    const snaps = await getDocs(q);
    const nameMap = {};
    const jobMap = {};
    snaps.forEach((s) => { const d = s.data(); nameMap[d.name] = s.id; jobMap[d.jobNumber] = s.id; });

    const saves = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      if (!cols.length) continue;
      const job = idx.jobNumber >=0 ? cols[idx.jobNumber].trim() : '';
      const name = idx.name >=0 ? cols[idx.name].trim() : '';
      const empId = (job && jobMap[job]) || (name && nameMap[name]);
      if (!empId) continue; // يتجاهل من لا يوجد له عامل مطابق
      const payload = {
        daysWorked: toNum(cols[idx.daysWorked]),
        overtimeDays: toNum(cols[idx.overtimeDays]),
        weekendDays: toNum(cols[idx.weekendDays]),
        notes: idx.notes>=0 ? cols[idx.notes] : '',
        monthKey: ym.key,
        regionId,
        status: 'submitted',
        updatedAt: new Date().toISOString(),
      };
      saves.push(setDoc(doc(db, 'monthlyEntries', `${ym.key}_${empId}`), payload, { merge: true }));
    }
    await Promise.all(saves);
    alert('تم الاستيراد من CSV وحفظ السجلات');
  });
}

function toNum(v){ const n = Number(String(v||'').replace(/[^\d.\-]/g,'').trim()); return isNaN(n)?0:n; }

async function updateRowEstimate(tr){
  const empId = tr.querySelector('input[data-field][data-emp]').getAttribute('data-emp');
  const daysWorked = toNum(tr.querySelector('input[data-field="daysWorked"]').value);
  const overtimeDays = toNum(tr.querySelector('input[data-field="overtimeDays"]').value);
  const weekendDays = toNum(tr.querySelector('input[data-field="weekendDays"]').value);
  // لا نعرف الراتب هنا سريعًا بدون قراءة الموظف، لذا نترك التقدير لاحقًا أو نجلبه عند التحميل مستقبلًا
  // placeholder: إظهار مجموع الأيام فقط
  const totalDays = daysWorked + overtimeDays + weekendDays;
  tr.querySelector('.est-total').textContent = String(totalDays);
}


