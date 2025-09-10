# دليل إعداد وتحديث قاعدة البيانات Firebase

## 🎯 نظرة عامة

تم تحديث التطبيق لاستخدام معادلات احتساب الراتب الجديدة. يتطلب هذا التحديث تعديلات على قاعدة البيانات في Firebase.

## 🔧 الإعداد المطلوب

### 1. تثبيت Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. تسجيل الدخول إلى Firebase
```bash
firebase login
```

### 3. تحديد المشروع
```bash
firebase use nazafati-system
```

## 📋 خطوات التحديث

### الخطوة 1: نشر الفهارس وقواعد الأمان
```bash
# تشغيل السكريبت الشامل
npm run db:update

# أو يدوياً
firebase deploy --only firestore:indexes
firebase deploy --only firestore:rules
```

### الخطوة 2: تحديث البيانات الموجودة
```bash
# تحديث الإدخالات الشهرية الموجودة
npm run db:update-schema
```

### الخطوة 3: إنشاء بيانات تجريبية (اختياري)
```bash
# إنشاء بيانات تجريبية محدثة
npm run db:create-sample
```

## 🔍 اختبار التحديث

### 1. اختبار الاتصال
```bash
node scripts/test-firebase-connection.mjs
```

### 2. اختبار التطبيق
1. تشغيل التطبيق: `npm run dev`
2. فتح المتصفح على `http://localhost:5173`
3. تسجيل الدخول
4. الانتقال إلى صفحة الإدخالات الشهرية
5. التأكد من ظهور الحقول الجديدة

## 🗂️ التغييرات في قاعدة البيانات

### الحقول الجديدة في `monthly-entries`:
- `holidays` (number): عدد العطل
- `fridaysAndHolidays` (number): عدد الجمع والعطل  
- `overtimeAfterReference` (number): الإضافي بعد المرجع
- `daysInMonth` (number): عدد أيام الشهر

### الحقول الجديدة في `totals`:
- `totalOvertime` (number): إجمالي الإضافي
- `totalSalary` (number): إجمالي الراتب
- `netSalary` (number): صافي الراتب

## 🔒 قواعد الأمان

تم تحديث قواعد الأمان لدعم الحقول الجديدة:

```javascript
// الإدخالات الشهرية
match /monthly-entries/{entryId} {
  allow read: if isAdmin() || isFinance() || 
    (isSupervisor() && isEmployeeInOwnRegion(resource.data.employeeId));
  allow write: if isAdmin() || 
    (isSupervisor() && isEntryForOwnRegionFromRequest());
}
```

## 📊 الفهارس الجديدة

تم إضافة الفهارس التالية:

1. `monthly-entries` على `monthKey + regionId + status`
2. `monthly-entries` على `monthKey + holidays`
3. `monthly-entries` على `monthKey + fridaysAndHolidays`
4. `monthly-entries` على `monthKey + overtimeAfterReference`

## ⚠️ استكشاف الأخطاء

### مشكلة الصلاحيات
```bash
# إعادة تسجيل الدخول
firebase login --reauth

# التحقق من المشروع
firebase projects:list

# تحديد المشروع الصحيح
firebase use nazafati-system
```

### مشكلة الفهارس
```bash
# التحقق من حالة الفهارس
firebase firestore:indexes

# إعادة نشر الفهارس
firebase deploy --only firestore:indexes
```

### مشكلة قواعد الأمان
```bash
# اختبار قواعد الأمان
firebase firestore:rules:test

# إعادة نشر القواعد
firebase deploy --only firestore:rules
```

## 🧪 اختبار شامل

### 1. اختبار المعادلات
```bash
# تشغيل اختبار المعادلات
node test-integration.mjs
```

### 2. اختبار قاعدة البيانات
```bash
# اختبار الاتصال
node scripts/test-firebase-connection.mjs
```

### 3. اختبار التطبيق
1. فتح التطبيق
2. تسجيل الدخول
3. إنشاء إدخال شهري جديد
4. التحقق من الحسابات
5. توليد كشف رواتب

## 📞 الدعم

في حالة مواجهة مشاكل:

1. **راجع سجلات Firebase Console**
2. **تحقق من قواعد الأمان**
3. **تأكد من صحة الفهارس**
4. **راجع هذا الدليل**

## ✅ قائمة التحقق النهائية

- [ ] تم تثبيت Firebase CLI
- [ ] تم تسجيل الدخول إلى Firebase
- [ ] تم تحديد المشروع الصحيح
- [ ] تم نشر الفهارس الجديدة
- [ ] تم نشر قواعد الأمان
- [ ] تم تحديث البيانات الموجودة
- [ ] تم اختبار الاتصال
- [ ] تم اختبار التطبيق
- [ ] تم التحقق من صحة الحسابات

---

**تاريخ التحديث:** يناير 2025  
**الإصدار:** 2.0.0  
**المطور:** فريق نظافتي
