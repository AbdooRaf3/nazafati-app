
import { useState, useCallback } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
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

export const useFirestoreCRUD = <T extends { id: string }> (collectionName: string) => {
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
      await updateDoc(docRef, item);
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

  return { ...state, fetchData, fetchItem, createItem, updateItem, deleteItem };
};
