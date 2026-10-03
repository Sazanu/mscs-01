import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { AuthContext, type AuthContextValue, type SchoolProfile, type UserProfile } from '@/auth/AuthContext';
import { firebaseAuth, firebaseConfigError, firestore } from '@/lib/firebase';

function isUserProfileData(data: Record<string, unknown>): data is Omit<UserProfile, 'uid'> {
  return typeof data.schoolId === 'string'
    && typeof data.displayName === 'string'
    && typeof data.email === 'string'
    && typeof data.role === 'string'
    && ['superAdmin', 'admin', 'teacher', 'parent', 'student'].includes(data.role)
    && data.active === true;
}

function isSchoolProfileData(data: Record<string, unknown>): data is Omit<SchoolProfile, 'id'> {
  return typeof data.name === 'string'
    && typeof data.code === 'string'
    && data.active === true;
}

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseAuth) {
      setLoading(false);
      return undefined;
    }

    return onAuthStateChanged(firebaseAuth, async (nextUser) => {
      setUser(nextUser);
      setProfile(null);
      setSchool(null);
      setNeedsSetup(false);
      setProfileError(null);

      if (!nextUser) {
        setLoading(false);
        return;
      }

      if (!firestore) {
        setProfileError('Your account could not be loaded because Firebase is not configured.');
        setLoading(false);
        return;
      }

      try {
        const profileSnapshot = await getDoc(doc(firestore, 'users', nextUser.uid));
        if (!profileSnapshot.exists()) {
          setNeedsSetup(true);
        } else {
          const profileData = profileSnapshot.data();
          if (!isUserProfileData(profileData)) {
            setProfileError('Your school access profile is incomplete or inactive. Please contact an administrator.');
          } else {
            const schoolSnapshot = await getDoc(doc(firestore, 'schools', profileData.schoolId));
            const schoolData = schoolSnapshot.data();
            if (!schoolSnapshot.exists() || !schoolData || !isSchoolProfileData(schoolData)) {
              setProfileError('Your school workspace could not be found. Please contact an administrator.');
            } else {
              setProfile({ uid: profileSnapshot.id, ...profileData });
              setSchool({ id: schoolSnapshot.id, ...schoolData });
            }
          }
        }
      } catch {
        setProfileError('Unable to load your school access profile. Please try again.');
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    school,
    needsSetup,
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
  }), [loading, needsSetup, profile, profileError, school, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

