import { SalaryRules } from '../types';

export const calculateDailyWage = (baseSalary: number, daysInMonth: number): number => {
  return baseSalary / daysInMonth;
};

export const calculateTotalSalary = (
  baseSalary: number,
  daysWorked: number,
  overtimeDays: number,
  weekendDays: number,
  rules: SalaryRules
): { dailyWage: number; total: number } => {
  const dailyWage = calculateDailyWage(baseSalary, rules.daysInMonthReference);
  
  let total = dailyWage * daysWorked;
  total += dailyWage * overtimeDays * rules.overtimeFactor;
  total += dailyWage * weekendDays * rules.weekendFactor;
  
  // تطبيق التقريب
  switch (rules.rounding) {
    case 'floor':
      total = Math.floor(total);
      break;
    case 'ceil':
      total = Math.ceil(total);
      break;
    case 'round':
    default:
      total = Math.round(total);
      break;
  }
  
  return {
    dailyWage: Math.round(dailyWage * 100) / 100, // تقريب إلى رقمين عشريين
    total
  };
};

export const validateSalaryInputs = (
  daysWorked: number,
  overtimeDays: number,
  weekendDays: number
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (daysWorked < 0 || daysWorked > 31) {
    errors.push('عدد أيام العمل يجب أن يكون بين 0 و 31');
  }
  
  if (overtimeDays < 0) {
    errors.push('أيام العمل الإضافي لا يمكن أن تكون سالبة');
  }
  
  if (weekendDays < 0) {
    errors.push('أيام العمل في العطل لا يمكن أن تكون سالبة');
  }
  
  if (daysWorked + overtimeDays + weekendDays > 31) {
    errors.push('إجمالي الأيام لا يمكن أن يتجاوز 31 يوم');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
