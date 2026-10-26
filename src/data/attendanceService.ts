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
import type { AttendanceRecord, AttendanceStatus } from '@/types/student';
import { fetchStudentsByClassId } from '@/data/studentService';

const ATTENDANCE_COLLECTION = 'attendance';
const AUDIT_LOGS_COLLECTION = 'auditLogs';

function snapshotToAttendance(snapshot: DocumentSnapshot<DocumentData>): AttendanceRecord {
  const data = snapshot.data()!;
  return {
    id: snapshot.id,
    schoolId: data.schoolId ?? '',
    studentId: data.studentId ?? '',
    classId: data.classId ?? '',
    academicYearId: data.academicYearId ?? '',
    termId: data.termId ?? '',
    date: data.date ?? '',
    status: (data.status as AttendanceStatus) ?? 'present',
    remarks: data.remarks ?? undefined,
    markedBy: data.markedBy ?? '',
    markedAt: data.markedAt?.toDate?.()?.toISOString?.() ?? '',
    modifiedBy: data.modifiedBy ?? undefined,
    modifiedAt: data.modifiedAt?.toDate?.()?.toISOString?.() ?? undefined,
  };
}

export async function fetchAttendanceForClassDate(
  schoolId: string,
  classId: string,
  date: string,
): Promise<AttendanceRecord[]> {
  if (!firestore) return [];
  const q = query(
    collection(firestore, ATTENDANCE_COLLECTION),
    where('schoolId', '==', schoolId),
    where('classId', '==', classId),
    where('date', '==', date),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => snapshotToAttendance(d as DocumentSnapshot<DocumentData>));
}

export async function saveAttendance(
  schoolId: string,
  records: { studentId: string; status: AttendanceStatus; remarks?: string }[],
  classId: string,
  academicYearId: string,
  termId: string,
  date: string,
  userId: string,
): Promise<void> {
  if (!firestore) throw new Error('Firebase is not configured.');

  const existing = await fetchAttendanceForClassDate(schoolId, classId, date);
  const existingMap = new Map(existing.map((r) => [r.studentId, r]));

  const studentIds = records.map((r) => r.studentId);
  const enrolledStudents = await fetchStudentsByClassId(classId);
  const enrolledIds = new Set(enrolledStudents.map((s) => s.id));
  for (const sid of studentIds) {
    if (!enrolledIds.has(sid)) {
      throw new Error(`Student ${sid} is not enrolled in this class.`);
    }
  }

  const promises = records.map(async (rec) => {
    const existingRec = existingMap.get(rec.studentId);
    if (existingRec) {
      if (existingRec.status !== rec.status || existingRec.remarks !== rec.remarks) {
        await updateDoc(doc(firestore, ATTENDANCE_COLLECTION, existingRec.id), {
          status: rec.status,
          remarks: rec.remarks ?? null,
          modifiedBy: userId,
          modifiedAt: serverTimestamp(),
        });
      }
    } else {
      await addDoc(collection(firestore, ATTENDANCE_COLLECTION), {
        schoolId,
        studentId: rec.studentId,
        classId,
        academicYearId,
        termId,
        date,
        status: rec.status,
        remarks: rec.remarks ?? null,
        markedBy: userId,
        markedAt: serverTimestamp(),
      });
    }
  });

  await Promise.all(promises);

  await addDoc(collection(firestore, AUDIT_LOGS_COLLECTION), {
    schoolId,
    action: 'attendance_saved',
    collection: ATTENDANCE_COLLECTION,
    documentId: classId,
    performedBy: userId,
    details: `Attendance saved for class ${classId} on ${date} — ${records.length} students`,
    timestamp: serverTimestamp(),
  });
}

export async function fetchStudentAttendance(
  studentId: string,
  filters?: { startDate?: string; endDate?: string; status?: AttendanceStatus },
): Promise<AttendanceRecord[]> {
  if (!firestore) return [];
  const constraints: ReturnType<typeof where>[] = [where('studentId', '==', studentId)];
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }
  constraints.push(orderBy('date', 'desc'));
  const q = query(collection(firestore, ATTENDANCE_COLLECTION), ...constraints);
  const snapshot = await getDocs(q);
  let records = snapshot.docs.map((d) => snapshotToAttendance(d as DocumentSnapshot<DocumentData>));

  if (filters?.startDate) {
    records = records.filter((r) => r.date >= filters.startDate!);
  }
  if (filters?.endDate) {
    records = records.filter((r) => r.date <= filters.endDate!);
  }

  return records;
}

export async function fetchClassAttendanceHistory(
  schoolId: string,
  classId: string,
  filters?: { startDate?: string; endDate?: string; status?: AttendanceStatus; academicYearId?: string; termId?: string },
): Promise<AttendanceRecord[]> {
  if (!firestore) return [];
  const constraints: ReturnType<typeof where>[] = [
    where('schoolId', '==', schoolId),
    where('classId', '==', classId),
  ];
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters?.academicYearId) {
    constraints.push(where('academicYearId', '==', filters.academicYearId));
  }
  if (filters?.termId) {
    constraints.push(where('termId', '==', filters.termId));
  }
  constraints.push(orderBy('date', 'desc'));
  const q = query(collection(firestore, ATTENDANCE_COLLECTION), ...constraints);
  const snapshot = await getDocs(q);
  let records = snapshot.docs.map((d) => snapshotToAttendance(d as DocumentSnapshot<DocumentData>));

  if (filters?.startDate) {
    records = records.filter((r) => r.date >= filters.startDate!);
  }
  if (filters?.endDate) {
    records = records.filter((r) => r.date <= filters.endDate!);
  }

  return records;
}

export type AttendanceSummary = {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
};

export function computeSummary(records: AttendanceRecord[]): AttendanceSummary {
  const total = records.length;
  const present = records.filter((r) => r.status === 'present').length;
  const absent = records.filter((r) => r.status === 'absent').length;
  const late = records.filter((r) => r.status === 'late').length;
  const excused = records.filter((r) => r.status === 'excused').length;
  const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
  return { total, present, absent, late, excused, percentage };
}
