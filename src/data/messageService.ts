import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  serverTimestamp,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

const MESSAGES_COLLECTION = 'messages';
const USERS_COLLECTION = 'users';

export type Message = {
  id: string;
  schoolId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  subject: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export type UserDirectoryEntry = {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  role: string;
  active: boolean;
};

function snapshotToMessage(d: DocumentSnapshot<DocumentData>): Message {
  const data = d.data()!;
  return {
    id: d.id,
    schoolId: data.schoolId ?? '',
    senderId: data.senderId ?? '',
    senderName: data.senderName ?? '',
    senderRole: data.senderRole ?? '',
    recipientId: data.recipientId ?? '',
    recipientName: data.recipientName ?? '',
    subject: data.subject ?? '',
    body: data.body ?? '',
    read: data.read ?? false,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? '',
  };
}

export async function fetchUserDirectory(schoolId: string): Promise<UserDirectoryEntry[]> {
  if (!firestore) return [];
  const q = query(collection(firestore, USERS_COLLECTION), where('schoolId', '==', schoolId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      uid: data.uid ?? d.id,
      displayName: data.displayName ?? '',
      email: data.email ?? '',
      role: data.role ?? 'teacher',
      active: data.active ?? true,
    };
  });
}

export async function fetchMessagesForUser(schoolId: string, userId: string): Promise<{ inbox: Message[]; sent: Message[] }> {
  if (!firestore) return { inbox: [], sent: [] };
  const [inboxSnap, sentSnap] = await Promise.all([
    getDocs(query(
      collection(firestore, MESSAGES_COLLECTION),
      where('schoolId', '==', schoolId),
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc'),
    )),
    getDocs(query(
      collection(firestore, MESSAGES_COLLECTION),
      where('schoolId', '==', schoolId),
      where('senderId', '==', userId),
      orderBy('createdAt', 'desc'),
    )),
  ]);
  return {
    inbox: inboxSnap.docs.map((d) => snapshotToMessage(d)),
    sent: sentSnap.docs.map((d) => snapshotToMessage(d)),
  };
}

export async function sendMessage(
  schoolId: string,
  data: {
    senderId: string;
    senderName: string;
    senderRole: string;
    recipientId: string;
    recipientName: string;
    subject: string;
    body: string;
  },
): Promise<string> {
  if (!firestore) throw new Error('Firebase is not configured.');
  const docRef = await addDoc(collection(firestore, MESSAGES_COLLECTION), {
    schoolId,
    senderId: data.senderId,
    senderName: data.senderName,
    senderRole: data.senderRole,
    recipientId: data.recipientId,
    recipientName: data.recipientName,
    subject: data.subject.trim(),
    body: data.body.trim(),
    read: false,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function markMessageRead(messageId: string): Promise<void> {
  if (!firestore) throw new Error('Firebase is not configured.');
  await updateDoc(doc(firestore, MESSAGES_COLLECTION, messageId), { read: true });
}
