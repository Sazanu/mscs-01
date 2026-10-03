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
  status: string;
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
  status: string;
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

export function statusLabel(status: StudentStatus): string {
  return STUDENT_STATUSES.find((s) => s.value === status)?.label ?? status;
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
