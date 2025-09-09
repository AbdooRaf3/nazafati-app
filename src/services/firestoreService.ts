
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  doc,
  getDoc,
  updateDoc,
  Firestore
} from 'firebase/firestore';
import { User } from '../types';
import { errorHandler } from '../utils/errorHandler';

export const FirestoreService = {
  // Existing helpers
  getUserByEmail: async (db: Firestore, email: string): Promise<User | null> => {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data() as Omit<User, 'id'>;

        return {
          id: userDoc.id,
          ...userData
        } as User;
      } else {
        return null;
      }
    } catch (error) {
      errorHandler.handleFirestoreError(error, 'getUserByEmail');
      throw error;
    }
  },

  getUserById: async (db: Firestore, uid: string): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));

      if (userDoc.exists()) {
        const userData = userDoc.data() as Omit<User, 'id'>;
        return {
          id: userDoc.id,
          ...userData,
        } as User;
      } else {
        return null;
      }
    } catch (error) {
      errorHandler.handleFirestoreError(error, 'getUserById');
      throw error;
    }
  },

  // New helpers required by other modules/pages
  async getAllEmployees(db: Firestore, regionId?: string) {
    try {
      let q = query(collection(db, 'employees'));
      
      // إذا تم تحديد regionId، فلتر حسب المنطقة
      if (regionId) {
        q = query(q, where('regionId', '==', regionId));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    } catch (error) {
      errorHandler.handleFirestoreError(error, 'getAllEmployees');
      return [];
    }
  },

  async getMonthlyEntries(db: Firestore, monthKey: string, regionId?: string) {
    try {
      let q = query(collection(db, 'monthly-entries'), where('monthKey', '==', monthKey));
      if (regionId) {
        q = query(q, where('regionId', '==', regionId));
      }
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    } catch (error) {
      errorHandler.handleFirestoreError(error, 'getMonthlyEntries');
      return [];
    }
  },

  async getSalaryRules(db: Firestore) {
    try {
      const docRef = doc(db, 'salaryRules', 'salaryRules');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as any;
      }
      return {
        daysInMonthReference: 30,
        overtimeFactor: 1.5,
        weekendFactor: 2,
        rounding: 'round'
      } as const;
    } catch (error) {
      errorHandler.handleFirestoreError(error, 'getSalaryRules');
      return {
        daysInMonthReference: 30,
        overtimeFactor: 1.5,
        weekendFactor: 2,
        rounding: 'round'
      } as const;
    }
  },

  async getUser(db: Firestore, id: string) {
    try {
      const docRef = doc(db, 'users', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { uid: id, ...docSnap.data() } as User;
      }
      return null;
    } catch (error) {
      errorHandler.handleFirestoreError(error, 'getUser');
      return null;
    }
  },

  async updateDocument(db: Firestore, collection: string, id: string, data: any) {
    try {
      const docRef = doc(db, collection, id);
      await updateDoc(docRef, data);
    } catch (error) {
      errorHandler.handleFirestoreError(error, 'updateDocument');
      throw error;
    }
  }
};
