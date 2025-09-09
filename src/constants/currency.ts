// ثوابت العملة للنظام
export const CURRENCY = {
  // رمز العملة
  SYMBOL: 'د.أ',
  
  // اسم العملة
  NAME: 'دينار أردني',
  
  // اسم العملة المختصر
  SHORT_NAME: 'دينار',
  
  // رمز العملة الدولي
  CODE: 'JOD',
  
  // عدد الأرقام العشرية
  DECIMAL_PLACES: 2,
  
  // فاصل الآلاف
  THOUSANDS_SEPARATOR: ',',
  
  // فاصل الكسور العشرية
  DECIMAL_SEPARATOR: '.',
  
  // موقع رمز العملة (قبل أو بعد الرقم)
  POSITION: 'after' as 'before' | 'after'
} as const;

// دالة لتنسيق العملة
export const formatCurrency = (amount: number): string => {
  const formatted = amount.toLocaleString('ar-JO', {
    minimumFractionDigits: CURRENCY.DECIMAL_PLACES,
    maximumFractionDigits: CURRENCY.DECIMAL_PLACES,
    useGrouping: true
  });
  
  if (CURRENCY.POSITION === 'after') {
    return `${formatted} ${CURRENCY.SYMBOL}`;
  } else {
    return `${CURRENCY.SYMBOL} ${formatted}`;
  }
};

// دالة لتنسيق العملة بدون رمز
export const formatCurrencyValue = (amount: number): string => {
  return amount.toLocaleString('ar-JO', {
    minimumFractionDigits: CURRENCY.DECIMAL_PLACES,
    maximumFractionDigits: CURRENCY.DECIMAL_PLACES,
    useGrouping: true
  });
};

// دالة للحصول على نص العملة
export const getCurrencyText = (): string => {
  return CURRENCY.NAME;
};

// دالة للحصول على رمز العملة
export const getCurrencySymbol = (): string => {
  return CURRENCY.SYMBOL;
};

export default CURRENCY;
