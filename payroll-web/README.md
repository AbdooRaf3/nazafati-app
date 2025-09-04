# MadaHR Web (Firebase Hosting - مجاني)

تطبيق ويب عربي لإدارة عمال المناطق وحساب كشف شهري وتوليد ملف Excel مطابق للقالب، يعمل بالكامل على خطة Firebase المجانية (بدون Functions/Scheduler).

## المتطلبات
- حساب Firebase مجانًا (Spark)
- تمكين Auth (Email/Password)
- إنشاء مجموعات Firestore: users, employees, monthlyEntries, settings, regions
- تمكين Firestore Persistence على الويب مفعّل داخل التطبيق

## الإعداد
1) انسخ `firebase-config.sample.js` إلى `firebase-config.js` وضع مفاتيح مشروعك.
2) في Firebase Console أنشئ مستخدمًا إداريًا بالبريد/كلمة المرور.
3) أضف مستند `users/{uid}` لليوزر الإداري:
```json
{
  "role": "admin",
  "regionId": "all"
}
```
4) ارفع قالب Excel المرجعي عبر تبويب "قالب Excel" داخل التطبيق (سيخزن في `templates/كشف_شهري.xlsx`).
5) انشر على Firebase Hosting:
```bash
firebase init hosting  # اختر المجلد public = payroll-web
firebase deploy --only hosting
```

## الصلاحيات
- admin: إدارة العمال، الإعدادات، رفع القالب، توليد الكشف.
- supervisor: إدخال شهري لعمال منطقته فقط.
- finance: قراءة ملفات `payroll/*` من Storage إذا لزم.

## ملاحظات
- الحساب: أجر يومي = الراتب الأساسي ÷ عدد أيام الشهر الفعلية (Date(y,m,0).getDate()).
- تم استخدام SheetJS لتعبئة القالب داخل المتصفح ورفعه إلى Storage.
- لا مهام مجدولة؛ الإغلاق يتم بزر داخل الواجهة.


