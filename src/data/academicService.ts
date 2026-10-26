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
import type { Term, Subject, ClassSubject, AcademicYear, SchoolClass } from '@/types/student';
import { fetchAcademicYears, fetchClasses, updateAcademicYear } from '@/data/studentService';

const TERMS_COLLECTION = 'terms';
const SUBJECTS_COLLECTION = 'subjects';
const CLASS_SUBJECTS_COLLECTION = 'classSubjects';

// ─── Terms ───────────────────────────────────────────────────

export async function fetchTerms(schoolId: string, academicYearId?: string): Promise<Term[]> {
  if (!firestore) return [];
  const constraints = [where('schoolId', '==', schoolId), orderBy('startDate', 'asc')];
  if (academicYearId) {
    constraints.splice(1, 0, where('academicYearId', '==', academicYearId));
  }
  const q = query(collection(firestore, TERMS_COLLECTION), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      schoolId: data.schoolId ?? '',
      academicYearId: data.academicYearId ?? '',
      name: data.name ?? '',
      startDate: data.startDate ?? '',
      endDate: data.endDate ?? '',
      status: (data.status as Term['status']) ?? 'active',
      isCurrent: data.isCurrent ?? false,
    };
  });
}

export async function createTerm(
  schoolId: string,
  data: { academicYearId: string; name: string; startDate: string; endDate: string; isCurrent: boolean },
): Promise<string> {
  if (!firestore) throw new Error('Firebase is not configured.');

  const years = await fetchAcademicYears(schoolId);
  const year = years.find((y) => y.id === data.academicYearId);
  if (!year) throw new Error('Academic year not found.');

  const existingTerms = await fetchTerms(schoolId, data.academicYearId);

  const newStart = new Date(data.startDate);
  const newEnd = new Date(data.endDate);
  for (const t of existingTerms) {
    if (t.status !== 'active') continue;
    const tStart = new Date(t.startDate);
    const tEnd = new Date(t.endDate);
    if (newStart < tEnd && newEnd > tStart) {
      throw new Error(`Term overlaps with existing term "${t.name}" (${t.startDate} to ${t.endDate}).`);
    }
  }

  if (data.isCurrent) {
    for (const t of existingTerms) {
      if (t.isCurrent) {
        await updateDoc(doc(firestore, TERMS_COLLECTION, t.id), { isCurrent: false, updatedAt: serverTimestamp() });
      }
    }
  }

  const docRef = await addDoc(collection(firestore, TERMS_COLLECTION), {
    schoolId,
    academicYearId: data.academicYearId,
    name: data.name.trim(),
    startDate: data.startDate,
    endDate: data.endDate,
    isCurrent: data.isCurrent,
    status: 'active',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateTerm(
  id: string,
  data: { name?: string; startDate?: string; endDate?: string; isCurrent?: boolean; status?: string },
): Promise<void> {
  if (!firestore) throw new Error('Firebase is not configured.');
  await updateDoc(doc(firestore, TERMS_COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteTerm(id: string): Promise<void> {
  if (!firestore) throw new Error('Firebase is not configured.');
  await deleteDoc(doc(firestore, TERMS_COLLECTION, id));
}

export async function setCurrentTerm(schoolId: string, termId: string): Promise<void> {
  if (!firestore) throw new Error('Firebase is not configured.');
  const allTerms = await fetchTerms(schoolId);
  await Promise.all(
    allTerms.map((t) =>
      updateDoc(doc(firestore, TERMS_COLLECTION, t.id), {
        isCurrent: t.id === termId,
        updatedAt: serverTimestamp(),
      }),
    ),
  );
}

// ─── Subjects ────────────────────────────────────────────────

export async function fetchSubjects(schoolId: string): Promise<Subject[]> {
  if (!firestore) return [];
  const q = query(
    collection(firestore, SUBJECTS_COLLECTION),
    where('schoolId', '==', schoolId),
    orderBy('name', 'asc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      schoolId: data.schoolId ?? '',
      code: data.code ?? '',
      name: data.name ?? '',
      applicableLevels: data.applicableLevels ?? [],
      status: (data.status as Subject['status']) ?? 'active',
    };
  });
}

export async function createSubject(
  schoolId: string,
  data: { code: string; name: string; applicableLevels: string[] },
): Promise<string> {
  if (!firestore) throw new Error('Firebase is not configured.');
  const existing = await getDocs(
    query(
      collection(firestore, SUBJECTS_COLLECTION),
      where('schoolId', '==', schoolId),
      where('code', '==', data.code.trim()),
    ),
  );
  if (!existing.empty) throw new Error('A subject with this code already exists.');

  const docRef = await addDoc(collection(firestore, SUBJECTS_COLLECTION), {
    schoolId,
    code: data.code.trim(),
    name: data.name.trim(),
    applicableLevels: data.applicableLevels,
    status: 'active',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateSubject(
  id: string,
  data: { code?: string; name?: string; applicableLevels?: string[]; status?: string },
): Promise<void> {
  if (!firestore) throw new Error('Firebase is not configured.');
  await updateDoc(doc(firestore, SUBJECTS_COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteSubject(id: string): Promise<void> {
  if (!firestore) throw new Error('Firebase is not configured.');
  await deleteDoc(doc(firestore, SUBJECTS_COLLECTION, id));
}

// ─── Class-Subject assignments ───────────────────────────────

export async function fetchClassSubjects(schoolId: string, classId?: string): Promise<ClassSubject[]> {
  if (!firestore) return [];
  const constraints = [where('schoolId', '==', schoolId)];
  if (classId) {
    constraints.push(where('classId', '==', classId));
  }
  const q = query(collection(firestore, CLASS_SUBJECTS_COLLECTION), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      schoolId: data.schoolId ?? '',
      classId: data.classId ?? '',
      subjectId: data.subjectId ?? '',
      teacherId: data.teacherId ?? undefined,
      academicYearId: data.academicYearId ?? '',
    };
  });
}

export async function assignSubjectToClass(
  schoolId: string,
  data: { classId: string; subjectId: string; academicYearId: string; teacherId?: string },
): Promise<string> {
  if (!firestore) throw new Error('Firebase is not configured.');
  const existing = await getDocs(
    query(
      collection(firestore, CLASS_SUBJECTS_COLLECTION),
      where('schoolId', '==', schoolId),
      where('classId', '==', data.classId),
      where('subjectId', '==', data.subjectId),
      where('academicYearId', '==', data.academicYearId),
      limit(1),
    ),
  );
  if (!existing.empty) throw new Error('This subject is already assigned to this class for this academic year.');

  const docRef = await addDoc(collection(firestore, CLASS_SUBJECTS_COLLECTION), {
    schoolId,
    classId: data.classId,
    subjectId: data.subjectId,
    academicYearId: data.academicYearId,
    teacherId: data.teacherId ?? null,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function removeClassSubject(id: string): Promise<void> {
  if (!firestore) throw new Error('Firebase is not configured.');
  await deleteDoc(doc(firestore, CLASS_SUBJECTS_COLLECTION, id));
}

// re-exports for convenience
export { fetchAcademicYears, fetchClasses, updateAcademicYear };

// need limit import
import { limit } from 'firebase/firestore';
