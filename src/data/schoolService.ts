import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import type { SchoolProfile } from '@/auth/AuthContext';

const SCHOOLS_COLLECTION = 'schools';

export async function findMaryCandylandSchool(): Promise<SchoolProfile | null> {
  if (!firestore) return null;

  const q = query(
    collection(firestore, SCHOOLS_COLLECTION),
    where('name', '>=', 'Mary Candyland'),
    where('name', '<=', 'Mary Candyland\uf8ff'),
    limit(10),
  );
  const snapshot = await getDocs(q);

  const match = snapshot.docs.find((d) => {
    const name = String(d.data().name ?? '').toLowerCase().trim();
    return name.includes('mary candyland');
  });
  if (match) {
    const data = match.data();
    return {
      id: match.id,
      name: data.name ?? 'Mary Candyland School Complex',
      code: data.code ?? '',
      country: data.country,
      active: data.active ?? true,
    };
  }

  return null;
}
