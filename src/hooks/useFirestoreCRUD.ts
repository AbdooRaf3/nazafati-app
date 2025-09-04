import { useState, useCallback } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { getFirebaseDb } from '../services/firebase-init';

export const useFirestoreCRUD = <T extends { id?: string }>(collectionName: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCollection = useCallback(async (): Promise<T[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const db = getFirebaseDb();
      if (!db) throw new Error('Firebase غير مُهيأ');

      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (err: any) {
      const errorMessage = 'خطأ في جلب البيانات';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  const getDocument = useCallback(async (id: string): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const db = getFirebaseDb();
      if (!db) throw new Error('Firebase غير مُهيأ');

      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as T;
      }
      return null;
    } catch (err: any) {
      const errorMessage = 'خطأ في جلب المستند';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  const addDocument = useCallback(async (data: Omit<T, 'id'>): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      
      const db = getFirebaseDb();
      if (!db) throw new Error('Firebase غير مُهيأ');

      const docData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, collectionName), docData);
      return docRef.id;
    } catch (err: any) {
      const errorMessage = 'خطأ في إضافة المستند';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  const updateDocument = useCallback(async (id: string, data: Partial<T>): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const db = getFirebaseDb();
      if (!db) throw new Error('Firebase غير مُهيأ');

      const docRef = doc(db, collectionName, id);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updateData);
    } catch (err: any) {
      const errorMessage = 'خطأ في تحديث المستند';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  const deleteDocument = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const db = getFirebaseDb();
      if (!db) throw new Error('Firebase غير مُهيأ');

      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (err: any) {
      const errorMessage = 'خطأ في حذف المستند';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  const queryCollection = useCallback(async (
    conditions: Array<{ field: string; operator: any; value: any }>,
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'asc'
  ): Promise<T[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const db = getFirebaseDb();
      if (!db) throw new Error('Firebase غير مُهيأ');

      let q: any = collection(db, collectionName);
      
      // إضافة شروط البحث
      if (conditions.length > 0) {
        const whereConditions = conditions.map(cond => 
          where(cond.field, cond.operator, cond.value)
        );
        q = query(q, ...whereConditions);
      }
      
      // إضافة ترتيب
      if (orderByField) {
        q = query(q, orderBy(orderByField, orderDirection));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as T[];
    } catch (err: any) {
      const errorMessage = 'خطأ في البحث في البيانات';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  return {
    loading,
    error,
    getCollection,
    getDocument,
    addDocument,
    updateDocument,
    deleteDocument,
    queryCollection
  };
};
