import { createContext, useContext } from 'react';
import type { User } from 'firebase/auth';

export type UserRole = 'superAdmin' | 'admin' | 'teacher' | 'parent' | 'student';

export type SchoolProfile = {
  id: string;
  name: string;
  code: string;
  country?: string;
  active: boolean;
};

export type UserProfile = {
  uid: string;
  schoolId: string;
  displayName: string;
  email: string;
  role: UserRole;
  active: boolean;
  linkedStudentIds?: string[];
  linkedParentId?: string;
  linkedTeacherId?: string;
};

export type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  school: SchoolProfile | null;
  needsSetup: boolean;
  loading: boolean;
  configError: string | null;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
