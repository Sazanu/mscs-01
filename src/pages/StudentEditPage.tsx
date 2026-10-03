import { useEffect, useState } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { StudentForm } from '@/components/StudentForm';
import { fetchStudentById, fetchAcademicYears, fetchClasses, updateStudent, checkAdmissionNumberUnique } from '@/data/studentService';
import type { AcademicYear, SchoolClass, Student, StudentFormData } from '@/types/student';

type Props = {
  studentId: string;
  onBack: () => void;
  onSaved: () => void;
};

export function StudentEditPage({ studentId, onBack, onSaved }: Props) {
  const { profile } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const schoolId = profile?.schoolId ?? '';

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    Promise.all([
      fetchStudentById(studentId),
      fetchAcademicYears(schoolId),
      fetchClasses(schoolId),
    ])
      .then(([s, years, cls]) => {
        if (!s) {
          setError('Student not found.');
        } else {
          setStudent(s);
          setAcademicYears(years);
          setClasses(cls);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load student.'))
      .finally(() => setLoading(false));
  }, [studentId, schoolId]);

  const handleSubmit = async (data: StudentFormData) => {
    if (!student) return;
    const newAdmission = data.admissionNumber.trim();
    if (newAdmission !== student.admissionNumber) {
      const isUnique = await checkAdmissionNumberUnique(schoolId, newAdmission);
      if (!isUnique) {
        throw new Error('A student with this admission number already exists in this school.');
      }
    }
    await updateStudent(studentId, data, schoolId);
    onSaved();
  };

  if (loading) {
    return (
      <div className="student-form-page">
        <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <div className="empty-state"><div className="empty-spinner" /><p>Loading student…</p></div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="student-form-page">
        <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <div className="empty-state"><AlertCircle size={36} /><h2>Unable to load student</h2><p>{error ?? 'Student not found.'}</p></div>
      </div>
    );
  }

  return (
    <div className="student-form-page">
      <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Back to profile</button>
      <div className="form-page-header">
        <p className="eyebrow">Student Management</p>
        <h1>Edit Student</h1>
        <p className="welcome-copy">Update {student.fullName}'s information below.</p>
      </div>
      <StudentForm
        initialData={student}
        academicYears={academicYears}
        classes={classes}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
        onCancel={onBack}
        studentId={studentId}
      />
    </div>
  );
}
