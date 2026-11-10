import { useEffect, useState } from 'react';
import { BookOpen, CalendarDays, CircleDollarSign, GraduationCap, Megaphone, Plus, TrendingUp, Users } from 'lucide-react';
import type { UserProfile } from '@/auth/AuthContext';
import { countStudentsBySchool, fetchAcademicYears, fetchClasses } from '@/data/studentService';
import { generateFinanceSummary, type FinanceSummary } from '@/data/financeService';
import { fetchAnnouncements, type Announcement } from '@/data/announcementService';
import { computeSummary, fetchClassAttendanceHistory } from '@/data/attendanceService';
import type { AcademicYear, SchoolClass } from '@/types/student';

type DashboardPageProps = {
  profile: UserProfile;
  onAddStudent: () => void;
};

type DashboardData = {
  studentCount: number;
  classes: SchoolClass[];
  currentYear: AcademicYear | null;
  finance: FinanceSummary | null;
  announcements: Announcement[];
  attendanceRate: number | null;
};

function formatDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function DashboardPage({ profile, onAddStudent }: DashboardPageProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const schoolId = profile.schoolId;

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError('');

    Promise.all([
      countStudentsBySchool(schoolId),
      fetchClasses(schoolId),
      fetchAcademicYears(schoolId),
      generateFinanceSummary(schoolId).catch(() => null),
      fetchAnnouncements(schoolId).catch(() => []),
    ])
      .then(async ([studentCount, classes, years, finance, announcements]) => {
        if (cancelled) return;

        let attendanceRate: number | null = null;
        const currentYear = years.find((year) => year.isCurrent) ?? null;
        if (classes.length > 0 && currentYear) {
          try {
            const records = await fetchClassAttendanceHistory(schoolId, classes[0].id, { academicYearId: currentYear.id });
            if (records.length > 0) {
              attendanceRate = computeSummary(records).percentage;
            }
          } catch { /* non-critical */ }
        }

        if (!cancelled) {
          setData({ studentCount, classes, currentYear, finance, announcements, attendanceRate });
        }
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
  const isAdmin = profile.role === 'admin' || profile.role === 'superAdmin';

  return (
    <>
      <section className="welcome-row">
        <div>
          <p className="eyebrow">{today}</p>
          <h1>Welcome back, {firstName}</h1>
          <p className="welcome-copy">A live overview of your school's records.</p>
        </div>
        {isAdmin && <button className="primary-button" onClick={onAddStudent}><Plus size={18} /> Add student</button>}
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
              <div className="metric-copy"><span>Current year</span><strong style={{ fontSize: '16px' }}>{data.currentYear?.name ?? 'Not set'}</strong><small>{data.currentYear ? 'Marked as current' : 'No year is marked as current'}</small></div>
            </article>
            {data.finance && (
              <article className="metric-card">
                <div className="metric-icon metric-coral"><CircleDollarSign size={20} /></div>
                <div className="metric-copy">
                  <span>Collected</span>
                  <strong style={{ fontSize: '18px' }}>GH₵ {data.finance.totalCollected.toLocaleString('en-GB', { maximumFractionDigits: 0 })}</strong>
                  <small>{data.finance.collectionRate}% collection rate</small>
                </div>
              </article>
            )}
          </section>

          <div className="dashboard-grid">
            <section className="panel activities-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">Academics</p><h2>Classes</h2></div>
                {data.attendanceRate !== null && (
                  <div className="attendance-rate-badge">
                    <TrendingUp size={14} />
                    <span>{data.attendanceRate}% attendance</span>
                  </div>
                )}
              </div>
              {data.classes.length === 0 ? (
                <p className="welcome-copy">No classes have been recorded yet.</p>
              ) : (
                <div className="activity-list">
                  {data.classes.map((schoolClass) => (
                    <div className="activity-item" key={schoolClass.id}>
                      <div className="activity-icon"><Users size={16} /></div>
                      <div className="activity-copy">
                        <strong>{schoolClass.name}</strong>
                        <span>{schoolClass.level}{schoolClass.section ? ` · Section ${schoolClass.section}` : ''} · Capacity {schoolClass.capacity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div><p className="eyebrow">Communications</p><h2>Recent Announcements</h2></div>
              </div>
              {data.announcements.length === 0 ? (
                <p className="welcome-copy">No announcements have been posted yet.</p>
              ) : (
                <div className="activity-list">
                  {data.announcements.slice(0, 5).map((ann) => (
                    <div className="activity-item" key={ann.id}>
                      <div className="activity-icon"><Megaphone size={16} /></div>
                      <div className="activity-copy">
                        <strong>{ann.title}</strong>
                        <span>{ann.postedByName} · {formatDate(ann.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
