import { SalaryRules } from '../types';

export const calculateDailyWage = (baseSalary: number, daysInMonth: number): number => {
  return baseSalary / daysInMonth;
};

// معادلات احتساب الراتب الجديدة
export const calculateSalaryWithNewFormulas = (
  baseSalary: number,
  daysInMonth: number,
  holidays: number,
  fridaysAndHolidays: number,
  overtimeAfterReference: number
): { totalOvertime: number; totalSalary: number; netSalary: number } => {
  // totalOvertime = (D2*I2*0.5) + (E2*I2) + (F2*I2)
  // حيث D2 = holidays, E2 = fridaysAndHolidays, F2 = overtimeAfterReference, I2 = baseSalary
  const totalOvertime = (holidays * baseSalary * 0.5) + (fridaysAndHolidays * baseSalary) + (overtimeAfterReference * baseSalary);
  
  // totalSalary = C2*I2
  // حيث C2 = daysInMonth, I2 = baseSalary
  const totalSalary = daysInMonth * baseSalary;
  
  // netSalary = L2 + K2
  // حيث L2 = totalSalary, K2 = totalOvertime
  const netSalary = totalSalary + totalOvertime;
  
  return {
    totalOvertime: Math.round(totalOvertime * 1000) / 1000, // تقريب إلى ثلاثة أرقام عشريين
    totalSalary: Math.round(totalSalary * 1000) / 1000,
    netSalary: Math.round(netSalary * 1000) / 1000
  };
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
