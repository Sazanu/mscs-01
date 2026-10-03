import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  addDoc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
  type DocumentData,
  type QueryConstraint,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { buildFullName, type Student, type StudentFormData, type AcademicYear, type SchoolClass } from '@/types/student';

const STUDENTS_COLLECTION = 'students';
const ACADEMIC_YEARS_COLLECTION = 'academicYears';
const CLASSES_COLLECTION = 'classes';

export type StudentQueryResult = {
  students: Student[];
  lastDoc: DocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
};

export type StudentQueryParams = {
  schoolId: string;
  search?: string;
  classFilter?: string;
  statusFilter?: string;
  pageSize?: number;
  cursor?: DocumentSnapshot<DocumentData> | null;
};

function snapshotToStudent(snapshot: DocumentSnapshot<DocumentData>): Student {
  const data = snapshot.data()!;
  return {
    id: snapshot.id,
    schoolId: data.schoolId ?? '',
    admissionNumber: data.admissionNumber ?? '',
    firstName: data.firstName ?? '',
    middleName: data.middleName ?? '',
    lastName: data.lastName ?? '',
    fullName: data.fullName ?? buildFullName(data.firstName ?? '', data.middleName ?? '', data.lastName ?? ''),
    gender: data.gender ?? 'male',
    dateOfBirth: data.dateOfBirth ?? '',
    nationality: data.nationality ?? '',
    photoUrl: data.photoUrl,
    phone: data.phone,
    email: data.email,
    address: data.address,
    admissionDate: data.admissionDate ?? '',
    previousSchool: data.previousSchool,
    classId: data.classId ?? '',
    academicYearId: data.academicYearId ?? '',
    parentIds: data.parentIds ?? [],
    status: data.status ?? 'active',
    guardian: data.guardian ?? { name: '', relationship: '', phone: '' },
    emergencyContact: data.emergencyContact,
    medicalNotes: data.medicalNotes,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? '',
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? '',
    createdBy: data.createdBy ?? '',
  };
}

export async function fetchStudents(params: StudentQueryParams): Promise<StudentQueryResult> {
  if (!firestore) throw new Error('Firebase is not configured.');

  const pageSize = params.pageSize ?? 10;
  const constraints: QueryConstraint[] = [
    where('schoolId', '==', params.schoolId),
    orderBy('createdAt', 'desc'),
    limit(pageSize + 1),
  ];

  if (params.classFilter) {
    constraints.splice(1, 0, where('classId', '==', params.classFilter));
  }
  if (params.statusFilter) {
    constraints.splice(1, 0, where('status', '==', params.statusFilter));
  }
  if (params.cursor) {
    constraints.push(startAfter(params.cursor));
  }

  const q = query(collection(firestore, STUDENTS_COLLECTION), ...constraints);
  const snapshot = await getDocs(q);
  const docs = snapshot.docs;
  const hasMore = docs.length > pageSize;
  const visibleDocs = hasMore ? docs.slice(0, pageSize) : docs;
  const students = visibleDocs.map(snapshotToStudent);
  const lastDoc = visibleDocs.length > 0 ? visibleDocs[visibleDocs.length - 1] : null;

  return { students, lastDoc, hasMore };
}

export async function checkAdmissionNumberUnique(schoolId: string, admissionNumber: string): Promise<boolean> {
  if (!firestore) throw new Error('Firebase is not configured.');
  const q = query(
    collection(firestore, STUDENTS_COLLECTION),
    where('schoolId', '==', schoolId),
    where('admissionNumber', '==', admissionNumber),
    limit(1),
  );
  const snapshot = await getDocs(q);
  return snapshot.empty;
}

export async function fetchStudentById(studentId: string): Promise<Student | null> {
  if (!firestore) throw new Error('Firebase is not configured.');
  const snap = await getDoc(doc(firestore, STUDENTS_COLLECTION, studentId));
  if (!snap.exists()) return null;
  return snapshotToStudent(snap as DocumentSnapshot<DocumentData>);
}

export async function fetchAcademicYears(schoolId: string): Promise<AcademicYear[]> {
  if (!firestore) return [];
  const q = query(
    collection(firestore, ACADEMIC_YEARS_COLLECTION),
    where('schoolId', '==', schoolId),
    orderBy('startDate', 'desc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      schoolId: data.schoolId ?? '',
      name: data.name ?? '',
      startDate: data.startDate ?? '',
      endDate: data.endDate ?? '',
      status: data.status ?? 'active',
      isCurrent: data.isCurrent ?? false,
    };
  });
}

export async function fetchClasses(schoolId: string): Promise<SchoolClass[]> {
  if (!firestore) return [];
  const q = query(
    collection(firestore, CLASSES_COLLECTION),
    where('schoolId', '==', schoolId),
    orderBy('name', 'asc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      schoolId: data.schoolId ?? '',
      name: data.name ?? '',
      level: data.level ?? '',
      section: data.section,
      academicYearId: data.academicYearId ?? '',
      classTeacherId: data.classTeacherId,
      capacity: data.capacity ?? 0,
      status: data.status ?? 'active',
    };
  });
}

function formDataToStudentData(formData: StudentFormData, schoolId: string) {
  const fullName = buildFullName(formData.firstName, formData.middleName, formData.lastName);
  return {
    schoolId,
    admissionNumber: formData.admissionNumber.trim(),
    firstName: formData.firstName.trim(),
    middleName: formData.middleName.trim() || null,
    lastName: formData.lastName.trim(),
    fullName,
    gender: formData.gender,
    dateOfBirth: formData.dateOfBirth,
    nationality: formData.nationality.trim(),
    admissionDate: formData.admissionDate,
    previousSchool: formData.previousSchool.trim() || null,
    classId: formData.classId,
    academicYearId: formData.academicYearId,
    parentIds: [] as string[],
    status: formData.status,
    guardian: {
      name: formData.guardianName.trim(),
      relationship: formData.guardianRelationship.trim(),
      phone: formData.guardianPhone.trim(),
      alternativePhone: formData.guardianAlternativePhone.trim() || null,
      email: formData.guardianEmail.trim() || null,
      address: formData.guardianAddress.trim() || null,
    },
    emergencyContact: formData.emergencyContactName.trim()
      ? {
          name: formData.emergencyContactName.trim(),
          phone: formData.emergencyContactPhone.trim(),
          relationship: formData.emergencyContactRelationship.trim() || null,
        }
      : null,
    updatedAt: serverTimestamp(),
  };
}

export async function createStudent(
  formData: StudentFormData,
  schoolId: string,
  userId: string,
): Promise<string> {
  if (!firestore) throw new Error('Firebase is not configured.');

  const isUnique = await checkAdmissionNumberUnique(schoolId, formData.admissionNumber.trim());
  if (!isUnique) {
    throw new Error('A student with this admission number already exists in this school.');
  }

  const data = {
    ...formDataToStudentData(formData, schoolId),
    createdAt: serverTimestamp(),
    createdBy: userId,
  };

  const docRef = await addDoc(collection(firestore, STUDENTS_COLLECTION), data);
  return docRef.id;
}

export async function updateStudent(
  studentId: string,
  formData: StudentFormData,
  schoolId: string,
): Promise<void> {
  if (!firestore) throw new Error('Firebase is not configured.');
  const data = formDataToStudentData(formData, schoolId);
  await updateDoc(doc(firestore, STUDENTS_COLLECTION, studentId), data);
}

export async function updateStudentStatus(studentId: string, status: string): Promise<void> {
  if (!firestore) throw new Error('Firebase is not configured.');
  await updateDoc(doc(firestore, STUDENTS_COLLECTION, studentId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function countStudentsBySchool(schoolId: string): Promise<number> {
  if (!firestore) return 0;
  const q = query(collection(firestore, STUDENTS_COLLECTION), where('schoolId', '==', schoolId));
  const snapshot = await getDocs(q);
  return snapshot.size;
}

// ─── Academic Years CRUD ─────────────────────────────────────

export async function createAcademicYear(
  schoolId: string,
  data: { name: string; startDate: string; endDate: string; isCurrent: boolean },
): Promise<string> {
  if (!firestore) throw new Error('Firebase is not configured.');
  const docRef = await addDoc(collection(firestore, ACADEMIC_YEARS_COLLECTION), {
    schoolId,
    name: data.name.trim(),
    startDate: data.startDate,
    endDate: data.endDate,
    isCurrent: data.isCurrent,
    status: 'active',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateAcademicYear(
  id: string,
  data: { name?: string; startDate?: string; endDate?: string; isCurrent?: boolean; status?: string },
): Promise<void> {
  if (!firestore) throw new Error('Firebase is not configured.');
  await updateDoc(doc(firestore, ACADEMIC_YEARS_COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteAcademicYear(id: string): Promise<void> {
  if (!firestore) throw new Error('Firebase is not configured.');
  await deleteDoc(doc(firestore, ACADEMIC_YEARS_COLLECTION, id));
}

// ─── Classes CRUD ────────────────────────────────────────────

export async function createClass(
  schoolId: string,
  data: { name: string; level: string; academicYearId: string; capacity: number },
): Promise<string> {
  if (!firestore) throw new Error('Firebase is not configured.');
  const docRef = await addDoc(collection(firestore, CLASSES_COLLECTION), {
    schoolId,
    name: data.name.trim(),
    level: data.level.trim(),
    academicYearId: data.academicYearId,
    capacity: data.capacity,
    status: 'active',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateClass(
  id: string,
  data: { name?: string; level?: string; academicYearId?: string; capacity?: number; status?: string },
): Promise<void> {
  if (!firestore) throw new Error('Firebase is not configured.');
  await updateDoc(doc(firestore, CLASSES_COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteClass(id: string): Promise<void> {
  if (!firestore) throw new Error('Firebase is not configured.');
  await deleteDoc(doc(firestore, CLASSES_COLLECTION, id));
}
