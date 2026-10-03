import { useEffect, useState } from 'react';
import { ArrowLeft, Pencil, User, School, Phone, Mail, MapPin, Calendar, AlertCircle, Users } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { fetchStudentById, fetchAcademicYears, fetchClasses } from '@/data/studentService';
import { statusLabel, initialsFromName, type Student, type AcademicYear, type SchoolClass } from '@/types/student';

type Props = {
  studentId: string;
  onBack: () => void;
  onEdit: (studentId: string) => void;
};

export function StudentProfilePage({ studentId, onBack, onEdit }: Props) {
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
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load student profile.'))
      .finally(() => setLoading(false));
  }, [studentId, schoolId]);

  const className = (classId: string) => classes.find((c) => c.id === classId)?.name ?? '—';
  const yearName = (yearId: string) => academicYears.find((y) => y.id === yearId)?.name ?? '—';

  if (loading) {
    return (
      <div className="student-form-page">
        <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Back to directory</button>
        <div className="empty-state"><div className="empty-spinner" /><p>Loading student profile…</p></div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="student-form-page">
        <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Back to directory</button>
        <div className="empty-state"><AlertCircle size={36} /><h2>Unable to load profile</h2><p>{error ?? 'Student not found.'}</p></div>
      </div>
    );
  }

  return (
    <div className="student-profile-page">
      <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Back to directory</button>

      <div className="profile-header">
        <div className="profile-header-left">
          <div className={`student-avatar-lg avatar-${student.gender}`}>{initialsFromName(student.fullName)}</div>
          <div>
            <p className="eyebrow">Student Profile</p>
            <h1>{student.fullName}</h1>
            <p className="welcome-copy">{student.admissionNumber} · {className(student.classId)} · {statusLabel(student.status)}</p>
          </div>
        </div>
        <button className="primary-button" onClick={() => onEdit(studentId)}><Pencil size={16} /> Edit student</button>
      </div>

      <div className="profile-grid">
        <section className="panel profile-section">
          <div className="profile-section-heading"><User size={17} /><h2>Personal Information</h2></div>
          <dl className="profile-details">
            <div><dt>First name</dt><dd>{student.firstName}</dd></div>
            <div><dt>Middle name</dt><dd>{student.middleName || '—'}</dd></div>
            <div><dt>Surname</dt><dd>{student.lastName}</dd></div>
            <div><dt>Gender</dt><dd>{student.gender === 'male' ? 'Male' : 'Female'}</dd></div>
            <div><dt>Date of birth</dt><dd>{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-GB') : '—'}</dd></div>
            <div><dt>Nationality</dt><dd>{student.nationality || '—'}</dd></div>
          </dl>
        </section>

        <section className="panel profile-section">
          <div className="profile-section-heading"><School size={17} /><h2>Academic Information</h2></div>
          <dl className="profile-details">
            <div><dt>Admission number</dt><dd>{student.admissionNumber}</dd></div>
            <div><dt>Admission date</dt><dd>{student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('en-GB') : '—'}</dd></div>
            <div><dt>Academic year</dt><dd>{yearName(student.academicYearId)}</dd></div>
            <div><dt>Class</dt><dd>{className(student.classId)}</dd></div>
            <div><dt>Previous school</dt><dd>{student.previousSchool || '—'}</dd></div>
            <div><dt>Status</dt><dd><span className={`status-badge status-${student.status}`}>{statusLabel(student.status)}</span></dd></div>
          </dl>
        </section>

        <section className="panel profile-section">
          <div className="profile-section-heading"><Phone size={17} /><h2>Parent/Guardian</h2></div>
          <dl className="profile-details">
            <div><dt>Name</dt><dd>{student.guardian?.name || '—'}</dd></div>
            <div><dt>Relationship</dt><dd>{student.guardian?.relationship || '—'}</dd></div>
            <div><dt>Phone</dt><dd>{student.guardian?.phone || '—'}</dd></div>
            <div><dt>Alt. phone</dt><dd>{student.guardian?.alternativePhone || '—'}</dd></div>
            <div><dt><Mail size={11} /> Email</dt><dd>{student.guardian?.email || '—'}</dd></div>
            <div><dt><MapPin size={11} /> Address</dt><dd>{student.guardian?.address || '—'}</dd></div>
          </dl>
        </section>

        {student.emergencyContact && (
          <section className="panel profile-section">
            <div className="profile-section-heading"><AlertCircle size={17} /><h2>Emergency Contact</h2></div>
            <dl className="profile-details">
              <div><dt>Name</dt><dd>{student.emergencyContact.name}</dd></div>
              <div><dt>Phone</dt><dd>{student.emergencyContact.phone}</dd></div>
              <div><dt>Relationship</dt><dd>{student.emergencyContact.relationship || '—'}</dd></div>
            </dl>
          </section>
        )}

        <section className="panel profile-section">
          <div className="profile-section-heading"><Calendar size={17} /><h2>Enrollment History</h2></div>
          <p className="profile-placeholder">Enrollment history will appear here as class assignments are recorded. This section is prepared for future integration with attendance, assessments, report cards, and fee records.</p>
          <div className="enrollment-current">
            <Users size={15} />
            <div>
              <strong>Current class: {className(student.classId)}</strong>
              <span>Academic year: {yearName(student.academicYearId)}</span>
            </div>
          </div>
        </section>

        <section className="panel profile-section">
          <div className="profile-section-heading"><AlertCircle size={17} /><h2>Record Metadata</h2></div>
          <dl className="profile-details">
            <div><dt>Student ID</dt><dd><code>{student.id}</code></dd></div>
            <div><dt>Created</dt><dd>{student.createdAt ? new Date(student.createdAt).toLocaleString('en-GB') : '—'}</dd></div>
            <div><dt>Last updated</dt><dd>{student.updatedAt ? new Date(student.updatedAt).toLocaleString('en-GB') : '—'}</dd></div>
            <div><dt>Created by</dt><dd>{student.createdBy.slice(0, 8)}…</dd></div>
          </dl>
        </section>
      </div>
    </div>
  );
}
