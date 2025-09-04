import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase-init';
import { Employee, MonthlyEntry, User, SalaryRules } from '../types';
import { calculateTotalSalary } from '../utils/calcSalary';

export class FirestoreService {
  private static getDb() {
    const db = getFirebaseDb();
    if (!db) throw new Error('Firebase غير مُهيأ');
    return db;
  }

  // خدمات الموظفين
  static async getEmployeesByRegion(regionId: string): Promise<Employee[]> {
    try {
      const db = this.getDb();
      const q = query(
        collection(db, 'employees'),
        where('regionId', '==', regionId),
        where('status', '==', 'active'),
        orderBy('name')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Employee[];
    } catch (error) {
      console.error('خطأ في جلب الموظفين:', error);
      throw new Error('فشل في جلب الموظفين');
    }
  }

  static async getAllEmployees(): Promise<Employee[]> {
    try {
      const db = this.getDb();
      const q = query(
        collection(db, 'employees'),
        orderBy('regionId'),
        orderBy('name')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Employee[];
    } catch (error) {
      console.error('خطأ في جلب جميع الموظفين:', error);
      throw new Error('فشل في جلب جميع الموظفين');
    }
  }

  static async addEmployee(employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const db = this.getDb();
      const docRef = await addDoc(collection(db, 'employees'), {
        ...employeeData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('خطأ في إضافة الموظف:', error);
      throw new Error('فشل في إضافة الموظف');
    }
  }

  static async updateEmployee(id: string, employeeData: Partial<Employee>): Promise<void> {
    try {
      const db = this.getDb();
      const docRef = doc(db, 'employees', id);
      await updateDoc(docRef, {
        ...employeeData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('خطأ في تحديث الموظف:', error);
      throw new Error('فشل في تحديث الموظف');
    }
  }

  // خدمات الإدخالات الشهرية
  static async getMonthlyEntries(monthKey: string, regionId?: string): Promise<MonthlyEntry[]> {
    try {
      const db = this.getDb();
      let q = query(
        collection(db, 'monthlyEntries'),
        where('monthKey', '==', monthKey),
        orderBy('createdAt', 'desc')
      );
      
      if (regionId) {
        q = query(
          collection(db, 'monthlyEntries'),
          where('monthKey', '==', monthKey),
          where('regionId', '==', regionId),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as MonthlyEntry[];
    } catch (error) {
      console.error('خطأ في جلب الإدخالات الشهرية:', error);
      throw new Error('فشل في جلب الإدخالات الشهرية');
    }
  }

  static async saveMonthlyEntry(entryData: Omit<MonthlyEntry, 'id' | 'createdAt' | 'updatedAt' | 'totals'>): Promise<string> {
    try {
      const db = this.getDb();
      
      // جلب قواعد الرواتب
      const salaryRules = await this.getSalaryRules();
      
      // جلب بيانات الموظف
      const employeeDoc = await getDoc(doc(db, 'employees', entryData.employeeId));
      if (!employeeDoc.exists()) {
        throw new Error('الموظف غير موجود');
      }
      
      const employee = employeeDoc.data() as Employee;
      
      // حساب الرواتب
      const totals = calculateTotalSalary(
        employee.baseSalary,
        entryData.daysWorked,
        entryData.overtimeDays,
        entryData.weekendDays,
        salaryRules
      );
      
      // إنشاء أو تحديث الإدخال
      const entryId = `${entryData.monthKey}_${entryData.employeeId}`;
      const entryRef = doc(db, 'monthlyEntries', entryId);
      
      await updateDoc(entryRef, {
        ...entryData,
        totals,
        updatedAt: serverTimestamp()
      });
      
      return entryId;
    } catch (error) {
      console.error('خطأ في حفظ الإدخال الشهري:', error);
      throw new Error('فشل في حفظ الإدخال الشهري');
    }
  }

  static async createMonthlyEntry(entryData: Omit<MonthlyEntry, 'id' | 'createdAt' | 'updatedAt' | 'totals'>): Promise<string> {
    try {
      const db = this.getDb();
      
      // جلب قواعد الرواتب
      const salaryRules = await this.getSalaryRules();
      
      // جلب بيانات الموظف
      const employeeDoc = await getDoc(doc(db, 'employees', entryData.employeeId));
      if (!employeeDoc.exists()) {
        throw new Error('الموظف غير موجود');
      }
      
      const employee = employeeDoc.data() as Employee;
      
      // حساب الرواتب
      const totals = calculateTotalSalary(
        employee.baseSalary,
        entryData.daysWorked,
        entryData.overtimeDays,
        entryData.weekendDays,
        salaryRules
      );
      
      // إنشاء الإدخال
      const entryId = `${entryData.monthKey}_${entryData.employeeId}`;
      const entryRef = doc(db, 'monthlyEntries', entryId);
      
      await updateDoc(entryRef, {
        ...entryData,
        totals,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return entryId;
    } catch (error) {
      console.error('خطأ في إنشاء الإدخال الشهري:', error);
      throw new Error('فشل في إنشاء الإدخال الشهري');
    }
  }

  // خدمات قواعد الرواتب
  static async getSalaryRules(): Promise<SalaryRules> {
    try {
      const db = this.getDb();
      const docRef = doc(db, 'settings', 'salaryRules');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as SalaryRules;
      }
      
      // إرجاع قواعد افتراضية إذا لم تكن موجودة
      return {
        daysInMonthReference: 30,
        overtimeFactor: 1.5,
        weekendFactor: 2,
        rounding: 'round'
      };
    } catch (error) {
      console.error('خطأ في جلب قواعد الرواتب:', error);
      // إرجاع قواعد افتراضية في حالة الخطأ
      return {
        daysInMonthReference: 30,
        overtimeFactor: 1.5,
        weekendFactor: 2,
        rounding: 'round'
      };
    }
  }

  static async updateSalaryRules(rules: Partial<SalaryRules>): Promise<void> {
    try {
      const db = this.getDb();
      const docRef = doc(db, 'settings', 'salaryRules');
      await updateDoc(docRef, {
        ...rules,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('خطأ في تحديث قواعد الرواتب:', error);
      throw new Error('فشل في تحديث قواعد الرواتب');
    }
  }

  // خدمات المستخدمين
  static async getUser(uid: string): Promise<User | null> {
    try {
      const db = this.getDb();
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          uid: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as User;
      }
      
      return null;
    } catch (error) {
      console.error('خطأ في جلب المستخدم:', error);
      throw new Error('فشل في جلب المستخدم');
    }
  }
}
