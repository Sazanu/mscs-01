import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { firestore } from '@/lib/firebase';

export const INITIAL_SCHOOL_ID = 'mary-candyland';

export type ProvisioningResult = {
  created: boolean;
  schoolId: string;
};

export async function provisionInitialSchool(user: User): Promise<ProvisioningResult> {
  if (!firestore) throw new Error('Firebase is not configured.');

  const schoolRef = doc(firestore, 'schools', INITIAL_SCHOOL_ID);
  const userRef = doc(firestore, 'users', user.uid);

  return runTransaction(firestore, async (transaction) => {
    const schoolSnapshot = await transaction.get(schoolRef);
    const userSnapshot = await transaction.get(userRef);

    if (schoolSnapshot.exists() && userSnapshot.exists()) {
      return { created: false, schoolId: INITIAL_SCHOOL_ID };
    }

    if (schoolSnapshot.exists() || userSnapshot.exists()) {
      throw new Error('The initial school setup is incomplete. Please contact an administrator.');
    }

    const timestamp = serverTimestamp();
    transaction.set(schoolRef, {
      name: 'Mary Candyland School Complex',
      code: 'MCS',
      country: 'Ghana',
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: user.uid,
      updatedBy: user.uid,
    });
    transaction.set(userRef, {
      uid: user.uid,
      schoolId: INITIAL_SCHOOL_ID,
      email: user.email ?? '',
      displayName: user.displayName ?? user.email ?? 'School Administrator',
      role: 'admin',
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return { created: true, schoolId: INITIAL_SCHOOL_ID };
  });
}
