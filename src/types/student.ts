export type StudentStatus = 'active' | 'inactive' | 'graduated' | 'transferred' | 'withdrawn';

export type Gender = 'male' | 'female';

export type EmergencyContact = {
  name: string;
  phone: string;
  relationship: string;
};

export type ParentGuardian = {
  name: string;
  relationship: string;
  phone: string;
  alternativePhone?: string;
  email?: string;
  address?: string;
};

export type Student = {
  id: string;
  schoolId: string;
  studentId: string;
  admissionNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: string;
  nationality: string;
  photoUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  admissionDate: string;
  previousSchool?: string;
  classId: string;
  academicYearId: string;
  parentIds: string[];
  status: StudentStatus;
  guardian: ParentGuardian;
  emergencyContact?: EmergencyContact;
  medicalNotes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};

export type StudentFormData = {
  firstName: string;
  middleName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
  nationality: string;
  admissionNumber: string;
  admissionDate: string;
  academicYearId: string;
  classId: string;
  previousSchool: string;
  status: StudentStatus;
  guardianName: string;
  guardianRelationship: string;
  guardianPhone: string;
  guardianAlternativePhone: string;
  guardianEmail: string;
  guardianAddress: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
};

export type AcademicYear = {
  id: string;
  schoolId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'closed';
  isCurrent: boolean;
};

export type Term = {
  id: string;
  schoolId: string;
  academicYearId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'closed';
  isCurrent: boolean;
};

export type SchoolClass = {
  id: string;
  schoolId: string;
  name: string;
  level: string;
  section?: string;
  academicYearId: string;
  classTeacherId?: string;
  capacity: number;
  status: 'active' | 'inactive';
};

export type Subject = {
  id: string;
  schoolId: string;
  code: string;
  name: string;
  applicableLevels: string[];
  status: 'active' | 'inactive';
};

export type ClassSubject = {
  id: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  teacherId?: string;
  academicYearId: string;
};

export type StudentClassHistory = {
  id: string;
  schoolId: string;
  studentId: string;
  fromClassId?: string;
  toClassId: string;
  academicYearId: string;
  reason: string;
  changedBy: string;
  changedAt: string;
};

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type AttendanceRecord = {
  id: string;
  schoolId: string;
  studentId: string;
  classId: string;
  academicYearId: string;
  termId: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
  markedBy: string;
  markedAt: string;
  modifiedBy?: string;
  modifiedAt?: string;
};

export type AuditLog = {
  id: string;
  schoolId: string;
  action: string;
  collection: string;
  documentId: string;
  performedBy: string;
  details: string;
  timestamp: string;
};

export const STUDENT_STATUSES: { value: StudentStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'graduated', label: 'Graduated' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

export const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export const ATTENDANCE_STATUSES: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: 'present', label: 'Present', color: '#238c70' },
  { value: 'absent', label: 'Absent', color: '#dc6b5f' },
  { value: 'late', label: 'Late', color: '#c78118' },
  { value: 'excused', label: 'Excused', color: '#2c64ad' },
];

export const CLASS_LEVELS = [
  'Creche', 'Nursery', 'KG 1', 'KG 2',
  'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
  'JHS 1', 'JHS 2', 'JHS 3',
];

export function statusLabel(status: StudentStatus): string {
  return STUDENT_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function attendanceLabel(status: AttendanceStatus): string {
  return ATTENDANCE_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function buildFullName(firstName: string, middleName: string, lastName: string): string {
  return [firstName, middleName, lastName].filter(Boolean).join(' ');
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
