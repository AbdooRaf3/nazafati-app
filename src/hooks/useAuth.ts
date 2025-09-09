
import { useState, useEffect, useCallback } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  signInAnonymously,
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebase } from '../contexts/FirebaseContext';
import { User, AuthState } from '../types';
import { FirestoreService } from '../services/firestoreService';

export const useAuth = (): AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInAnonymous: () => Promise<void>;
} => {
  const { auth, db } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!auth || !db) return;

    try {
      setError(null);
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
      if (userDoc.exists()) {
        const userData = userDoc.data() as Omit<User, 'uid'>;
        
        const createdAt = userData.createdAt && typeof userData.createdAt === 'object' && 'toDate' in userData.createdAt
          ? (userData.createdAt as any).toDate() 
          : new Date(userData.createdAt || Date.now());
        const updatedAt = userData.updatedAt && typeof userData.updatedAt === 'object' && 'toDate' in userData.updatedAt
          ? (userData.updatedAt as any).toDate() 
          : new Date(userData.updatedAt || Date.now());
        
        setUser({
          uid: firebaseUser.uid,
          name: userData.name || 'User',
          email: userData.email || 'user@example.com',
          role: userData.role || 'user',
          regionId: userData.regionId,
          createdAt,
          updatedAt
        });
      } else {
        const userByEmail = await FirestoreService.getUserByEmail(db, firebaseUser.email || '');
        
        if (userByEmail) {
          setUser({
            uid: firebaseUser.uid,
            name: userByEmail.name,
            email: userByEmail.email,
            role: userByEmail.role,
            regionId: userByEmail.regionId,
            createdAt: userByEmail.createdAt,
            updatedAt: userByEmail.updatedAt
          });
        } else {
           await firebaseSignOut(auth);
           throw new Error('User data not found in the database');
        }
      }
    } catch (err: any) {
      const errorMessage = err.code === 'auth/user-not-found' ? 'User not found' :
                        err.code === 'auth/wrong-password' ? 'Incorrect password' :
                        err.code === 'auth/invalid-email' ? 'Invalid email' :
                        err.message || 'Error signing in';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [auth, db]);

  const signOut = useCallback(async () => {
    if (!auth) return;

    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (err: any) {
      setError('Error signing out');
      console.error('Error signing out:', err);
    }
  }, [auth]);

  const signInAnonymous = useCallback(async () => {
    if (!auth) return;

    try {
      setError(null);
      setLoading(true);

      const userCredential = await signInAnonymously(auth);
      const firebaseUser = userCredential.user;
      
      const tempUser: User = {
        uid: firebaseUser.uid,
        name: 'Demo User',
        email: 'anonymous@temp.com',
        role: 'admin',
        regionId: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setUser(tempUser);
    } catch (err: any) {
      setError('Error with anonymous sign-in');
      console.error('Error with anonymous sign-in:', err);
    } finally {
      setLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    if (!auth || !db) {
        setLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser && !firebaseUser.isAnonymous) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'uid'>;
            
            const createdAt = userData.createdAt && typeof userData.createdAt === 'object' && 'toDate' in userData.createdAt
              ? (userData.createdAt as any).toDate() 
              : new Date(userData.createdAt || Date.now());
            const updatedAt = userData.updatedAt && typeof userData.updatedAt === 'object' && 'toDate' in userData.updatedAt
              ? (userData.updatedAt as any).toDate() 
              : new Date(userData.updatedAt || Date.now());
            
            setUser({
              uid: firebaseUser.uid,
              name: userData.name || 'User',
              email: userData.email || 'user@example.com',
              role: userData.role || 'user',
              regionId: userData.regionId,
              createdAt,
              updatedAt
            });
          } else {
            if (firebaseUser.email) {
              try {
                const userByEmail = await FirestoreService.getUserByEmail(db, firebaseUser.email);
                
                if (userByEmail) {
                  setUser({
                    uid: firebaseUser.uid,
                    name: userByEmail.name,
                    email: userByEmail.email,
                    role: userByEmail.role,
                    regionId: userByEmail.regionId,
                    createdAt: userByEmail.createdAt,
                    updatedAt: userByEmail.updatedAt
                  });
                } else {
                  console.warn('User data not found in the database');
                  await firebaseSignOut(auth);
                }
              } catch (emailError) {
                console.error('Error searching for user by email:', emailError);
              }
            }
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      } else if (!firebaseUser) {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db]);

  return {
    user,
    loading,
    error,
    signIn,
    signOut,
    signInAnonymous
  };
};
