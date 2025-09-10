export interface User {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'finance';
  regionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  jobNumber: string;
  name: string;
  baseSalary: number;
  regionId: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlyEntry {
  id: string;
  employeeId: string;
  monthKey: string; // YYYY-MM
  daysWorked: number;
  overtimeDays: number;
  weekendDays: number;
  // الحقول الجديدة للمعادلات المحدثة
  holidays: number; // عدد العطل
  fridaysAndHolidays: number; // عدد الجمع والعطل
  overtimeAfterReference: number; // الإضافي بعد المرجع
  daysInMonth: number; // عدد أيام الشهر
  regionId: string;
  submittedBy: string;
  status: 'draft' | 'submitted' | 'approved';
  totals: {
    dailyWage: number;
    total: number;
    totalOvertime?: number; // إجمالي الإضافي
    totalSalary?: number; // إجمالي الراتب
    netSalary?: number; // صافي الراتب
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SalaryRules {
  daysInMonthReference: number;
  overtimeFactor: number;
  weekendFactor: number;
  rounding: 'round' | 'floor' | 'ceil';
}

// نوع بيانات صف الرواتب المحدث
export interface PayrollRow {
  jobNumber: string;
  name: string;
  baseSalary: number;
  daysInMonth: number;
  holidays: number;
  fridaysAndHolidays: number;
  overtimeAfterReference: number;
  totalOvertime: number;
  totalSalary: number;
  netSalary: number;
  notes?: string;
}

export interface Region {
  id: string;
  name: string;
  supervisorId: string;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}
