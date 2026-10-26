import { useCallback, useEffect, useState } from 'react';
import { Download, FileText, Users, CalendarDays, BookOpen, BarChart3 } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { fetchClasses, fetchAcademicYears } from '@/data/studentService';
import {
  generateStudentReport,
  generateAttendanceReport,
  generateAcademicReport,
  exportToCSV,
  type StudentReportData,
  type AttendanceReportData,
  type AcademicReportData,
} from '@/data/reportService';
import { statusLabel, formatDate, type SchoolClass, type AcademicYear } from '@/types/student';

type ReportTab = 'students' | 'attendance' | 'academic';

export function ReportsPage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId ?? '';
  const [tab, setTab] = useState<ReportTab>('students');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);

  const [studentReport, setStudentReport] = useState<StudentReportData | null>(null);
  const [attendanceReport, setAttendanceReport] = useState<AttendanceReportData | null>(null);
  const [academicReport, setAcademicReport] = useState<AcademicReportData | null>(null);

  const [attClassId, setAttClassId] = useState('');
  const [attStartDate, setAttStartDate] = useState('');
  const [attEndDate, setAttEndDate] = useState('');

  const loadData = useCallback(async () => {
    if (!schoolId) return;
    try {
      const [cls, yrs] = await Promise.all([fetchClasses(schoolId), fetchAcademicYears(schoolId)]);
      setClasses(cls);
      setYears(yrs);
    } catch {
      // ignore
    }
  }, [schoolId]);

  useEffect(() => { void loadData(); }, [loadData]);

  const loadStudentReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await generateStudentReport(schoolId);
      setStudentReport(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate report.');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  const loadAcademicReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await generateAcademicReport(schoolId);
      setAcademicReport(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate report.');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  const loadAttendanceReport = useCallback(async () => {
    if (!attClassId) { setError('Select a class to generate the report.'); return; }
    setLoading(true);
    setError('');
    try {
      const r = await generateAttendanceReport(schoolId, attClassId, {
        startDate: attStartDate || undefined,
        endDate: attEndDate || undefined,
      });
      setAttendanceReport(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate report.');
    } finally {
      setLoading(false);
    }
  }, [schoolId, attClassId, attStartDate, attEndDate]);

  useEffect(() => { void loadStudentReport(); }, [loadStudentReport]);
  useEffect(() => { void loadAcademicReport(); }, [loadAcademicReport]);

  const handleExportStudents = () => {
    if (!studentReport) return;
    exportToCSV('student_report.csv',
      ['Metric', 'Value'],
      [
        ['Total students', studentReport.total],
        ['Male', studentReport.byGender.male],
        ['Female', studentReport.byGender.female],
        ...studentReport.byClass.map((c) => [`Class: ${c.className}`, c.count]),
        ...studentReport.byStatus.map((s) => [`Status: ${statusLabel(s.status as never)}`, s.count]),
        ...studentReport.newAdmissions.map((a) => [`New: ${a.yearName}`, a.count]),
      ],
    );
  };

  const handleExportAttendance = () => {
    if (!attendanceReport) return;
    exportToCSV('attendance_report.csv',
      ['Student', 'Present', 'Absent', 'Late', 'Excused', 'Percentage'],
      attendanceReport.byStudent.map((s) => [s.studentName, s.present, s.absent, s.late, s.excused, `${s.percentage}%`]),
    );
  };

  const handleExportAcademic = () => {
    if (!academicReport) return;
    exportToCSV('academic_report.csv',
      ['Class', 'Level', 'Capacity', 'Enrolled'],
      academicReport.classList.map((c) => [c.name, c.level, c.capacity, c.enrolled]),
    );
  };

  return (
    <div className="reports-page">
      <div className="academics-header">
        <div>
          <p className="eyebrow">Reports & Analytics</p>
          <h1>Reports</h1>
          <p className="welcome-copy">View and export school reports from live database records.</p>
        </div>
      </div>

      <div className="tab-bar">
        <button className={`tab-item ${tab === 'students' ? 'tab-active' : ''}`} onClick={() => setTab('students')}><Users size={15} /> Student Reports</button>
        <button className={`tab-item ${tab === 'attendance' ? 'tab-active' : ''}`} onClick={() => setTab('attendance')}><CalendarDays size={15} /> Attendance Reports</button>
        <button className={`tab-item ${tab === 'academic' ? 'tab-active' : ''}`} onClick={() => setTab('academic')}><BookOpen size={15} /> Academic Reports</button>
      </div>

      {error && <div className="auth-alert" style={{ marginBottom: '16px' }}>{error}</div>}

      {loading ? (
        <div className="empty-state"><div className="empty-spinner" /><p>Generating report…</p></div>
      ) : (
        <>
          {tab === 'students' && studentReport && (
            <div className="reports-grid">
              <section className="panel report-section">
                <div className="report-section-heading"><BarChart3 size={17} /><h2>Enrollment Summary</h2><button className="secondary-button" onClick={handleExportStudents}><Download size={14} /> CSV</button></div>
                <div className="report-stats">
                  <div className="report-stat"><span>Total students</span><strong>{studentReport.total}</strong></div>
                  <div className="report-stat"><span>Male</span><strong>{studentReport.byGender.male}</strong></div>
                  <div className="report-stat"><span>Female</span><strong>{studentReport.byGender.female}</strong></div>
                </div>
                <div className="report-stats">
                  {studentReport.byStatus.map((s) => (
                    <div key={s.status} className="report-stat"><span>{statusLabel(s.status as never)}</span><strong>{s.count}</strong></div>
                  ))}
                </div>
              </section>

              <section className="panel report-section">
                <div className="report-section-heading"><Users size={17} /><h2>Enrollment by Class</h2></div>
                <div className="report-bars">
                  {studentReport.byClass.map((c) => (
                    <div key={c.className} className="report-bar-row">
                      <span>{c.className}</span>
                      <div className="report-bar-track"><div className="report-bar-fill" style={{ width: `${studentReport.total > 0 ? (c.count / studentReport.total) * 100 : 0}%` }} /></div>
                      <strong>{c.count}</strong>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel report-section">
                <div className="report-section-heading"><CalendarDays size={17} /><h2>New Admissions by Year</h2></div>
                <div className="report-bars">
                  {studentReport.newAdmissions.map((a) => (
                    <div key={a.yearName} className="report-bar-row">
                      <span>{a.yearName}</span>
                      <div className="report-bar-track"><div className="report-bar-fill" style={{ width: `${studentReport.total > 0 ? (a.count / studentReport.total) * 100 : 0}%` }} /></div>
                      <strong>{a.count}</strong>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {tab === 'attendance' && (
            <div className="panel" style={{ padding: '22px' }}>
              <div className="attendance-filters" style={{ marginBottom: '16px' }}>
                <select className="filter-select" value={attClassId} onChange={(e) => setAttClassId(e.target.value)}>
                  <option value="">Select class</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input type="date" className="filter-select" value={attStartDate} onChange={(e) => setAttStartDate(e.target.value)} />
                <input type="date" className="filter-select" value={attEndDate} onChange={(e) => setAttEndDate(e.target.value)} />
                <button className="primary-button" onClick={loadAttendanceReport}>Generate</button>
              </div>

              {attendanceReport && (
                <>
                  <div className="attendance-summary-bar" style={{ marginBottom: '16px' }}>
                    <div className="attendance-stat"><span>Total</span><strong>{attendanceReport.summary.total}</strong></div>
                    <div className="attendance-stat"><span>Present</span><strong style={{ color: '#238c70' }}>{attendanceReport.summary.present}</strong></div>
                    <div className="attendance-stat"><span>Absent</span><strong style={{ color: '#dc6b5f' }}>{attendanceReport.summary.absent}</strong></div>
                    <div className="attendance-stat"><span>Late</span><strong style={{ color: '#c78118' }}>{attendanceReport.summary.late}</strong></div>
                    <div className="attendance-stat"><span>Excused</span><strong style={{ color: '#2c64ad' }}>{attendanceReport.summary.excused}</strong></div>
                    <div className="attendance-stat"><span>Rate</span><strong style={{ color: '#2864b5' }}>{attendanceReport.summary.percentage}%</strong></div>
                  </div>

                  <div className="report-section-heading" style={{ marginBottom: '12px' }}>
                    <FileText size={17} /><h2>Per-Student Summary</h2>
                    <button className="secondary-button" onClick={handleExportAttendance}><Download size={14} /> CSV</button>
                  </div>

                  <table className="student-table">
                    <thead>
                      <tr><th>Student</th><th>Present</th><th>Absent</th><th>Late</th><th>Excused</th><th>Rate</th></tr>
                    </thead>
                    <tbody>
                      {attendanceReport.byStudent.map((s) => (
                        <tr key={s.studentId}>
                          <td>{s.studentName}</td>
                          <td>{s.present}</td>
                          <td>{s.absent}</td>
                          <td>{s.late}</td>
                          <td>{s.excused}</td>
                          <td>{s.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}

          {tab === 'academic' && academicReport && (
            <div className="reports-grid">
              <section className="panel report-section">
                <div className="report-section-heading"><BookOpen size={17} /><h2>Class List</h2><button className="secondary-button" onClick={handleExportAcademic}><Download size={14} /> CSV</button></div>
                <table className="student-table">
                  <thead><tr><th>Class</th><th>Level</th><th>Capacity</th><th>Enrolled</th></tr></thead>
                  <tbody>
                    {academicReport.classList.map((c) => (
                      <tr key={c.id}><td>{c.name}</td><td>{c.level}</td><td>{c.capacity}</td><td>{c.enrolled}</td></tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="panel report-section">
                <div className="report-section-heading"><FileText size={17} /><h2>Subject Allocation</h2></div>
                <table className="student-table">
                  <thead><tr><th>Class</th><th>Subject</th><th>Code</th></tr></thead>
                  <tbody>
                    {academicReport.subjectAllocation.map((sa, i) => (
                      <tr key={i}><td>{sa.className}</td><td>{sa.subjectName}</td><td>{sa.subjectCode}</td></tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="panel report-section">
                <div className="report-section-heading"><CalendarDays size={17} /><h2>Year Enrollment</h2></div>
                <div className="report-bars">
                  {academicReport.yearEnrollment.map((ye) => (
                    <div key={ye.yearName} className="report-bar-row">
                      <span>{ye.yearName}</span>
                      <div className="report-bar-track"><div className="report-bar-fill" style={{ width: '60%' }} /></div>
                      <strong>{ye.total}</strong>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
