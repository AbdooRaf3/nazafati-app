import { firebaseConfig } from './firebase-config.js';

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, collection, query, where, getDocs, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';


// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  cache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});


// التخزين المحلي مفعّل عبر إعداد cache أعلاه

// عناصر الواجهة الشائعة
const authSection = document.getElementById('authSection');
const adminSection = document.getElementById('adminSection');
const supervisorSection = document.getElementById('supervisorSection');
const btnLogin = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');
const email = document.getElementById('email');
const password = document.getElementById('password');
const authMsg = document.getElementById('authMsg');
const topNav = document.getElementById('top-nav');
const userRoleEl = document.getElementById('userRole');

// تبويب المدير
const tabButtons = document.querySelectorAll('.tab');
tabButtons.forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));
function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach((p) => p.classList.add('hide'));
  document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
  document.getElementById(tabId).classList.remove('hide');
}

// تسجيل الدخول والخروج
btnLogin?.addEventListener('click', async () => {
  authMsg.textContent = '';
  try {
    await signInWithEmailAndPassword(auth, email.value.trim(), password.value.trim());
  } catch (e) {
    authMsg.textContent = e.message;
  }
});

btnLogout?.addEventListener('click', () => signOut(auth));

// تحميل بيانات المستخدم (الدور والمنطقة) من users/{uid}
async function loadUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

// تهيئة واجهات المدير والمراقب
import { initAdmin } from './admin.js';
import { initSupervisor } from './supervisor.js';
import { initExcel } from './excel.js';

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    authSection.classList.remove('hide');
    adminSection.classList.add('hide');
    supervisorSection.classList.add('hide');
    topNav.classList.add('hide');
    return;
  }

  const profile = await loadUserProfile(user.uid);
  if (!profile) {
    authMsg.textContent = 'لم يتم العثور على ملف مستخدم في قاعدة البيانات.';
    return;
  }

  topNav.classList.remove('hide');
  userRoleEl.textContent = `المستخدم: ${user.email} — الدور: ${profile.role} — المنطقة: ${profile.regionId ?? 'الكل'}`;
  authSection.classList.add('hide');

  if (profile.role === 'admin') {
    adminSection.classList.remove('hide');
    supervisorSection.classList.add('hide');
    switchTab('employeesTab');
    initAdmin({ db });
    initExcel({ db });
  } else if (profile.role === 'supervisor') {
    supervisorSection.classList.remove('hide');
    adminSection.classList.add('hide');
    initSupervisor({ db, uid: user.uid, regionId: profile.regionId });
  } else {
    authMsg.textContent = 'لا يملك هذا الحساب صلاحيات للوصول.';
  }
});


