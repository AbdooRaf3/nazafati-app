import { FirebaseError } from 'firebase/app';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: Date;
  code?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  message: string;
  code?: string;
  context: ErrorContext;
  stack?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

class ErrorHandler {
  private errorReports: ErrorReport[] = [];
  private maxReports = 100; // حد أقصى لتقارير الأخطاء المحفوظة محلياً

  /**
   * معالجة الأخطاء العامة
   */
  handleError = (error: any, context: string, additionalContext?: Partial<ErrorContext>): void => {
    console.error(`${context}:`, error);

    const errorReport = this.createErrorReport(error, context, additionalContext);
    this.logError(errorReport);
    this.storeErrorReport(errorReport);
  };

  /**
   * معالجة أخطاء Firebase
   */
  handleFirebaseError = (error: FirebaseError, context: string, additionalContext?: Partial<ErrorContext>): void => {
    console.error(`Firebase Error in ${context}:`, error);

    const errorReport = this.createErrorReport(error, context, {
      ...additionalContext,
      code: error.code,
      additionalData: {
        ...additionalContext?.additionalData,
        firebaseCode: error.code,
        firebaseMessage: error.message
      }
    });

    this.logError(errorReport);
    this.storeErrorReport(errorReport);
  };

  /**
   * معالجة أخطاء الشبكة
   */
  handleNetworkError = (error: any, context: string, additionalContext?: Partial<ErrorContext>): void => {
    console.error(`Network Error in ${context}:`, error);

    const errorReport = this.createErrorReport(error, context, {
      ...additionalContext,
      additionalData: {
        ...additionalContext?.additionalData,
        isNetworkError: true,
        onlineStatus: navigator.onLine
      }
    });

    this.logError(errorReport);
    this.storeErrorReport(errorReport);
  };

  /**
   * إنشاء تقرير خطأ
   */
  private createErrorReport = (error: any, context: string, additionalContext?: Partial<ErrorContext>): ErrorReport => {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      message: this.extractErrorMessage(error),
      code: this.extractErrorCode(error),
      context: {
        component: context,
        timestamp: new Date(),
        ...additionalContext
      },
      stack: error?.stack,
      severity: this.determineSeverity(error),
      timestamp: new Date()
    };

    return errorReport;
  };

  /**
   * استخراج رسالة الخطأ
   */
  private extractErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error?.message) return error.error.message;
    return 'خطأ غير معروف';
  };

  /**
   * استخراج كود الخطأ
   */
  private extractErrorCode = (error: any): string | undefined => {
    if (error?.code) return error.code;
    if (error?.error?.code) return error.error.code;
    return undefined;
  };

  /**
   * تحديد مستوى الخطأ
   */
  private determineSeverity = (error: any): 'low' | 'medium' | 'high' | 'critical' => {
    // أخطاء Firebase الحرجة
    if (error?.code?.includes('permission-denied')) return 'critical';
    if (error?.code?.includes('unauthenticated')) return 'critical';
    if (error?.code?.includes('network-request-failed')) return 'high';
    
    // أخطاء الشبكة
    if (error?.name === 'NetworkError') return 'high';
    if (!navigator.onLine) return 'high';
    
    // أخطاء JavaScript
    if (error?.name === 'TypeError') return 'medium';
    if (error?.name === 'ReferenceError') return 'high';
    
    return 'low';
  };

  /**
   * تسجيل الخطأ
   */
  private logError = (errorReport: ErrorReport): void => {
    const logMessage = `[${errorReport.severity.toUpperCase()}] ${errorReport.context.component}: ${errorReport.message}`;
    
    switch (errorReport.severity) {
      case 'critical':
      case 'high':
        console.error(logMessage, errorReport);
        break;
      case 'medium':
        console.warn(logMessage, errorReport);
        break;
      case 'low':
        console.info(logMessage, errorReport);
        break;
    }
  };

  /**
   * حفظ تقرير الخطأ
   */
  private storeErrorReport = (errorReport: ErrorReport): void => {
    this.errorReports.unshift(errorReport);
    
    // الحفاظ على الحد الأقصى من التقارير
    if (this.errorReports.length > this.maxReports) {
      this.errorReports = this.errorReports.slice(0, this.maxReports);
    }

    // حفظ في localStorage للاستخدام المستقبلي
    try {
      localStorage.setItem('errorReports', JSON.stringify(this.errorReports));
    } catch (e) {
      console.warn('فشل في حفظ تقارير الأخطاء في localStorage');
    }
  };

  /**
   * توليد معرف فريد للخطأ
   */
  private generateErrorId = (): string => {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * الحصول على تقارير الأخطاء
   */
  getErrorReports = (): ErrorReport[] => {
    return [...this.errorReports];
  };

  /**
   * مسح تقارير الأخطاء
   */
  clearErrorReports = (): void => {
    this.errorReports = [];
    try {
      localStorage.removeItem('errorReports');
    } catch (e) {
      console.warn('فشل في مسح تقارير الأخطاء من localStorage');
    }
  };

  /**
   * تحميل تقارير الأخطاء المحفوظة
   */
  loadStoredErrorReports = (): void => {
    try {
      const stored = localStorage.getItem('errorReports');
      if (stored) {
        this.errorReports = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('فشل في تحميل تقارير الأخطاء المحفوظة');
    }
  };

  /**
   * إرسال تقرير خطأ للخادم (للمستقبل)
   */
  sendErrorReport = async (errorReport: ErrorReport): Promise<void> => {
    try {
      // هنا يمكن إضافة كود لإرسال التقرير للخادم
      console.log('إرسال تقرير خطأ للخادم:', errorReport);
      
      // مثال: await fetch('/api/errors', { method: 'POST', body: JSON.stringify(errorReport) });
    } catch (e) {
      console.error('فشل في إرسال تقرير الخطأ:', e);
    }
  };

  /**
   * معالجة أخطاء المصادقة
   */
  handleAuthError = (error: any, context: string): string => {
    let userMessage = 'حدث خطأ في المصادقة';
    
    if (error?.code) {
      switch (error.code) {
        case 'auth/user-not-found':
          userMessage = 'المستخدم غير موجود';
          break;
        case 'auth/wrong-password':
          userMessage = 'كلمة المرور غير صحيحة';
          break;
        case 'auth/invalid-email':
          userMessage = 'البريد الإلكتروني غير صحيح';
          break;
        case 'auth/user-disabled':
          userMessage = 'تم تعطيل هذا الحساب';
          break;
        case 'auth/too-many-requests':
          userMessage = 'تم تجاوز عدد المحاولات المسموح، حاول لاحقاً';
          break;
        case 'auth/network-request-failed':
          userMessage = 'خطأ في الاتصال بالشبكة';
          break;
        default:
          userMessage = `خطأ في المصادقة: ${error.message}`;
      }
    }

    this.handleError(error, context, { action: 'authentication' });
    return userMessage;
  };

  /**
   * معالجة أخطاء Firestore
   */
  handleFirestoreError = (error: any, context: string): string => {
    let userMessage = 'حدث خطأ في قاعدة البيانات';
    
    if (error?.code) {
      switch (error.code) {
        case 'permission-denied':
          userMessage = 'ليس لديك صلاحية للوصول إلى هذه البيانات';
          break;
        case 'unauthenticated':
          userMessage = 'يجب تسجيل الدخول أولاً';
          break;
        case 'not-found':
          userMessage = 'البيانات المطلوبة غير موجودة';
          break;
        case 'already-exists':
          userMessage = 'البيانات موجودة بالفعل';
          break;
        case 'failed-precondition':
          userMessage = 'فشل في التحقق من الشروط المطلوبة';
          break;
        case 'resource-exhausted':
          userMessage = 'تم تجاوز الحد المسموح من الطلبات';
          break;
        default:
          userMessage = `خطأ في قاعدة البيانات: ${error.message}`;
      }
    }

    this.handleError(error, context, { action: 'firestore' });
    return userMessage;
  };
}

// إنشاء مثيل واحد من معالج الأخطاء
export const errorHandler = new ErrorHandler();

// تصدير الدوال المساعدة
export const handleError = errorHandler.handleError;
export const handleFirebaseError = errorHandler.handleFirebaseError;
export const handleNetworkError = errorHandler.handleNetworkError;
export const handleAuthError = errorHandler.handleAuthError;
export const handleFirestoreError = errorHandler.handleFirestoreError;

// تصدير معالج الأخطاء الكامل
export default errorHandler;
