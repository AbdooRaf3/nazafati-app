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
  regionId: string;
  submittedBy: string;
  status: 'draft' | 'submitted' | 'approved';
  totals: {
    dailyWage: number;
    total: number;
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
