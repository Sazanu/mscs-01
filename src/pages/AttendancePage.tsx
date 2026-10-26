import { useCallback, useEffect, useState } from 'react';
import { Check, X, Clock, FileText, Save, Search, CalendarDays } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { fetchAcademicYears, fetchClasses, fetchStudentsByClassId } from '@/data/studentService';
import { fetchTerms } from '@/data/academicService';
import {
  fetchAttendanceForClassDate,
  saveAttendance,
  fetchClassAttendanceHistory,
  fetchStudentAttendance,
  computeSummary,
  type AttendanceSummary,
} from '@/data/attendanceService';
import {
  ATTENDANCE_STATUSES,
  attendanceLabel,
  initialsFromName,
  formatDate,
  type AcademicYear,
  type SchoolClass,
  type Term,
  type Student,
  type AttendanceRecord,
  type AttendanceStatus,
} from '@/types/student';

type Tab = 'daily' | 'history';

export function AttendancePage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId ?? '';
  const userId = profile?.uid ?? '';
  const [tab, setTab] = useState<Tab>('daily');

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Daily attendance state
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Map<string, AttendanceStatus>>(new Map());
  const [remarks, setRemarks] = useState<Map<string, string>>(new Map());
  const [saving, setSaving] = useState(false);
  const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([]);

  // History state
  const [histClass, setHistClass] = useState('');
  const [histStudent, setHistStudent] = useState('');
  const [histStartDate, setHistStartDate] = useState('');
  const [histEndDate, setHistEndDate] = useState('');
  const [historyRecords, setHistoryRecords] = useState<AttendanceRecord[]>([]);
  const [historyStudents, setHistoryStudents] = useState<Student[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);

  const loadData = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [years, cls] = await Promise.all([fetchAcademicYears(schoolId), fetchClasses(schoolId)]);
      setAcademicYears(years);
      setClasses(cls);
      const currentYear = years.find((y) => y.isCurrent);
      if (currentYear) {
        setSelectedYear(currentYear.id);
        const t = await fetchTerms(schoolId, currentYear.id);
        setTerms(t);
        const currentTerm = t.find((term) => term.isCurrent);
        if (currentTerm) setSelectedTerm(currentTerm.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load data.');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { void loadData(); }, [loadData]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    window.setTimeout(() => setSuccess(''), 3000);
  };

  const handleClassChange = async (classId: string) => {
    setSelectedClass(classId);
    if (!classId) { setStudents([]); return; }
    try {
      const s = await fetchStudentsByClassId(classId);
      setStudents(s);
      const existing = await fetchAttendanceForClassDate(schoolId, classId, selectedDate);
      setExistingRecords(existing);
      const map = new Map<string, AttendanceStatus>();
      const rmap = new Map<string, string>();
      for (const rec of existing) {
        map.set(rec.studentId, rec.status);
        if (rec.remarks) rmap.set(rec.studentId, rec.remarks);
      }
      for (const s2 of s) {
        if (!map.has(s2.id)) map.set(s2.id, 'present');
      }
      setAttendance(map);
      setRemarks(rmap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load students.');
    }
  };

  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    if (selectedClass) {
      const existing = await fetchAttendanceForClassDate(schoolId, selectedClass, date);
      setExistingRecords(existing);
      const map = new Map<string, AttendanceStatus>();
      const rmap = new Map<string, string>();
      for (const rec of existing) {
        map.set(rec.studentId, rec.status);
        if (rec.remarks) rmap.set(rec.studentId, rec.remarks);
      }
      for (const s of students) {
        if (!map.has(s.id)) map.set(s.id, 'present');
      }
      setAttendance(map);
      setRemarks(rmap);
    }
  };

  const handleYearChange = async (yearId: string) => {
    setSelectedYear(yearId);
    setSelectedTerm('');
    const t = await fetchTerms(schoolId, yearId);
    setTerms(t);
    const currentTerm = t.find((term) => term.isCurrent);
    if (currentTerm) setSelectedTerm(currentTerm.id);
  };

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => new Map(prev).set(studentId, status));
  };

  const handleSave = async () => {
    if (!selectedClass || !selectedYear || !selectedTerm || !selectedDate) return;
    setSaving(true);
    setError('');
    try {
      const records = students.map((s) => ({
        studentId: s.id,
        status: attendance.get(s.id) ?? 'present',
        remarks: remarks.get(s.id) || undefined,
      }));
      await saveAttendance(schoolId, records, selectedClass, selectedYear, selectedTerm, selectedDate, userId);
      showSuccess('Attendance saved successfully.');
      const existing = await fetchAttendanceForClassDate(schoolId, selectedClass, selectedDate);
      setExistingRecords(existing);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const handleSearchHistory = async () => {
    setLoadingHistory(true);
    setError('');
    try {
      let records: AttendanceRecord[];
      if (histStudent) {
        records = await fetchStudentAttendance(histStudent, {
          startDate: histStartDate || undefined,
          endDate: histEndDate || undefined,
        });
      } else if (histClass) {
        records = await fetchClassAttendanceHistory(schoolId, histClass, {
          startDate: histStartDate || undefined,
          endDate: histEndDate || undefined,
          academicYearId: selectedYear || undefined,
        });
      } else {
        setError('Select a class or student to view history.');
        setLoadingHistory(false);
        return;
      }
      setHistoryRecords(records);
      setSummary(computeSummary(records));

      if (histClass && !histStudent) {
        const s = await fetchStudentsByClassId(histClass);
        setHistoryStudents(s);
      } else {
        setHistoryStudents([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const studentName = (id: string) => {
    const s = students.find((st) => st.id === id);
    if (s) return s.fullName;
    const hs = historyStudents.find((st) => st.id === id);
    return hs?.fullName ?? 'Unknown';
  };

  if (loading) {
    return <div className="empty-state"><div className="empty-spinner" /><p>Loading attendance…</p></div>;
  }

  return (
    <div className="attendance-page">
      <div className="academics-header">
        <div>
          <p className="eyebrow">Attendance Management</p>
          <h1>Attendance</h1>
          <p className="welcome-copy">Record and review daily attendance.</p>
        </div>
      </div>

      <div className="tab-bar">
        <button className={`tab-item ${tab === 'daily' ? 'tab-active' : ''}`} onClick={() => setTab('daily')}><CalendarDays size={15} /> Daily Attendance</button>
        <button className={`tab-item ${tab === 'history' ? 'tab-active' : ''}`} onClick={() => setTab('history')}><Search size={15} /> History & Reports</button>
      </div>

      {error && <div className="auth-alert" style={{ marginBottom: '16px' }}>{error}</div>}
      {success && <div className="toast" style={{ position: 'static', marginBottom: '16px' }}><Check size={17} />{success}</div>}

      {tab === 'daily' && (
        <div className="panel" style={{ padding: '22px' }}>
          <div className="attendance-filters">
            <select className="filter-select" value={selectedYear} onChange={(e) => void handleYearChange(e.target.value)}>
              <option value="">Academic year</option>
              {academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
            <select className="filter-select" value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}>
              <option value="">Term</option>
              {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select className="filter-select" value={selectedClass} onChange={(e) => void handleClassChange(e.target.value)}>
              <option value="">Select class</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="date" className="filter-select" value={selectedDate} onChange={(e) => void handleDateChange(e.target.value)} />
          </div>

          {!selectedClass ? (
            <div className="empty-state"><CalendarDays size={36} /><h2>Select a class</h2><p>Choose a class and date to record attendance.</p></div>
          ) : students.length === 0 ? (
            <div className="empty-state"><h2>No students enrolled</h2><p>No active students in this class.</p></div>
          ) : (
            <>
              <div className="attendance-summary-bar">
                <div className="attendance-stat"><span>Total</span><strong>{students.length}</strong></div>
                <div className="attendance-stat"><span>Present</span><strong style={{ color: '#238c70' }}>{Array.from(attendance.values()).filter((s) => s === 'present').length}</strong></div>
                <div className="attendance-stat"><span>Absent</span><strong style={{ color: '#dc6b5f' }}>{Array.from(attendance.values()).filter((s) => s === 'absent').length}</strong></div>
                <div className="attendance-stat"><span>Late</span><strong style={{ color: '#c78118' }}>{Array.from(attendance.values()).filter((s) => s === 'late').length}</strong></div>
                <div className="attendance-stat"><span>Excused</span><strong style={{ color: '#2c64ad' }}>{Array.from(attendance.values()).filter((s) => s === 'excused').length}</strong></div>
              </div>

              <table className="student-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const status = attendance.get(s.id) ?? 'present';
                    return (
                      <tr key={s.id}>
                        <td>
                          <div className="student-cell">
                            <div className={`student-avatar avatar-${s.gender}`}>{initialsFromName(s.fullName)}</div>
                            <div className="student-cell-copy">
                              <strong>{s.fullName}</strong>
                              <span>{s.studentId}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="attendance-buttons">
                            {ATTENDANCE_STATUSES.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                className={`att-btn ${status === opt.value ? 'att-btn-active' : ''}`}
                                style={status === opt.value ? { background: opt.color, color: '#fff', borderColor: opt.color } : {}}
                                onClick={() => setStatus(s.id, opt.value)}
                              >
                                {opt.value === 'present' && <Check size={13} />}
                                {opt.value === 'absent' && <X size={13} />}
                                {opt.value === 'late' && <Clock size={13} />}
                                {opt.value === 'excused' && <FileText size={13} />}
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td>
                          <input
                            className="student-input"
                            style={{ padding: '7px 10px', fontSize: '11px' }}
                            value={remarks.get(s.id) ?? ''}
                            onChange={(e) => setRemarks((prev) => new Map(prev).set(s.id, e.target.value))}
                            placeholder="Optional"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="form-actions" style={{ marginTop: '16px' }}>
                <button className="primary-button" onClick={handleSave} disabled={saving || !selectedYear || !selectedTerm}>
                  <Save size={16} /> {saving ? 'Saving…' : 'Save attendance'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="panel" style={{ padding: '22px' }}>
          <div className="attendance-filters">
            <select className="filter-select" value={histClass} onChange={(e) => { setHistClass(e.target.value); setHistStudent(''); }}>
              <option value="">All classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="date" className="filter-select" value={histStartDate} onChange={(e) => setHistStartDate(e.target.value)} />
            <input type="date" className="filter-select" value={histEndDate} onChange={(e) => setHistEndDate(e.target.value)} />
            <button className="primary-button" onClick={handleSearchHistory}><Search size={15} /> Search</button>
          </div>

          {histClass && (
            <div className="form-field" style={{ marginBottom: '16px' }}>
              <select className="filter-select" value={histStudent} onChange={(e) => setHistStudent(e.target.value)}>
                <option value="">All students in class</option>
                {historyStudents.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
              </select>
            </div>
          )}

          {summary && (
            <div className="attendance-summary-bar" style={{ marginBottom: '16px' }}>
              <div className="attendance-stat"><span>Total records</span><strong>{summary.total}</strong></div>
              <div className="attendance-stat"><span>Present</span><strong style={{ color: '#238c70' }}>{summary.present}</strong></div>
              <div className="attendance-stat"><span>Absent</span><strong style={{ color: '#dc6b5f' }}>{summary.absent}</strong></div>
              <div className="attendance-stat"><span>Late</span><strong style={{ color: '#c78118' }}>{summary.late}</strong></div>
              <div className="attendance-stat"><span>Excused</span><strong style={{ color: '#2c64ad' }}>{summary.excused}</strong></div>
              <div className="attendance-stat"><span>Rate</span><strong style={{ color: '#2864b5' }}>{summary.percentage}%</strong></div>
            </div>
          )}

          {loadingHistory ? (
            <div className="empty-state"><div className="empty-spinner" /><p>Loading history…</p></div>
          ) : historyRecords.length === 0 ? (
            <div className="empty-state"><h2>No records found</h2><p>Select filters and search to view attendance history.</p></div>
          ) : (
            <table className="student-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th>Marked by</th>
                </tr>
              </thead>
              <tbody>
                {historyRecords.map((rec) => (
                  <tr key={rec.id}>
                    <td>{formatDate(rec.date)}</td>
                    <td>{studentName(rec.studentId)}</td>
                    <td><span className={`status-badge status-${rec.status}`}>{attendanceLabel(rec.status)}</span></td>
                    <td>{rec.remarks || '—'}</td>
                    <td>{rec.modifiedBy ? `${rec.modifiedBy.slice(0, 8)}… (modified)` : `${rec.markedBy.slice(0, 8)}…`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
