import { useEffect, useState } from 'react';
import { BookOpen, CalendarDays, GraduationCap, Plus } from 'lucide-react';
import type { UserProfile } from '@/auth/AuthContext';
import { countStudentsBySchool, fetchAcademicYears, fetchClasses } from '@/data/studentService';
import type { AcademicYear, SchoolClass } from '@/types/student';

type DashboardPageProps = {
  profile: UserProfile;
  onAddStudent: () => void;
};

type DashboardData = {
  studentCount: number;
  classes: SchoolClass[];
  currentYear: AcademicYear | null;
};

export function DashboardPage({ profile, onAddStudent }: DashboardPageProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const schoolId = profile.schoolId;

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError('');

    Promise.all([countStudentsBySchool(schoolId), fetchClasses(schoolId), fetchAcademicYears(schoolId)])
      .then(([studentCount, classes, years]) => {
        if (cancelled) return;
        setData({
          studentCount,
          classes,
          currentYear: years.find((year) => year.isCurrent) ?? null,
        });
      })
      .catch(() => {
        if (!cancelled) setError('We could not load your school data. Please refresh the page to try again.');
      });

    return () => {
      cancelled = true;
    };
  }, [schoolId]);

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const firstName = profile.displayName.split(' ')[0];

  return (
    <>
      <section className="welcome-row">
        <div>
          <p className="eyebrow">{today}</p>
          <h1>Welcome back, {firstName}</h1>
          <p className="welcome-copy">A live overview of your school's records.</p>
        </div>
        <button className="primary-button" onClick={onAddStudent}><Plus size={18} /> Add student</button>
      </section>

      {error && <div className="auth-alert">{error}</div>}

      {!error && !data && <p className="welcome-copy">Loading your school records…</p>}

      {data && (
        <>
          <section className="metric-grid" aria-label="School overview">
            <article className="metric-card">
              <div className="metric-icon metric-blue"><GraduationCap size={20} /></div>
              <div className="metric-copy"><span>Students</span><strong>{data.studentCount}</strong><small>Registered in this school</small></div>
            </article>
            <article className="metric-card">
              <div className="metric-icon metric-green"><BookOpen size={20} /></div>
              <div className="metric-copy"><span>Classes</span><strong>{data.classes.length}</strong><small>{data.classes.filter((c) => c.status === 'active').length} active</small></div>
            </article>
            <article className="metric-card">
              <div className="metric-icon metric-amber"><CalendarDays size={20} /></div>
              <div className="metric-copy"><span>Current academic year</span><strong>{data.currentYear?.name ?? 'Not set'}</strong><small>{data.currentYear ? 'Marked as current' : 'No year is marked as current'}</small></div>
            </article>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div><p className="eyebrow">Academics</p><h2>Classes</h2></div>
            </div>
            {data.classes.length === 0 ? (
              <p className="welcome-copy">No classes have been recorded yet.</p>
            ) : (
              <div className="activity-list">
                {data.classes.map((schoolClass) => (
                  <div className="activity-item" key={schoolClass.id}>
                    <div className="activity-copy">
                      <strong>{schoolClass.name}</strong>
                      <span>{schoolClass.level}{schoolClass.section ? ` · Section ${schoolClass.section}` : ''} · Capacity {schoolClass.capacity}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
