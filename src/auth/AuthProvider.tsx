import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { AuthContext, type AuthContextValue, type SchoolProfile } from '@/auth/AuthContext';
import { firebaseAuth, firebaseConfigError } from '@/lib/firebase';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
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
      setProfileError(null);

      if (!nextUser) {
        setLoading(false);
        return;
      }

      try {
        const found = await findMaryCandylandSchool();
        if (!found) {
          setProfileError('The Mary Candyland School record could not be found in the database. Please contact the system owner.');
        } else {
          setSchool(found);
        }
      } catch {
        setProfileError('Unable to load the Mary Candyland School workspace. Please try again.');
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile: school ? {
      uid: user?.uid ?? '',
      schoolId: school.id,
      displayName: user?.displayName ?? user?.email ?? 'Administrator',
      email: user?.email ?? '',
      role: 'admin',
      active: true,
    } : null,
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
  }), [loading, profileError, school, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
