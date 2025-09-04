import { useState, useEffect, useCallback } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  signInAnonymously,
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '../services/firebase-init';
import { User, AuthState } from '../types';

export const useAuth = (): AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInAnonymous: () => Promise<void>;
} => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const auth = getFirebaseAuth();
      const db = getFirebaseDb();
      
      if (!auth || !db) {
        throw new Error('Firebase غير مُهيأ');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // جلب بيانات المستخدم من Firestore
      try {
        // أولاً: محاولة البحث بالـ UID
        let userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as Omit<User, 'uid'>;
          
          // التحقق من وجود حقول التاريخ قبل استدعاء toDate()
          const createdAt = userData.createdAt && typeof userData.createdAt === 'object' && 'toDate' in userData.createdAt
            ? (userData.createdAt as any).toDate() 
            : new Date(userData.createdAt || Date.now());
          const updatedAt = userData.updatedAt && typeof userData.updatedAt === 'object' && 'toDate' in userData.updatedAt
            ? (userData.updatedAt as any).toDate() 
            : new Date(userData.updatedAt || Date.now());
          
          setUser({
            uid: firebaseUser.uid,
            name: userData.name || 'مستخدم',
            email: userData.email || 'user@example.com',
            role: userData.role || 'user',
            regionId: userData.regionId,
            createdAt,
            updatedAt
          });
        } else {
          // إذا لم يتم العثور عليه بالـ UID، البحث بالبريد الإلكتروني
          const { FirestoreService } = await import('../services/firestoreService');
          const userByEmail = await FirestoreService.getUserByEmail(firebaseUser.email || '');
          
          if (userByEmail) {
            setUser({
              uid: firebaseUser.uid, // استخدام UID من Authentication
              name: userByEmail.name,
              email: userByEmail.email,
              role: userByEmail.role,
              regionId: userByEmail.regionId,
              createdAt: userByEmail.createdAt,
              updatedAt: userByEmail.updatedAt
            });
                     } else {
             // إذا لم يتم العثور على المستخدم، تسجيل الخروج
             await firebaseSignOut(auth);
             throw new Error('بيانات المستخدم غير موجودة في قاعدة البيانات');
           }
        }
      } catch (error) {
        console.error('خطأ في جلب بيانات المستخدم:', error);
        throw new Error('بيانات المستخدم غير موجودة');
      }
    } catch (err: any) {
      const errorMessage = err.code === 'auth/user-not-found' ? 'المستخدم غير موجود' :
                          err.code === 'auth/wrong-password' ? 'كلمة المرور خاطئة' :
                          err.code === 'auth/invalid-email' ? 'البريد الإلكتروني غير صحيح' :
                          err.message || 'خطأ في تسجيل الدخول';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const auth = getFirebaseAuth();
      if (auth) {
        await firebaseSignOut(auth);
        setUser(null);
      }
    } catch (err: any) {
      setError('خطأ في تسجيل الخروج');
      console.error('خطأ في تسجيل الخروج:', err);
    }
  }, []);

  const signInAnonymous = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      
      const auth = getFirebaseAuth();
      if (!auth) {
        throw new Error('Firebase غير مُهيأ');
      }

      const userCredential = await signInAnonymously(auth);
      const firebaseUser = userCredential.user;
      
      // إنشاء مستخدم مؤقت
      const tempUser: User = {
        uid: firebaseUser.uid,
        name: 'مستخدم تجريبي',
        email: 'anonymous@temp.com',
        role: 'admin',
        regionId: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setUser(tempUser);
    } catch (err: any) {
      setError('خطأ في تسجيل الدخول التجريبي');
      console.error('خطأ في تسجيل الدخول التجريبي:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser && !firebaseUser.isAnonymous) {
        try {
          const db = getFirebaseDb();
          if (db) {
            // أولاً: محاولة البحث بالـ UID
            let userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            
            if (userDoc.exists()) {
              const userData = userDoc.data() as Omit<User, 'uid'>;
              
              // التحقق من وجود حقول التاريخ قبل استدعاء toDate()
              const createdAt = userData.createdAt && typeof userData.createdAt === 'object' && 'toDate' in userData.createdAt
                ? (userData.createdAt as any).toDate() 
                : new Date(userData.createdAt || Date.now());
              const updatedAt = userData.updatedAt && typeof userData.updatedAt === 'object' && 'toDate' in userData.updatedAt
                ? (userData.updatedAt as any).toDate() 
                : new Date(userData.updatedAt || Date.now());
              
              setUser({
                uid: firebaseUser.uid,
                name: userData.name || 'مستخدم',
                email: userData.email || 'user@example.com',
                role: userData.role || 'user',
                regionId: userData.regionId,
                createdAt,
                updatedAt
              });
            } else {
              // إذا لم يتم العثور عليه بالـ UID، البحث بالبريد الإلكتروني
              if (firebaseUser.email) {
                try {
                  const { FirestoreService } = await import('../services/firestoreService');
                  const userByEmail = await FirestoreService.getUserByEmail(firebaseUser.email);
                  
                  if (userByEmail) {
                    setUser({
                      uid: firebaseUser.uid, // استخدام UID من Authentication
                      name: userByEmail.name,
                      email: userByEmail.email,
                      role: userByEmail.role,
                      regionId: userByEmail.regionId,
                      createdAt: userByEmail.createdAt,
                      updatedAt: userByEmail.updatedAt
                    });
                  } else {
                    // إذا لم يتم العثور على المستخدم، تسجيل الخروج
                    console.warn('لم يتم العثور على بيانات المستخدم في قاعدة البيانات');
                    await firebaseSignOut(auth);
                  }
                } catch (emailError) {
                  console.error('خطأ في البحث عن المستخدم بالبريد الإلكتروني:', emailError);
                  // لا نريد إظهار خطأ للمستخدم هنا، فقط تسجيله في console
                }
              }
            }
          }
        } catch (err) {
          console.error('خطأ في جلب بيانات المستخدم:', err);
        }
      } else if (!firebaseUser) {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    loading,
    error,
    signIn,
    signOut,
    signInAnonymous
  };
};
