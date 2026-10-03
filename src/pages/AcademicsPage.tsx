import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CalendarDays, BookOpen, Plus, Trash2, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import {
  fetchAcademicYears,
  fetchClasses,
  createAcademicYear,
  createClass,
  deleteAcademicYear,
  deleteClass,
} from '@/data/studentService';
import type { AcademicYear, SchoolClass } from '@/types/student';

const CLASS_LEVELS = ['Creche', 'Nursery', 'KG 1', 'KG 2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'JHS 1', 'JHS 2', 'JHS 3'];

type YearForm = { name: string; startDate: string; endDate: string; isCurrent: boolean };
type ClassForm = { name: string; level: string; academicYearId: string; capacity: number };

const emptyYearForm: YearForm = { name: '', startDate: '', endDate: '', isCurrent: false };
const emptyClassForm: ClassForm = { name: '', level: '', academicYearId: '', capacity: 30 };

export function AcademicsPage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId ?? '';

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [yearForm, setYearForm] = useState<YearForm>(emptyYearForm);
  const [yearFormError, setYearFormError] = useState('');
  const [classForm, setClassForm] = useState<ClassForm>(emptyClassForm);
  const [classFormError, setClassFormError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'year' | 'class'; id: string; name: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError('');
    try {
      const [years, cls] = await Promise.all([fetchAcademicYears(schoolId), fetchClasses(schoolId)]);
      setAcademicYears(years);
      setClasses(cls);
      if (years.length > 0) {
        const current = years.find((y) => y.isCurrent);
        setClassForm((prev) => ({ ...prev, academicYearId: prev.academicYearId || current?.id || years[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load academic data.');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { void loadData(); }, [loadData]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    window.setTimeout(() => setSuccess(''), 3000);
  };

  const handleCreateYear = async (e: FormEvent) => {
    e.preventDefault();
    setYearFormError('');
    if (!yearForm.name.trim()) { setYearFormError('Year name is required.'); return; }
    if (!yearForm.startDate || !yearForm.endDate) { setYearFormError('Start and end dates are required.'); return; }
    try {
      await createAcademicYear(schoolId, yearForm);
      setYearForm(emptyYearForm);
      showSuccess('Academic year created.');
      await loadData();
    } catch (err) {
      setYearFormError(err instanceof Error ? err.message : 'Unable to create academic year.');
    }
  };

  const handleCreateClass = async (e: FormEvent) => {
    e.preventDefault();
    setClassFormError('');
    if (!classForm.name.trim()) { setClassFormError('Class name is required.'); return; }
    if (!classForm.level) { setClassFormError('Class level is required.'); return; }
    if (!classForm.academicYearId) { setClassFormError('Academic year is required.'); return; }
    try {
      await createClass(schoolId, classForm);
      setClassForm({ ...emptyClassForm, academicYearId: classForm.academicYearId });
      showSuccess('Class created.');
      await loadData();
    } catch (err) {
      setClassFormError(err instanceof Error ? err.message : 'Unable to create class.');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      if (confirmDelete.type === 'year') await deleteAcademicYear(confirmDelete.id);
      else await deleteClass(confirmDelete.id);
      setConfirmDelete(null);
      showSuccess(confirmDelete.type === 'year' ? 'Academic year deleted.' : 'Class deleted.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete.');
    }
  };

  const yearName = (id: string) => academicYears.find((y) => y.id === id)?.name ?? '—';

  return (
    <div className="academics-page">
      <div className="academics-header">
        <div>
          <p className="eyebrow">Academic Setup</p>
          <h1>Academic Years & Classes</h1>
          <p className="welcome-copy">Create academic years and classes before registering students.</p>
        </div>
      </div>

      {error && <div className="auth-alert" style={{ marginBottom: '16px' }}>{error}</div>}
      {success && <div className="toast" style={{ position: 'static', marginBottom: '16px' }}><Check size={17} />{success}</div>}

      {loading ? (
        <div className="empty-state"><div className="empty-spinner" /><p>Loading academic data…</p></div>
      ) : (
        <div className="academics-grid">
          {/* Academic Years */}
          <section className="panel academics-section">
            <div className="academics-section-heading">
              <CalendarDays size={18} />
              <h2>Academic Years</h2>
            </div>

            <form onSubmit={handleCreateYear} className="academics-form">
              <div className="form-field">
                <label htmlFor="yearName">Year name <span className="req">*</span></label>
                <input id="yearName" className="student-input" value={yearForm.name}
                  onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
                  placeholder="2026/2027" />
              </div>
              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="yearStart">Start date <span className="req">*</span></label>
                  <input id="yearStart" type="date" className="student-input" value={yearForm.startDate}
                    onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })} />
                </div>
                <div className="form-field">
                  <label htmlFor="yearEnd">End date <span className="req">*</span></label>
                  <input id="yearEnd" type="date" className="student-input" value={yearForm.endDate}
                    onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })} />
                </div>
              </div>
              <label className="checkbox-field">
                <input type="checkbox" checked={yearForm.isCurrent}
                  onChange={(e) => setYearForm({ ...yearForm, isCurrent: e.target.checked })} />
                <span>Set as current academic year</span>
              </label>
              {yearFormError && <div className="field-error"><AlertCircle size={12} /> {yearFormError}</div>}
              <button type="submit" className="primary-button"><Plus size={16} /> Add academic year</button>
            </form>

            <div className="academics-list">
              {academicYears.length === 0 ? (
                <p className="academics-empty">No academic years yet. Create one above to get started.</p>
              ) : academicYears.map((year) => (
                <div key={year.id} className="academics-item">
                  <div className="academics-item-copy">
                    <strong>{year.name}</strong>
                    <span>{year.startDate ? new Date(year.startDate).toLocaleDateString('en-GB') : '—'} — {year.endDate ? new Date(year.endDate).toLocaleDateString('en-GB') : '—'}</span>
                    {year.isCurrent && <em className="current-badge">Current</em>}
                  </div>
                  <button className="row-action" title="Delete" onClick={() => setConfirmDelete({ type: 'year', id: year.id, name: year.name })}><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          </section>

          {/* Classes */}
          <section className="panel academics-section">
            <div className="academics-section-heading">
              <BookOpen size={18} />
              <h2>Classes</h2>
            </div>

            <form onSubmit={handleCreateClass} className="academics-form">
              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="className">Class name <span className="req">*</span></label>
                  <input id="className" className="student-input" value={classForm.name}
                    onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                    placeholder="Primary 4A" />
                </div>
                <div className="form-field">
                  <label htmlFor="classLevel">Level <span className="req">*</span></label>
                  <select id="classLevel" className="student-input" value={classForm.level}
                    onChange={(e) => setClassForm({ ...classForm, level: e.target.value })}>
                    <option value="">Select level</option>
                    {CLASS_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="classYear">Academic year <span className="req">*</span></label>
                  <select id="classYear" className="student-input" value={classForm.academicYearId}
                    onChange={(e) => setClassForm({ ...classForm, academicYearId: e.target.value })}>
                    <option value="">Select year</option>
                    {academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}{y.isCurrent ? ' (Current)' : ''}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="classCapacity">Capacity</label>
                  <input id="classCapacity" type="number" min={1} className="student-input" value={classForm.capacity}
                    onChange={(e) => setClassForm({ ...classForm, capacity: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              {classFormError && <div className="field-error"><AlertCircle size={12} /> {classFormError}</div>}
              <button type="submit" className="primary-button" disabled={academicYears.length === 0}><Plus size={16} /> Add class</button>
              {academicYears.length === 0 && <p className="form-meta">Create an academic year first.</p>}
            </form>

            <div className="academics-list">
              {classes.length === 0 ? (
                <p className="academics-empty">No classes yet. Create one above to get started.</p>
              ) : classes.map((cls) => (
                <div key={cls.id} className="academics-item">
                  <div className="academics-item-copy">
                    <strong>{cls.name}</strong>
                    <span>{cls.level} · {yearName(cls.academicYearId)} · Cap: {cls.capacity}</span>
                  </div>
                  <button className="row-action" title="Delete" onClick={() => setConfirmDelete({ type: 'class', id: cls.id, name: cls.name })}><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm deletion</h2>
            <p>Delete <strong>{confirmDelete.name}</strong>? This cannot be undone.</p>
            <p className="modal-note">If students are assigned to this {confirmDelete.type === 'year' ? 'academic year' : 'class'}, they will keep their records but the reference will show as unassigned.</p>
            <div className="modal-actions">
              <div />
              <div>
                <button className="secondary-button" onClick={() => setConfirmDelete(null)}>Cancel</button>
                <button className="primary-button" onClick={handleDelete} style={{ background: '#dc6b5f' }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
