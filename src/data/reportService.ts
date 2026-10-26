import { getDocs, query, where, collection, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { fetchAllStudents, fetchAcademicYears, fetchClasses } from '@/data/studentService';
import { fetchSubjects, fetchClassSubjects } from '@/data/academicService';
import {
  fetchClassAttendanceHistory,
  computeSummary,
  type AttendanceSummary,
} from '@/data/attendanceService';
import type { Student, AcademicYear, SchoolClass, Subject, ClassSubject } from '@/types/student';
import type { AttendanceRecord } from '@/types/student';

export type EnrollmentByClass = { className: string; count: number };
export type EnrollmentByGender = { male: number; female: number };
export type EnrollmentByStatus = { status: string; count: number };
export type NewAdmissionsByYear = { yearName: string; count: number };
export type ClassSubjectReport = {
  className: string;
  subjectName: string;
  subjectCode: string;
  teacherId?: string;
};

export type StudentReportData = {
  total: number;
  byClass: EnrollmentByClass[];
  byGender: EnrollmentByGender;
  byStatus: EnrollmentByStatus[];
  newAdmissions: NewAdmissionsByYear[];
};

export async function generateStudentReport(schoolId: string): Promise<StudentReportData> {
  const students = await fetchAllStudents(schoolId);
  const classes = await fetchClasses(schoolId);
  const years = await fetchAcademicYears(schoolId);

  const classMap = new Map(classes.map((c) => [c.id, c.name]));

  const byClassMap = new Map<string, number>();
  for (const s of students) {
    const name = classMap.get(s.classId) ?? 'Unassigned';
    byClassMap.set(name, (byClassMap.get(name) ?? 0) + 1);
  }

  const byGender = { male: 0, female: 0 };
  for (const s of students) {
    byGender[s.gender] = (byGender[s.gender] ?? 0) + 1;
  }

  const byStatusMap = new Map<string, number>();
  for (const s of students) {
    byStatusMap.set(s.status, (byStatusMap.get(s.status) ?? 0) + 1);
  }

  const yearMap = new Map(years.map((y) => [y.id, y.name]));
  const newAdmissionsMap = new Map<string, number>();
  for (const s of students) {
    const yearName = yearMap.get(s.academicYearId) ?? 'Unknown';
    newAdmissionsMap.set(yearName, (newAdmissionsMap.get(yearName) ?? 0) + 1);
  }

  return {
    total: students.length,
    byClass: Array.from(byClassMap.entries()).map(([className, count]) => ({ className, count })).sort((a, b) => b.count - a.count),
    byGender,
    byStatus: Array.from(byStatusMap.entries()).map(([status, count]) => ({ status, count })),
    newAdmissions: Array.from(newAdmissionsMap.entries()).map(([yearName, count]) => ({ yearName, count })),
  };
}

export type AttendanceReportData = {
  summary: AttendanceSummary;
  byStudent: { studentId: string; studentName: string; present: number; absent: number; late: number; excused: number; percentage: number }[];
  byDate: { date: string; present: number; absent: number; late: number; excused: number; total: number; percentage: number }[];
};

export async function generateAttendanceReport(
  schoolId: string,
  classId: string,
  filters?: { startDate?: string; endDate?: string; academicYearId?: string; termId?: string },
): Promise<AttendanceReportData> {
  const records = await fetchClassAttendanceHistory(schoolId, classId, filters);
  const students = await fetchAllStudents(schoolId);
  const studentMap = new Map(students.map((s) => [s.id, s.fullName]));

  const byStudentMap = new Map<string, { present: number; absent: number; late: number; excused: number }>();
  const byDateMap = new Map<string, { present: number; absent: number; late: number; excused: number; total: number }>();

  for (const r of records) {
    const s = byStudentMap.get(r.studentId) ?? { present: 0, absent: 0, late: 0, excused: 0 };
    s[r.status]++;
    byStudentMap.set(r.studentId, s);

    const d = byDateMap.get(r.date) ?? { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    d[r.status]++;
    d.total++;
    byDateMap.set(r.date, d);
  }

  const byStudent = Array.from(byStudentMap.entries()).map(([studentId, counts]) => {
    const total = counts.present + counts.absent + counts.late + counts.excused;
    return {
      studentId,
      studentName: studentMap.get(studentId) ?? 'Unknown',
      ...counts,
      percentage: total > 0 ? Math.round(((counts.present + counts.late) / total) * 100) : 0,
    };
  }).sort((a, b) => b.percentage - a.percentage);

  const byDate = Array.from(byDateMap.entries()).map(([date, counts]) => ({
    date,
    ...counts,
    percentage: counts.total > 0 ? Math.round(((counts.present + counts.late) / counts.total) * 100) : 0,
  })).sort((a, b) => b.date.localeCompare(a.date));

  return {
    summary: computeSummary(records),
    byStudent,
    byDate,
  };
}

export type AcademicReportData = {
  classList: { id: string; name: string; level: string; capacity: number; enrolled: number }[];
  subjectAllocation: ClassSubjectReport[];
  yearEnrollment: { yearName: string; total: number }[];
};

export async function generateAcademicReport(schoolId: string): Promise<AcademicReportData> {
  const [classes, subjects, classSubjects, students, years] = await Promise.all([
    fetchClasses(schoolId),
    fetchSubjects(schoolId),
    fetchClassSubjects(schoolId),
    fetchAllStudents(schoolId),
    fetchAcademicYears(schoolId),
  ]);

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const classMap = new Map(classes.map((c) => [c.id, c]));
  const yearMap = new Map(years.map((y) => [y.id, y.name]));

  const classList = classes.map((c) => {
    const enrolled = students.filter((s) => s.classId === c.id && s.status === 'active').length;
    return { id: c.id, name: c.name, level: c.level, capacity: c.capacity, enrolled };
  });

  const subjectAllocation: ClassSubjectReport[] = classSubjects.map((cs) => {
    const subject = subjectMap.get(cs.subjectId);
    const cls = classMap.get(cs.classId);
    return {
      className: cls?.name ?? '—',
      subjectName: subject?.name ?? '—',
      subjectCode: subject?.code ?? '—',
      teacherId: cs.teacherId,
    };
  });

  const yearEnrollmentMap = new Map<string, number>();
  for (const s of students) {
    const yearName = yearMap.get(s.academicYearId) ?? 'Unknown';
    yearEnrollmentMap.set(yearName, (yearEnrollmentMap.get(yearName) ?? 0) + 1);
  }
  const yearEnrollment = Array.from(yearEnrollmentMap.entries()).map(([yearName, total]) => ({ yearName, total }));

  return { classList, subjectAllocation, yearEnrollment };
}

// ─── CSV Export ──────────────────────────────────────────────

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
