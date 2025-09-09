
import { useState, useCallback } from 'react';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query as buildQuery,
  where,
  Query,
  DocumentData,
  FirestoreError
} from 'firebase/firestore';
import { useFirebase } from '../contexts/FirebaseContext';

interface FirestoreCRUDState<T> {
  data: T[] | null;
  item: T | null;
  loading: boolean;
  error: FirestoreError | null;
}

export const useFirestoreCRUD = <T>(collectionName: string) => {
  const { db } = useFirebase();
  const [state, setState] = useState<FirestoreCRUDState<T>>({
    data: null,
    item: null,
    loading: false,
    error: null,
  });

  const fetchData = useCallback(async (query?: Query<DocumentData>) => {
    if (!db) return;

    setState(prevState => ({ ...prevState, loading: true, error: null }));
    try {
      const querySnapshot = await getDocs(query || collection(db, collectionName));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      setState(prevState => ({ ...prevState, loading: false, data }));
    } catch (error) {
      setState(prevState => ({ ...prevState, loading: false, error: error as FirestoreError }));
    }
  }, [db, collectionName]);

  const fetchItem = useCallback(async (id: string) => {
    if (!db) return;

    setState(prevState => ({ ...prevState, loading: true, error: null }));
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const item = { id: docSnap.id, ...docSnap.data() } as T;
        setState(prevState => ({ ...prevState, loading: false, item }));
      } else {
        throw new Error('Document not found');
      }
    } catch (error) {
      setState(prevState => ({ ...prevState, loading: false, error: error as FirestoreError }));
    }
  }, [db, collectionName]);

  const createItem = useCallback(async (item: Omit<T, 'id'>) => {
    if (!db) return;

    setState(prevState => ({ ...prevState, loading: true, error: null }));
    try {
      const docRef = await addDoc(collection(db, collectionName), item);
      setState(prevState => ({ ...prevState, loading: false, item: { id: docRef.id, ...item } as T }));
    } catch (error) {
      setState(prevState => ({ ...prevState, loading: false, error: error as FirestoreError }));
    }
  }, [db, collectionName]);

  const updateItem = useCallback(async (id: string, item: Partial<T>) => {
    if (!db) return;

    setState(prevState => ({ ...prevState, loading: true, error: null }));
    try {
      const docRef = doc(db, collectionName, id);
      // Cast to avoid overly strict converter generics in Firestore typings
      await updateDoc(docRef as any, item as any);
      setState(prevState => ({ ...prevState, loading: false }));
    } catch (error) {
      setState(prevState => ({ ...prevState, loading: false, error: error as FirestoreError }));
    }
  }, [db, collectionName]);

  const deleteItem = useCallback(async (id: string) => {
    if (!db) return;

    setState(prevState => ({ ...prevState, loading: true, error: null }));
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      setState(prevState => ({ ...prevState, loading: false }));
    } catch (error) {
      setState(prevState => ({ ...prevState, loading: false, error: error as FirestoreError }));
    }
  }, [db, collectionName]);

  // Backward/compat helpers expected by pages
  const getCollection = useCallback(async () => {
    if (!db) return [];
    setState(prevState => ({ ...prevState, loading: true, error: null }));
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      setState(prevState => ({ ...prevState, loading: false, data }));
      return data;
    } catch (error) {
      setState(prevState => ({ ...prevState, loading: false, error: error as FirestoreError }));
      return [];
    }
  }, [db, collectionName]);

  const addDocument = useCallback(async (payload: Omit<T, 'id'>) => {
    if (!db) return '';
    const ref = await addDoc(collection(db, collectionName), payload);
    return ref.id;
  }, [db, collectionName]);

  const updateDocument = useCallback(async (id: string, payload: Partial<T>) => {
    await updateItem(id, payload);
  }, [updateItem]);

  const deleteDocument = useCallback(async (id: string) => {
    await deleteItem(id);
  }, [deleteItem]);

  type Filter = { field: string; operator: any; value: any };
  const queryCollection = useCallback(async (filters: Filter[]) => {
    if (!db) return [] as T[];
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const q = buildQuery(
        collection(db, collectionName),
        ...filters.map(f => where(f.field as any, f.operator, f.value))
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T));
      setState(prev => ({ ...prev, loading: false, data }));
      return data;
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: error as FirestoreError }));
      return [] as T[];
    }
  }, [db, collectionName]);

  const getDocument = useCallback(async (id: string) => {
    if (!db) return null;
    try {
      const ref = doc(db, collectionName, id);
      const snap = await getDoc(ref);
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
    } catch (error) {
      setState(prev => ({ ...prev, error: error as FirestoreError }));
      return null;
    }
  }, [db, collectionName]);

  return {
    ...state,
    fetchData,
    fetchItem,
    createItem,
    updateItem,
    deleteItem,
    // compatibility API used by pages
    getCollection,
    addDocument,
    updateDocument,
    deleteDocument,
    queryCollection,
    getDocument
  };
};
