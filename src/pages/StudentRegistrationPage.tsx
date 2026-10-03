import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { StudentForm } from '@/components/StudentForm';
import { createStudent, fetchAcademicYears, fetchClasses } from '@/data/studentService';
import type { AcademicYear, SchoolClass } from '@/types/student';

type Props = {
  onBack: () => void;
  onCreated: (studentId: string) => void;
};

export function StudentRegistrationPage({ onBack, onCreated }: Props) {
  const { profile } = useAuth();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const schoolId = profile?.schoolId ?? '';
  const userId = profile?.uid ?? '';

  useEffect(() => {
    if (!schoolId) return;
    Promise.all([fetchAcademicYears(schoolId), fetchClasses(schoolId)])
      .then(([years, cls]) => {
        setAcademicYears(years);
        setClasses(cls);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load academic data.'))
      .finally(() => setLoading(false));
  }, [schoolId]);

  const handleSubmit = async (data: Parameters<typeof createStudent>[0]) => {
    const studentId = await createStudent(data, schoolId, userId);
    onCreated(studentId);
  };

  return (
    <div className="student-form-page">
      <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Back to directory</button>
      <div className="form-page-header">
        <p className="eyebrow">Student Management</p>
        <h1>Register New Student</h1>
        <p className="welcome-copy">Enter the student's personal, academic, and guardian details below.</p>
      </div>
      {error && <div className="auth-alert" style={{ marginBottom: '16px' }}>{error}</div>}
      {loading ? (
        <div className="empty-state"><div className="empty-spinner" /><p>Loading form…</p></div>
      ) : (
        <StudentForm
          academicYears={academicYears}
          classes={classes}
          onSubmit={handleSubmit}
          submitLabel="Register student"
          onCancel={onBack}
        />
      )}
    </div>
  );
}
