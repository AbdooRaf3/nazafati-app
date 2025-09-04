import dayjs from 'dayjs';
import 'dayjs/locale/ar';

// تعريب dayjs
dayjs.locale('ar');

export const formatArabicDate = (date: Date | string): string => {
  return dayjs(date).format('DD MMMM YYYY');
};

export const formatArabicMonth = (date: Date | string): string => {
  return dayjs(date).format('MMMM YYYY');
};

export const dayKeyGenerator = (date: Date | string): string => {
  return dayjs(date).format('YYYY-MM');
};

export const getCurrentMonthKey = (): string => {
  return dayjs().format('YYYY-MM');
};

export const getMonthOptions = (monthsBack: number = 12): string[] => {
  const options: string[] = [];
  for (let i = 0; i < monthsBack; i++) {
    options.push(dayjs().subtract(i, 'month').format('YYYY-MM'));
  }
  return options;
};

export const isValidMonthKey = (monthKey: string): boolean => {
  return /^\d{4}-\d{2}$/.test(monthKey) && 
         parseInt(monthKey.split('-')[1]) >= 1 && 
         parseInt(monthKey.split('-')[1]) <= 12;
};
