// ملف اختبار بسيط لنظام معالجة الأخطاء
import { errorHandler } from './errorHandler';

// اختبار معالج الأخطاء
export const testErrorHandler = () => {
  console.log('🧪 بدء اختبار نظام معالجة الأخطاء...');

  // اختبار 1: خطأ بسيط
  try {
    throw new Error('خطأ تجريبي للاختبار');
  } catch (error) {
    errorHandler.handleError(error, 'testErrorHandler', {
      action: 'test_simple_error',
      additionalData: { testType: 'simple' }
    });
  }

  // اختبار 2: خطأ Firebase
  try {
    const firebaseError = {
      code: 'permission-denied',
      message: 'Permission denied',
      name: 'FirebaseError'
    };
    errorHandler.handleFirebaseError(firebaseError as any, 'testErrorHandler', {
      action: 'test_firebase_error',
      additionalData: { testType: 'firebase' }
    });
  } catch (error) {
    console.log('تم اختبار خطأ Firebase');
  }

  // اختبار 3: خطأ الشبكة
  try {
    const networkError = new Error('Network request failed');
    networkError.name = 'NetworkError';
    errorHandler.handleNetworkError(networkError, 'testErrorHandler', {
      action: 'test_network_error',
      additionalData: { testType: 'network' }
    });
  } catch (error) {
    console.log('تم اختبار خطأ الشبكة');
  }

  // اختبار 4: خطأ المصادقة
  try {
    const authError = {
      code: 'auth/user-not-found',
      message: 'User not found'
    };
    const userMessage = errorHandler.handleAuthError(authError, 'testErrorHandler');
    console.log('رسالة خطأ المصادقة:', userMessage);
  } catch (error) {
    console.log('تم اختبار خطأ المصادقة');
  }

  // اختبار 5: خطأ Firestore
  try {
    const firestoreError = {
      code: 'permission-denied',
      message: 'Permission denied'
    };
    const userMessage = errorHandler.handleFirestoreError(firestoreError, 'testErrorHandler');
    console.log('رسالة خطأ Firestore:', userMessage);
  } catch (error) {
    console.log('تم اختبار خطأ Firestore');
  }

  // عرض التقارير
  const reports = errorHandler.getErrorReports();
  console.log(`📊 إجمالي تقارير الأخطاء: ${reports.length}`);
  
  reports.forEach((report, index) => {
    console.log(`📝 تقرير ${index + 1}:`, {
      id: report.id,
      message: report.message,
      severity: report.severity,
      component: report.context.component,
      action: report.context.action
    });
  });

  console.log('✅ انتهاء اختبار نظام معالجة الأخطاء');
};

// تشغيل الاختبار إذا كان في وضع التطوير
if (process.env.NODE_ENV === 'development') {
  // يمكن إضافة هذا إلى console للاختبار
  (window as any).testErrorHandler = testErrorHandler;
  console.log('💡 يمكنك تشغيل testErrorHandler() في console للاختبار');
}
