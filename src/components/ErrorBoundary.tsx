import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { errorHandler } from '../utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // تسجيل الخطأ
    errorHandler.handleError(error, 'ErrorBoundary', {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      additionalData: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    });

    this.setState({
      error,
      errorInfo
    });

    // استدعاء callback مخصص إذا كان موجوداً
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReportError = () => {
    if (this.state.error) {
      errorHandler.sendErrorReport({
        id: errorHandler['generateErrorId'](),
        message: this.state.error.message,
        code: this.state.error.name,
        context: {
          component: 'ErrorBoundary',
          action: 'manual_report',
          additionalData: {
            componentStack: this.state.errorInfo?.componentStack,
            errorBoundary: true
          }
        },
        stack: this.state.error.stack,
        severity: 'high',
        timestamp: new Date()
      });
      
      alert('تم إرسال تقرير الخطأ بنجاح');
    }
  };

  render() {
    if (this.state.hasError) {
      // استخدام fallback مخصص إذا كان موجوداً
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // واجهة الخطأ الافتراضية
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-2xl w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                حدث خطأ غير متوقع
              </h1>
              
              <p className="text-gray-600 mb-6">
                نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى أو إعادة تحميل الصفحة.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-right">
                  <h3 className="text-sm font-medium text-red-800 mb-2">تفاصيل الخطأ (وضع التطوير):</h3>
                  <p className="text-sm text-red-700 font-mono">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="text-sm text-red-600 cursor-pointer">
                        عرض Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs text-red-600 whitespace-pre-wrap overflow-auto max-h-40">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={this.handleRetry} className="w-full sm:w-auto">
                  المحاولة مرة أخرى
                </Button>
                
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline" 
                  className="w-full sm:w-auto"
                >
                  إعادة تحميل الصفحة
                </Button>
                
                <Button 
                  onClick={this.handleReportError} 
                  variant="secondary" 
                  className="w-full sm:w-auto"
                >
                  إرسال تقرير خطأ
                </Button>
              </div>

              <div className="mt-6 text-sm text-gray-500">
                <p>إذا استمر هذا الخطأ، يرجى التواصل مع الدعم الفني.</p>
                <p className="mt-1">معرف الخطأ: {this.state.error?.name || 'غير محدد'}</p>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// مكون مساعد للاستخدام السهل
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default ErrorBoundary;
