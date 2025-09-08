
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit, 
  doc, 
  getDoc, 
  DocumentData, 
  Firestore 
} from 'firebase/firestore';
import { User } from '../types';

export const FirestoreService = {
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
      console.error('Error fetching user by email:', error);
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
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  },
};
