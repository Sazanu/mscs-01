import { useEffect, useState, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, Plus, Eye, Pencil, Archive, Users } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import {
  fetchStudents,
  updateStudentStatus,
  type StudentQueryResult,
} from '@/data/studentService';
import {
  STUDENT_STATUSES,
  statusLabel,
  initialsFromName,
  type Student,
  type SchoolClass,
} from '@/types/student';
import { fetchClasses } from '@/data/studentService';

type Props = {
  onAddStudent: () => void;
  onViewStudent: (studentId: string) => void;
  onEditStudent: (studentId: string) => void;
};

const PAGE_SIZE = 10;

export function StudentDirectory({ onAddStudent, onViewStudent, onEditStudent }: Props) {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cursor, setCursor] = useState<{ doc: StudentQueryResult['lastDoc']; page: number } | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [confirmArchive, setConfirmArchive] = useState<Student | null>(null);
  const [archiveTargetStatus, setArchiveTargetStatus] = useState<string>('inactive');

  const schoolId = profile?.schoolId ?? '';

  const loadStudents = useCallback(
    async (params: { cursor: StudentQueryResult['lastDoc']; reset: boolean }) => {
      if (!schoolId) return;
      setLoading(true);
      setError('');
      try {
        const result = await fetchStudents({
          schoolId,
          search: search || undefined,
          classFilter: classFilter || undefined,
          statusFilter: statusFilter || undefined,
          pageSize: PAGE_SIZE,
          cursor: params.cursor,
        });
        setStudents(result.students);
        setHasMore(result.hasMore);
        if (params.reset) {
          setCursor(result.lastDoc ? { doc: result.lastDoc, page: 0 } : null);
          setPage(0);
        } else {
          setCursor(result.lastDoc ? { doc: result.lastDoc, page: page } : null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load students.');
      } finally {
        setLoading(false);
      }
    },
    [schoolId, search, classFilter, statusFilter, page],
  );

  useEffect(() => {
    if (!schoolId) return;
    Promise.all([fetchClasses(schoolId)])
      .then(([cls]) => {
        setClasses(cls);
      })
      .catch(() => {});
  }, [schoolId]);

  useEffect(() => {
    loadStudents({ cursor: null, reset: true });
  }, [loadStudents]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const handleFilterChange = () => {
    setTimeout(() => loadStudents({ cursor: null, reset: true }), 0);
  };

  const handleNext = () => {
    if (cursor?.doc && hasMore) {
      setPage(page + 1);
      loadStudents({ cursor: cursor.doc, reset: false });
    }
  };

  const handlePrev = () => {
    loadStudents({ cursor: null, reset: true });
    setPage(0);
  };

  const handleArchive = async () => {
    if (!confirmArchive) return;
    try {
      await updateStudentStatus(confirmArchive.id, archiveTargetStatus);
      setConfirmArchive(null);
      loadStudents({ cursor: null, reset: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update student status.');
    }
  };

  const className = (classId: string) => classes.find((c) => c.id === classId)?.name ?? '—';

  return (
    <div className="student-directory">
      <div className="directory-header">
        <div>
          <p className="eyebrow">Student Management</p>
          <h1>Student Directory</h1>
          <p className="welcome-copy">View, search, and manage all enrolled students.</p>
        </div>
        <button className="primary-button" onClick={onAddStudent}><Plus size={17} /> Add student</button>
      </div>

      <div className="directory-filters">
        <form onSubmit={handleSearchSubmit} className="filter-search">
          <Search size={16} />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or admission number"
          />
          <button type="submit" className="secondary-button">Search</button>
        </form>
        <select
          className="filter-select"
          value={classFilter}
          onChange={(e) => { setClassFilter(e.target.value); handleFilterChange(); }}
        >
          <option value="">All classes</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); handleFilterChange(); }}
        >
          <option value="">All statuses</option>
          {STUDENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {(search || classFilter || statusFilter) && (
          <button className="secondary-button" onClick={() => { setSearch(''); setSearchInput(''); setClassFilter(''); setStatusFilter(''); setTimeout(() => loadStudents({ cursor: null, reset: true }), 0); }}>Clear filters</button>
        )}
      </div>

      {error && <div className="auth-alert" style={{ marginBottom: '16px' }}>{error}</div>}

      <div className="student-table-wrap">
        {loading && students.length === 0 ? (
          <div className="empty-state"><div className="empty-spinner" /><p>Loading students…</p></div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <Users size={36} />
            <h2>No students found</h2>
            <p>{search || classFilter || statusFilter ? 'Try adjusting your filters.' : 'Add your first student to get started.'}</p>
            {!search && !classFilter && !statusFilter && (
              <button className="primary-button" onClick={onAddStudent}><Plus size={17} /> Add student</button>
            )}
          </div>
        ) : (
          <>
            <table className="student-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Admission No.</th>
                  <th>Class</th>
                  <th>Gender</th>
                  <th>Guardian Contact</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="student-row" onClick={() => onViewStudent(student.id)}>
                    <td>
                      <div className="student-cell">
                        <div className={`student-avatar avatar-${student.gender}`}>{initialsFromName(student.fullName)}</div>
                        <div className="student-cell-copy">
                          <strong>{student.fullName}</strong>
                          <span>{student.admissionNumber}</span>
                        </div>
                      </div>
                    </td>
                    <td>{student.admissionNumber}</td>
                    <td>{className(student.classId)}</td>
                    <td>{student.gender === 'male' ? 'Male' : 'Female'}</td>
                    <td>
                      <div className="guardian-cell">
                        <strong>{student.guardian?.name ?? '—'}</strong>
                        <span>{student.guardian?.phone ?? '—'}</span>
                      </div>
                    </td>
                    <td><span className={`status-badge status-${student.status}`}>{statusLabel(student.status)}</span></td>
                    <td>{student.createdAt ? new Date(student.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td>
                      <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                        <button className="row-action" title="View profile" onClick={() => onViewStudent(student.id)}><Eye size={15} /></button>
                        <button className="row-action" title="Edit" onClick={() => onEditStudent(student.id)}><Pencil size={15} /></button>
                        <button className="row-action" title="Archive/deactivate" onClick={() => { setConfirmArchive(student); setArchiveTargetStatus(student.status === 'active' ? 'inactive' : 'active'); }}><Archive size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination">
              <span className="pagination-info">Page {page + 1}</span>
              <div className="pagination-controls">
                <button className="secondary-button" onClick={handlePrev} disabled={page === 0 || loading}><ChevronLeft size={15} /> Previous</button>
                <button className="secondary-button" onClick={handleNext} disabled={!hasMore || loading}>Next <ChevronRight size={15} /></button>
              </div>
            </div>
          </>
        )}
      </div>

      {confirmArchive && (
        <div className="modal-overlay" onClick={() => setConfirmArchive(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm status change</h2>
            <p>Change <strong>{confirmArchive.fullName}</strong> ({confirmArchive.admissionNumber}) to <strong>{statusLabel(archiveTargetStatus as Student['status'])}</strong>?</p>
            <p className="modal-note">The student record will be preserved. This only changes the status.</p>
            <div className="modal-actions">
              <select className="filter-select" value={archiveTargetStatus} onChange={(e) => setArchiveTargetStatus(e.target.value)}>
                {STUDENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <div>
                <button className="secondary-button" onClick={() => setConfirmArchive(null)}>Cancel</button>
                <button className="primary-button" onClick={handleArchive}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
