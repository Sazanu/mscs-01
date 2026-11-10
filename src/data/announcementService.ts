import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

const ANNOUNCEMENTS_COLLECTION = 'announcements';

export type Announcement = {
  id: string;
  schoolId: string;
  title: string;
  body: string;
  audience: 'all' | 'staff' | 'parents' | 'students';
  priority: 'normal' | 'important' | 'urgent';
  postedBy: string;
  postedByName: string;
  createdAt: string;
  updatedAt?: string;
};

function snapshotToAnnouncement(d: DocumentSnapshot<DocumentData>): Announcement {
  const data = d.data()!;
  return {
    id: d.id,
    schoolId: data.schoolId ?? '',
    title: data.title ?? '',
    body: data.body ?? '',
    audience: (data.audience as Announcement['audience']) ?? 'all',
    priority: (data.priority as Announcement['priority']) ?? 'normal',
    postedBy: data.postedBy ?? '',
    postedByName: data.postedByName ?? 'Administrator',
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? '',
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.(),
  };
}

export async function fetchAnnouncements(schoolId: string): Promise<Announcement[]> {
  if (!firestore) return [];
  const q = query(
    collection(firestore, ANNOUNCEMENTS_COLLECTION),
    where('schoolId', '==', schoolId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => snapshotToAnnouncement(d));
}

export async function createAnnouncement(
  schoolId: string,
  data: {
    title: string;
    body: string;
    audience: Announcement['audience'];
    priority: Announcement['priority'];
    postedBy: string;
    postedByName: string;
  },
): Promise<string> {
  if (!firestore) throw new Error('Firebase is not configured.');
  const docRef = await addDoc(collection(firestore, ANNOUNCEMENTS_COLLECTION), {
    schoolId,
    title: data.title.trim(),
    body: data.body.trim(),
    audience: data.audience,
    priority: data.priority,
    postedBy: data.postedBy,
    postedByName: data.postedByName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  if (!firestore) throw new Error('Firebase is not configured.');
  await deleteDoc(doc(firestore, ANNOUNCEMENTS_COLLECTION, id));
}

export async function updateAnnouncement(
  id: string,
  data: { title: string; body: string; audience: Announcement['audience']; priority: Announcement['priority'] },
): Promise<void> {
  if (!firestore) throw new Error('Firebase is not configured.');
  await updateDoc(doc(firestore, ANNOUNCEMENTS_COLLECTION, id), {
    title: data.title.trim(),
    body: data.body.trim(),
    audience: data.audience,
    priority: data.priority,
    updatedAt: serverTimestamp(),
  });
}
