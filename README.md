# نظام نظافتي - Nazafati System

نظام إدارة الرواتب والموظفين مبني على React + TypeScript + Firebase، يعمل على الخطة المجانية (Spark) من Firebase.

## 🚀 المميزات

- **واجهة عربية كاملة** مع دعم RTL
- **نظام صلاحيات متقدم** (مدير، مراقب منطقة، قسم رواتب)
- **إدارة الموظفين** والمناطق
- **الإدخالات الشهرية** مع حساب تلقائي للرواتب
- **توليد ملفات Excel** محلياً (بدون Firebase Storage)
- **دعم Firebase Spark** (مجاني بالكامل)
- **تصميم متجاوب** يعمل على جميع الأجهزة

## 🛠️ التقنيات المستخدمة

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS مع دعم RTL
- **Backend**: Firebase (Auth + Firestore)
- **Excel**: SheetJS (xlsx)
- **Routing**: React Router DOM
- **State Management**: React Hooks

## 📋 المتطلبات

- Node.js 16+
- npm أو yarn
- حساب Firebase (مجاني)

## ⚡ التثبيت والتشغيل

### 1. استنساخ المشروع

```bash
git clone <repository-url>
cd nazafati-system
```

### 2. تثبيت التبعيات

```bash
npm install
```

### 3. إعداد Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. أنشئ مشروع جديد
3. فعّل Authentication (Email/Password)
4. أنشئ تطبيق Web
5. انسخ بيانات التكوين

### 4. إعداد المتغيرات البيئية

انسخ ملف `env.example` إلى `.env`:

```bash
cp env.example .env
```

املأ القيم في ملف `.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. تشغيل التطبيق

```bash
# التطوير
npm run dev

# البناء
npm run build

# معاينة البناء
npm run preview
```

## 🔐 إعداد المستخدمين

### 1. إنشاء مستخدم مدير

1. اذهب إلى Firebase Console > Authentication
2. أضف مستخدم جديد
3. اذهب إلى Firestore > users collection
4. أنشئ مستند جديد مع البيانات:

```json
{
  "uid": "admin-1",
  "name": "أحمد محمد",
  "email": "admin@nazafati.com",
  "role": "admin",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 2. إضافة بيانات تجريبية

```bash
# تعديل scripts/seed.ts مع بيانات Firebase الحقيقية
npx tsx scripts/seed.ts
```

## 🏗️ هيكل المشروع

```text
src/
├── components/          # المكونات
│   ├── ui/            # مكونات واجهة المستخدم الأساسية
│   └── Layout/        # مكونات التخطيط
├── hooks/              # React Hooks
├── pages/              # صفحات التطبيق
├── services/           # خدمات Firebase
├── types/              # تعريفات TypeScript
├── utils/              # دوال مساعدة
└── constants/          # الثوابت
```

## 🔒 قواعد الأمان

تم تكوين قواعد Firestore الأمنية في `firestore.rules`:

- **المدير**: صلاحيات كاملة
- **المراقب**: إدارة منطقته فقط
- **قسم الرواتب**: قراءة البيانات المعتمدة

## 📊 الميزات الرئيسية

### لوحة التحكم

- إحصائيات شاملة
- إجراءات سريعة
- نشاطات حديثة

### إدارة الموظفين

- إضافة/تعديل/حذف الموظفين
- توزيع الموظفين على المناطق
- إدارة الرواتب الأساسية

### الإدخالات الشهرية

- إدخال أيام العمل
- حساب تلقائي للرواتب
- نظام الموافقات

### كشوف الرواتب

- توليد ملفات Excel
- إحصائيات مفصلة
- تصدير البيانات

## 🚀 النشر على Firebase Hosting

### 1. تثبيت Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. تسجيل الدخول

```bash
firebase login
```

### 3. تهيئة المشروع

```bash
firebase init hosting
```

اختر:

- Use an existing project
- Public directory: `dist`
- Single-page app: `Yes`
- Overwrite index.html: `No`

### 4. النشر

```bash
npm run build
firebase deploy
```

## 📝 ملاحظات مهمة

- **لا يتم استخدام Firebase Storage** - جميع الملفات تُنزّل محلياً
- **النظام يعمل على الخطة المجانية** من Firebase
- **جميع العمليات client-side** - لا يوجد SSR
- **دعم كامل للغة العربية** مع RTL

## 🐛 استكشاف الأخطاء

### مشاكل شائعة

1. **خطأ "Firebase not initialized"**
   - تأكد من صحة بيانات `.env`
   - تحقق من تهيئة Firebase في Console

2. **مشاكل RTL**
   - تأكد من `dir="rtl"` في HTML
   - تحقق من إعدادات Tailwind

3. **أخطاء في Firestore Rules**
   - تأكد من تطبيق `firestore.rules`
   - تحقق من صلاحيات المستخدم

## 🤝 المساهمة

1. Fork المشروع
2. أنشئ branch جديد
3. اكتب التغييرات
4. أرسل Pull Request

## 📄 الترخيص

هذا المشروع مرخص تحت MIT License.

## 📞 الدعم

للدعم الفني أو الاستفسارات:

- أنشئ Issue في GitHub
- راسل المطور عبر البريد الإلكتروني

---

**ملاحظة**: هذا النظام مصمم للعمل على Firebase Spark (المجاني) ولا يتطلب أي خدمات مدفوعة.
