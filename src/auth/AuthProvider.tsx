import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { AuthContext, type AuthContextValue, type SchoolProfile, type UserProfile, type UserRole } from '@/auth/AuthContext';
import { firebaseAuth, firestore, firebaseConfigError } from '@/lib/firebase';
import { findMaryCandylandSchool } from '@/data/schoolService';

function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.includes('Firebase is not configured')) {
    return error.message;
  }

  if (error instanceof Error && 'code' in error) {
    const code = (error as Error & { code?: string }).code;
    if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
      return 'The email or password is incorrect.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Too many attempts. Please wait a moment and try again.';
    }
  }

  return 'Unable to sign in right now. Please try again.';
}

async function fetchUserProfile(uid: string, email: string, schoolId: string): Promise<UserProfile> {
  if (!firestore) {
    return {
      uid,
      schoolId,
      displayName: email.split('@')[0],
      email,
      role: 'admin',
      active: true,
    };
  }

  const q = query(
    collection(firestore, 'users'),
    where('uid', '==', uid),
    limit(1),
  );
  const snap = await getDocs(q);

  if (!snap.empty) {
    const data = snap.docs[0].data();
    return {
      uid,
      schoolId,
      displayName: data.displayName ?? email.split('@')[0],
      email: data.email ?? email,
      role: (data.role as UserRole) ?? 'admin',
      active: data.active ?? true,
      linkedStudentIds: data.linkedStudentIds,
      linkedParentId: data.linkedParentId,
      linkedTeacherId: data.linkedTeacherId,
    };
  }

  const emailQuery = query(
    collection(firestore, 'users'),
    where('email', '==', email),
    limit(1),
  );
  const emailSnap = await getDocs(emailQuery);

  if (!emailSnap.empty) {
    const data = emailSnap.docs[0].data();
    return {
      uid,
      schoolId,
      displayName: data.displayName ?? email.split('@')[0],
      email: data.email ?? email,
      role: (data.role as UserRole) ?? 'admin',
      active: data.active ?? true,
      linkedStudentIds: data.linkedStudentIds,
      linkedParentId: data.linkedParentId,
      linkedTeacherId: data.linkedTeacherId,
    };
  }

  return {
    uid,
    schoolId,
    displayName: email.split('@')[0],
    email,
    role: 'admin',
    active: true,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseAuth) {
      setLoading(false);
      return undefined;
    }

    return onAuthStateChanged(firebaseAuth, async (nextUser) => {
      setUser(nextUser);
      setSchool(null);
      setProfile(null);
      setProfileError(null);

      if (!nextUser) {
        setLoading(false);
        return;
      }

      try {
        const found = await findMaryCandylandSchool();
        if (!found) {
          setProfileError('The Mary Candyland School record could not be found in the database. Please contact the system owner.');
          setLoading(false);
          return;
        }
        setSchool(found);
        const userProfile = await fetchUserProfile(nextUser.uid, nextUser.email ?? '', found.id);
        setProfile(userProfile);
      } catch {
        setProfileError('Unable to load your school workspace. Please try again.');
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    school,
    loading,
    configError: firebaseConfigError,
    profileError,
    signIn: async (email: string, password: string) => {
      if (!firebaseAuth) {
        throw new Error(firebaseConfigError ?? 'Firebase authentication is unavailable.');
      }
      try {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      } catch (error) {
        throw new Error(getAuthErrorMessage(error));
      }
    },
    signOutUser: async () => {
      if (firebaseAuth) await signOut(firebaseAuth);
    },
  }), [loading, profileError, school, user, profile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
