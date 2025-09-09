# نظام معالجة الأخطاء - Error Handling System

## 📋 نظرة عامة

تم تطوير نظام شامل لمعالجة الأخطاء في التطبيق يوفر:

- **تسجيل مفصل للأخطاء** مع السياق والمعلومات الإضافية
- **تصنيف الأخطاء** حسب مستوى الخطورة
- **رسائل خطأ واضحة** للمستخدمين
- **تخزين محلي** لتقارير الأخطاء
- **واجهة إدارة** لعرض وإدارة التقارير

## 🏗️ البنية

### 1. معالج الأخطاء الرئيسي (`errorHandler.ts`)

```typescript
import { errorHandler, handleError, handleFirebaseError } from '../utils/errorHandler';

// معالجة خطأ عام
errorHandler.handleError(error, 'componentName', {
  action: 'specificAction',
  additionalData: { key: 'value' }
});

// معالجة خطأ Firebase
errorHandler.handleFirebaseError(firebaseError, 'componentName');

// معالجة خطأ الشبكة
errorHandler.handleNetworkError(networkError, 'componentName');
```

### 2. Error Boundary (`ErrorBoundary.tsx`)

```typescript
import { ErrorBoundary } from '../components/ErrorBoundary';

// استخدام أساسي
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// استخدام مع fallback مخصص
<ErrorBoundary fallback={<CustomErrorUI />}>
  <YourComponent />
</ErrorBoundary>
```

### 3. Hook مخصص (`useErrorHandler.ts`)

```typescript
import { useErrorHandler } from '../hooks/useErrorHandler';

const MyComponent = () => {
  const { error, handleError, executeWithErrorHandling } = useErrorHandler();

  const handleAction = async () => {
    await executeWithErrorHandling(
      async () => {
        // العملية التي قد تفشل
      },
      'handleAction',
      { action: 'specificAction' }
    );
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <button onClick={handleAction}>تنفيذ العملية</button>
    </div>
  );
};
```

## 🔧 الاستخدام

### معالجة الأخطاء في الخدمات

```typescript
// في firestoreService.ts
try {
  const data = await getDocs(collection(db, 'users'));
  return data.docs.map(doc => doc.data());
} catch (error) {
  errorHandler.handleFirestoreError(error, 'getAllUsers', {
    action: 'getAllUsers',
    additionalData: { collection: 'users' }
  });
  throw error;
}
```

### معالجة الأخطاء في المكونات

```typescript
// في مكون React
const MyComponent = () => {
  const { error, handleError, clearError } = useErrorHandler();

  const handleSubmit = async (data) => {
    try {
      await submitData(data);
    } catch (err) {
      handleError(err, 'MyComponent', { action: 'handleSubmit' });
    }
  };

  return (
    <div>
      {error && (
        <div className="error-message">
          {error}
          <button onClick={clearError}>إغلاق</button>
        </div>
      )}
    </div>
  );
};
```

## 📊 تصنيف الأخطاء

### مستويات الخطورة

- **`critical`**: أخطاء حرجة (مثل permission-denied)
- **`high`**: أخطاء عالية (مثل network errors)
- **`medium`**: أخطاء متوسطة (مثل validation errors)
- **`low`**: أخطاء منخفضة (مثل warnings)

### أنواع الأخطاء المدعومة

1. **أخطاء Firebase Authentication**
   - `auth/user-not-found`
   - `auth/wrong-password`
   - `auth/invalid-email`
   - `auth/too-many-requests`

2. **أخطاء Firestore**
   - `permission-denied`
   - `unauthenticated`
   - `not-found`
   - `already-exists`

3. **أخطاء الشبكة**
   - `NetworkError`
   - `FetchError`
   - `TimeoutError`

## 🎛️ إدارة التقارير

### عرض التقارير

```typescript
// الحصول على جميع التقارير
const reports = errorHandler.getErrorReports();

// مسح التقارير
errorHandler.clearErrorReports();

// إرسال تقرير للخادم
await errorHandler.sendErrorReport(report);
```

### واجهة الإدارة

تم إضافة تبويب "تقارير الأخطاء" في صفحة الإعدادات لعرض وإدارة التقارير:

- عرض جميع تقارير الأخطاء
- تصفية حسب مستوى الخطورة
- عرض التفاصيل الكاملة
- مسح التقارير

## 🔍 التصحيح

### في وضع التطوير

```typescript
// تشغيل اختبارات معالج الأخطاء
import { testErrorHandler } from '../utils/errorHandler.test';

// في console المتصفح
testErrorHandler();
```

### عرض التفاصيل

```typescript
// في ErrorBoundary (وضع التطوير فقط)
{process.env.NODE_ENV === 'development' && (
  <details>
    <summary>تفاصيل الخطأ</summary>
    <pre>{error.stack}</pre>
  </details>
)}
```

## 📈 الإحصائيات

### تقارير الأخطاء المحفوظة

- **الحد الأقصى**: 100 تقرير
- **التخزين**: localStorage
- **التنسيق**: JSON

### معلومات التقرير

```typescript
interface ErrorReport {
  id: string;                    // معرف فريد
  message: string;               // رسالة الخطأ
  code?: string;                 // كود الخطأ
  context: ErrorContext;         // السياق
  stack?: string;               // Stack trace
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;              // وقت الحدوث
}
```

## 🚀 الميزات المستقبلية

- [ ] إرسال تلقائي للتقارير للخادم
- [ ] تحليلات متقدمة للأخطاء
- [ ] إشعارات فورية للأخطاء الحرجة
- [ ] تكامل مع خدمات المراقبة الخارجية
- [ ] تقارير دورية للأخطاء

## 📝 ملاحظات مهمة

1. **الأمان**: لا يتم إرسال معلومات حساسة في التقارير
2. **الأداء**: يتم تخزين التقارير محلياً لتجنب التأثير على الأداء
3. **الخصوصية**: يمكن للمستخدمين مسح التقارير في أي وقت
4. **التوافق**: يعمل مع جميع المتصفحات الحديثة

## 🔧 التكوين

### إعدادات معالج الأخطاء

```typescript
// في errorHandler.ts
class ErrorHandler {
  private maxReports = 100; // حد أقصى للتقارير
  
  // يمكن تعديل هذا الرقم حسب الحاجة
}
```

### تخصيص الرسائل

```typescript
// إضافة رسائل خطأ مخصصة
const customMessages = {
  'custom-error-code': 'رسالة خطأ مخصصة'
};
```

---

**تم تطوير هذا النظام لضمان تجربة مستخدم سلسة وإدارة فعالة للأخطاء في التطبيق.**
