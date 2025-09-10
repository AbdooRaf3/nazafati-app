# دليل تحديث قاعدة البيانات للمعادلات الجديدة

## 📋 نظرة عامة

تم تحديث التطبيق لاستخدام معادلات احتساب الراتب الجديدة. يتطلب هذا التحديث تعديلات على قاعدة البيانات في Firebase لتتماشى مع الهيكل الجديد.

## 🔄 المعادلات الجديدة

```typescript
// totalOvertime = (D2*I2*0.5) + (E2*I2) + (F2*I2)
const totalOvertime = (holidays * baseSalary * 0.5) + 
                     (fridaysAndHolidays * baseSalary) + 
                     (overtimeAfterReference * baseSalary);

// totalSalary = C2*I2
const totalSalary = daysInMonth * baseSalary;

// netSalary = L2 + K2
const netSalary = totalSalary + totalOvertime;
```

## 🗂️ الحقول الجديدة المضافة

### في مجموعة `monthly-entries`:
- `holidays` (number): عدد العطل
- `fridaysAndHolidays` (number): عدد الجمع والعطل
- `overtimeAfterReference` (number): الإضافي بعد المرجع
- `daysInMonth` (number): عدد أيام الشهر

### في كائن `totals`:
- `totalOvertime` (number): إجمالي الإضافي
- `totalSalary` (number): إجمالي الراتب
- `netSalary` (number): صافي الراتب

## 🚀 خطوات التحديث

### 1. التحضير
```bash
# التأكد من تثبيت Firebase CLI
npm install -g firebase-tools

# تسجيل الدخول إلى Firebase
firebase login

# التأكد من الاتصال بالمشروع الصحيح
firebase use --add
```

### 2. نشر الفهارس وقواعد الأمان
```bash
# نشر الفهارس الجديدة
node scripts/deploy-database-updates.mjs

# أو يدوياً
firebase deploy --only firestore:indexes
firebase deploy --only firestore:rules
```

### 3. تحديث البيانات الموجودة
```bash
# تحديث الإدخالات الشهرية الموجودة
node scripts/update-database-schema.mjs
```

### 4. إنشاء بيانات تجريبية (اختياري)
```bash
# إنشاء بيانات تجريبية محدثة
node scripts/create-sample-data-updated.mjs
```

## 📊 الفهارس الجديدة

تم إضافة الفهارس التالية لتحسين الأداء:

1. **monthly-entries** على `monthKey + regionId + status`
2. **monthly-entries** على `monthKey + holidays`
3. **monthly-entries** على `monthKey + fridaysAndHolidays`
4. **monthly-entries** على `monthKey + overtimeAfterReference`

## 🔒 قواعد الأمان

تم تحديث قواعد الأمان لدعم الحقول الجديدة مع الحفاظ على نفس مستوى الأمان:

- المراقبون يمكنهم قراءة/كتابة الإدخالات في منطقتهم فقط
- المدراء والمالية يمكنهم الوصول لجميع البيانات
- الحقول الجديدة محمية بنفس قواعد الحقول الموجودة

## 🧪 اختبار التحديث

### 1. اختبار البيانات الجديدة
```bash
# تشغيل اختبار التكامل
node test-integration.mjs
```

### 2. اختبار التطبيق
1. فتح التطبيق في المتصفح
2. الانتقال إلى صفحة الإدخالات الشهرية
3. التأكد من ظهور الحقول الجديدة
4. إدخال بيانات تجريبية وحفظها
5. التحقق من صحة الحسابات

### 3. اختبار صفحة الرواتب
1. الانتقال إلى صفحة الرواتب
2. توليد كشف رواتب للشهر الحالي
3. التأكد من ظهور النتائج المحسوبة الجديدة

## ⚠️ ملاحظات مهمة

### قبل التحديث:
- **احتفظ بنسخة احتياطية** من قاعدة البيانات
- تأكد من عدم وجود مستخدمين نشطين
- اختبر في بيئة التطوير أولاً

### بعد التحديث:
- تحقق من عمل جميع الوظائف
- راقب أداء قاعدة البيانات
- تأكد من صحة الحسابات

### في حالة المشاكل:
- راجع سجلات Firebase Console
- تحقق من قواعد الأمان
- تأكد من صحة الفهارس

## 📞 الدعم

في حالة مواجهة مشاكل أثناء التحديث:

1. راجع سجلات الأخطاء في Firebase Console
2. تحقق من اتصال الإنترنت
3. تأكد من صلاحيات المستخدم
4. راجع هذا الدليل مرة أخرى

## ✅ قائمة التحقق

- [ ] تم تثبيت Firebase CLI
- [ ] تم تسجيل الدخول إلى Firebase
- [ ] تم نشر الفهارس الجديدة
- [ ] تم نشر قواعد الأمان
- [ ] تم تحديث البيانات الموجودة
- [ ] تم اختبار التطبيق
- [ ] تم التحقق من صحة الحسابات
- [ ] تم اختبار جميع الوظائف

---

**تاريخ التحديث:** يناير 2025  
**الإصدار:** 2.0.0  
**المطور:** فريق نظافتي
