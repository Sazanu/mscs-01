import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CalendarDays, BookOpen, Plus, Trash2, AlertCircle, Check, Layers, Link2 } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import {
  fetchAcademicYears,
  fetchClasses,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  createClass,
  updateClass,
  deleteClass,
} from '@/data/studentService';
import {
  fetchTerms,
  createTerm,
  updateTerm,
  deleteTerm,
  setCurrentTerm,
  fetchSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  fetchClassSubjects,
  assignSubjectToClass,
  removeClassSubject,
} from '@/data/academicService';
import {
  CLASS_LEVELS,
  type AcademicYear,
  type SchoolClass,
  type Term,
  type Subject,
  type ClassSubject,
} from '@/types/student';

type Tab = 'years' | 'classes' | 'subjects' | 'assignments';

type YearForm = { name: string; startDate: string; endDate: string; isCurrent: boolean };
type TermForm = { academicYearId: string; name: string; startDate: string; endDate: string; isCurrent: boolean };
type ClassForm = { name: string; level: string; academicYearId: string; capacity: number };
type SubjectForm = { code: string; name: string; applicableLevels: string[] };
type AssignForm = { classId: string; subjectId: string; academicYearId: string };

const emptyYearForm: YearForm = { name: '', startDate: '', endDate: '', isCurrent: false };
const emptyTermForm: TermForm = { academicYearId: '', name: '', startDate: '', endDate: '', isCurrent: false };
const emptyClassForm: ClassForm = { name: '', level: '', academicYearId: '', capacity: 30 };
const emptySubjectForm: SubjectForm = { code: '', name: '', applicableLevels: [] };
const emptyAssignForm: AssignForm = { classId: '', subjectId: '', academicYearId: '' };

export function AcademicsPage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId ?? '';
  const [tab, setTab] = useState<Tab>('years');

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [yearForm, setYearForm] = useState<YearForm>(emptyYearForm);
  const [termForm, setTermForm] = useState<TermForm>(emptyTermForm);
  const [classForm, setClassForm] = useState<ClassForm>(emptyClassForm);
  const [subjectForm, setSubjectForm] = useState<SubjectForm>(emptySubjectForm);
  const [assignForm, setAssignForm] = useState<AssignForm>(emptyAssignForm);

  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string; name: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError('');
    try {
      const [years, cls] = await Promise.all([fetchAcademicYears(schoolId), fetchClasses(schoolId)]);
      setAcademicYears(years);
      setClasses(cls);
      const currentYear = years.find((y) => y.isCurrent);
      const defaultYear = currentYear?.id ?? years[0]?.id ?? '';
      setClassForm((prev) => ({ ...prev, academicYearId: prev.academicYearId || defaultYear }));
      setTermForm((prev) => ({ ...prev, academicYearId: prev.academicYearId || defaultYear }));
      setAssignForm((prev) => ({ ...prev, academicYearId: prev.academicYearId || defaultYear }));

      if (defaultYear) {
        const [t, s, cs] = await Promise.all([
          fetchTerms(schoolId, defaultYear),
          fetchSubjects(schoolId),
          fetchClassSubjects(schoolId),
        ]);
        setTerms(t);
        setSubjects(s);
        setClassSubjects(cs);
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

  const reloadTerms = async (yearId: string) => {
    const t = await fetchTerms(schoolId, yearId);
    setTerms(t);
  };

  const reloadSubjects = async () => {
    const [s, cs] = await Promise.all([fetchSubjects(schoolId), fetchClassSubjects(schoolId)]);
    setSubjects(s);
    setClassSubjects(cs);
  };

  const handleCreateYear = async (e: FormEvent) => {
    e.preventDefault();
    if (!yearForm.name.trim()) return;
    try {
      await createAcademicYear(schoolId, yearForm);
      setYearForm(emptyYearForm);
      showSuccess('Academic year created.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create academic year.');
    }
  };

  const handleActivateYear = async (yearId: string) => {
    try {
      await updateAcademicYear(yearId, { isCurrent: true, status: 'active' });
      showSuccess('Academic year activated.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to activate year.');
    }
  };

  const handleCloseYear = async (yearId: string) => {
    try {
      await updateAcademicYear(yearId, { status: 'closed', isCurrent: false });
      showSuccess('Academic year closed.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to close year.');
    }
  };

  const handleCreateTerm = async (e: FormEvent) => {
    e.preventDefault();
    if (!termForm.name.trim() || !termForm.academicYearId) return;
    try {
      await createTerm(schoolId, termForm);
      setTermForm({ ...emptyTermForm, academicYearId: termForm.academicYearId });
      showSuccess('Term created.');
      await reloadTerms(termForm.academicYearId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create term.');
    }
  };

  const handleSetCurrentTerm = async (termId: string) => {
    try {
      await setCurrentTerm(schoolId, termId);
      showSuccess('Current term set.');
      if (termForm.academicYearId) await reloadTerms(termForm.academicYearId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to set current term.');
    }
  };

  const handleCreateClass = async (e: FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim() || !classForm.level || !classForm.academicYearId) return;
    try {
      await createClass(schoolId, classForm);
      setClassForm({ ...emptyClassForm, academicYearId: classForm.academicYearId });
      showSuccess('Class created.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create class.');
    }
  };

  const handleCreateSubject = async (e: FormEvent) => {
    e.preventDefault();
    if (!subjectForm.code.trim() || !subjectForm.name.trim()) return;
    try {
      await createSubject(schoolId, subjectForm);
      setSubjectForm(emptySubjectForm);
      showSuccess('Subject created.');
      await reloadSubjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create subject.');
    }
  };

  const handleToggleLevel = (level: string) => {
    setSubjectForm((prev) => ({
      ...prev,
      applicableLevels: prev.applicableLevels.includes(level)
        ? prev.applicableLevels.filter((l) => l !== level)
        : [...prev.applicableLevels, level],
    }));
  };

  const handleAssignSubject = async (e: FormEvent) => {
    e.preventDefault();
    if (!assignForm.classId || !assignForm.subjectId || !assignForm.academicYearId) return;
    try {
      await assignSubjectToClass(schoolId, assignForm);
      setAssignForm({ ...emptyAssignForm, academicYearId: assignForm.academicYearId });
      showSuccess('Subject assigned to class.');
      await reloadSubjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to assign subject.');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      switch (confirmDelete.type) {
        case 'year': await deleteAcademicYear(confirmDelete.id); break;
        case 'term': await deleteTerm(confirmDelete.id); break;
        case 'class': await deleteClass(confirmDelete.id); break;
        case 'subject': await deleteSubject(confirmDelete.id); break;
        case 'assignment': await removeClassSubject(confirmDelete.id); break;
      }
      setConfirmDelete(null);
      showSuccess('Deleted successfully.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete.');
    }
  };

  const yearName = (id: string) => academicYears.find((y) => y.id === id)?.name ?? '—';
  const className = (id: string) => classes.find((c) => c.id === id)?.name ?? '—';
  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? '—';
  const subjectCode = (id: string) => subjects.find((s) => s.id === id)?.code ?? '—';

  const filteredClasses = assignForm.academicYearId
    ? classes.filter((c) => c.academicYearId === assignForm.academicYearId)
    : classes;

  return (
    <div className="academics-page">
      <div className="academics-header">
        <div>
          <p className="eyebrow">Academic Management</p>
          <h1>Academics</h1>
          <p className="welcome-copy">Manage academic years, terms, classes, subjects, and assignments.</p>
        </div>
      </div>

      <div className="tab-bar">
        <button className={`tab-item ${tab === 'years' ? 'tab-active' : ''}`} onClick={() => setTab('years')}><CalendarDays size={15} /> Years & Terms</button>
        <button className={`tab-item ${tab === 'classes' ? 'tab-active' : ''}`} onClick={() => setTab('classes')}><BookOpen size={15} /> Classes</button>
        <button className={`tab-item ${tab === 'subjects' ? 'tab-active' : ''}`} onClick={() => setTab('subjects')}><Layers size={15} /> Subjects</button>
        <button className={`tab-item ${tab === 'assignments' ? 'tab-active' : ''}`} onClick={() => setTab('assignments')}><Link2 size={15} /> Assignments</button>
      </div>

      {error && <div className="auth-alert" style={{ marginBottom: '16px' }}>{error}</div>}
      {success && <div className="toast" style={{ position: 'static', marginBottom: '16px' }}><Check size={17} />{success}</div>}

      {loading ? (
        <div className="empty-state"><div className="empty-spinner" /><p>Loading academic data…</p></div>
      ) : (
        <>
          {tab === 'years' && (
            <div className="academics-grid">
              <section className="panel academics-section">
                <div className="academics-section-heading"><CalendarDays size={18} /><h2>Academic Years</h2></div>
                <form onSubmit={handleCreateYear} className="academics-form">
                  <div className="form-field">
                    <label htmlFor="yearName">Year name <span className="req">*</span></label>
                    <input id="yearName" className="student-input" value={yearForm.name} onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })} placeholder="2026/2027" />
                  </div>
                  <div className="form-grid-2">
                    <div className="form-field">
                      <label htmlFor="yearStart">Start date <span className="req">*</span></label>
                      <input id="yearStart" type="date" className="student-input" value={yearForm.startDate} onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })} />
                    </div>
                    <div className="form-field">
                      <label htmlFor="yearEnd">End date <span className="req">*</span></label>
                      <input id="yearEnd" type="date" className="student-input" value={yearForm.endDate} onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })} />
                    </div>
                  </div>
                  <label className="checkbox-field">
                    <input type="checkbox" checked={yearForm.isCurrent} onChange={(e) => setYearForm({ ...yearForm, isCurrent: e.target.checked })} />
                    <span>Set as current academic year</span>
                  </label>
                  <button type="submit" className="primary-button"><Plus size={16} /> Add academic year</button>
                </form>
                <div className="academics-list">
                  {academicYears.length === 0 ? (
                    <p className="academics-empty">No academic years yet.</p>
                  ) : academicYears.map((year) => (
                    <div key={year.id} className="academics-item">
                      <div className="academics-item-copy">
                        <strong>{year.name} {year.isCurrent && <em className="current-badge">Current</em>}</strong>
                        <span>{year.startDate || '—'} → {year.endDate || '—'} · {year.status}</span>
                      </div>
                      <div className="row-actions">
                        {!year.isCurrent && year.status === 'active' && <button className="row-action" title="Activate" onClick={() => handleActivateYear(year.id)}><Check size={15} /></button>}
                        {year.status === 'active' && <button className="row-action" title="Close year" onClick={() => handleCloseYear(year.id)}><AlertCircle size={15} /></button>}
                        <button className="row-action" title="Delete" onClick={() => setConfirmDelete({ type: 'year', id: year.id, name: year.name })}><Trash2 size={15} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel academics-section">
                <div className="academics-section-heading"><CalendarDays size={18} /><h2>Terms</h2></div>
                <form onSubmit={handleCreateTerm} className="academics-form">
                  <div className="form-field">
                    <label htmlFor="termYear">Academic year <span className="req">*</span></label>
                    <select id="termYear" className="student-input" value={termForm.academicYearId} onChange={(e) => { setTermForm({ ...termForm, academicYearId: e.target.value }); void reloadTerms(e.target.value); }}>
                      <option value="">Select year</option>
                      {academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="termName">Term name <span className="req">*</span></label>
                    <input id="termName" className="student-input" value={termForm.name} onChange={(e) => setTermForm({ ...termForm, name: e.target.value })} placeholder="Term 1" />
                  </div>
                  <div className="form-grid-2">
                    <div className="form-field">
                      <label htmlFor="termStart">Start date <span className="req">*</span></label>
                      <input id="termStart" type="date" className="student-input" value={termForm.startDate} onChange={(e) => setTermForm({ ...termForm, startDate: e.target.value })} />
                    </div>
                    <div className="form-field">
                      <label htmlFor="termEnd">End date <span className="req">*</span></label>
                      <input id="termEnd" type="date" className="student-input" value={termForm.endDate} onChange={(e) => setTermForm({ ...termForm, endDate: e.target.value })} />
                    </div>
                  </div>
                  <label className="checkbox-field">
                    <input type="checkbox" checked={termForm.isCurrent} onChange={(e) => setTermForm({ ...termForm, isCurrent: e.target.checked })} />
                    <span>Set as current term</span>
                  </label>
                  <button type="submit" className="primary-button" disabled={!termForm.academicYearId}><Plus size={16} /> Add term</button>
                </form>
                <div className="academics-list">
                  {terms.length === 0 ? (
                    <p className="academics-empty">No terms yet. Select an academic year and create terms.</p>
                  ) : terms.map((term) => (
                    <div key={term.id} className="academics-item">
                      <div className="academics-item-copy">
                        <strong>{term.name} {term.isCurrent && <em className="current-badge">Current</em>}</strong>
                        <span>{term.startDate || '—'} → {term.endDate || '—'} · {term.status}</span>
                      </div>
                      <div className="row-actions">
                        {!term.isCurrent && term.status === 'active' && <button className="row-action" title="Set as current" onClick={() => handleSetCurrentTerm(term.id)}><Check size={15} /></button>}
                        <button className="row-action" title="Delete" onClick={() => setConfirmDelete({ type: 'term', id: term.id, name: term.name })}><Trash2 size={15} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {tab === 'classes' && (
            <section className="panel academics-section" style={{ maxWidth: '640px', margin: '0 auto' }}>
              <div className="academics-section-heading"><BookOpen size={18} /><h2>Classes</h2></div>
              <form onSubmit={handleCreateClass} className="academics-form">
                <div className="form-grid-2">
                  <div className="form-field">
                    <label htmlFor="className2">Class name <span className="req">*</span></label>
                    <input id="className2" className="student-input" value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} placeholder="Primary 4A" />
                  </div>
                  <div className="form-field">
                    <label htmlFor="classLevel2">Level <span className="req">*</span></label>
                    <select id="classLevel2" className="student-input" value={classForm.level} onChange={(e) => setClassForm({ ...classForm, level: e.target.value })}>
                      <option value="">Select level</option>
                      {CLASS_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-grid-2">
                  <div className="form-field">
                    <label htmlFor="classYear2">Academic year <span className="req">*</span></label>
                    <select id="classYear2" className="student-input" value={classForm.academicYearId} onChange={(e) => setClassForm({ ...classForm, academicYearId: e.target.value })}>
                      <option value="">Select year</option>
                      {academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}{y.isCurrent ? ' (Current)' : ''}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="classCapacity2">Capacity</label>
                    <input id="classCapacity2" type="number" min={1} className="student-input" value={classForm.capacity} onChange={(e) => setClassForm({ ...classForm, capacity: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <button type="submit" className="primary-button" disabled={academicYears.length === 0}><Plus size={16} /> Add class</button>
                {academicYears.length === 0 && <p className="form-meta">Create an academic year first.</p>}
              </form>
              <div className="academics-list">
                {classes.length === 0 ? (
                  <p className="academics-empty">No classes yet.</p>
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
          )}

          {tab === 'subjects' && (
            <section className="panel academics-section" style={{ maxWidth: '640px', margin: '0 auto' }}>
              <div className="academics-section-heading"><Layers size={18} /><h2>Subjects</h2></div>
              <form onSubmit={handleCreateSubject} className="academics-form">
                <div className="form-grid-2">
                  <div className="form-field">
                    <label htmlFor="subjectCode">Subject code <span className="req">*</span></label>
                    <input id="subjectCode" className="student-input" value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} placeholder="MATH" />
                  </div>
                  <div className="form-field">
                    <label htmlFor="subjectName">Subject name <span className="req">*</span></label>
                    <input id="subjectName" className="student-input" value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} placeholder="Mathematics" />
                  </div>
                </div>
                <div className="form-field">
                  <label>Applicable class levels</label>
                  <div className="level-chips">
                    {CLASS_LEVELS.map((level) => (
                      <button key={level} type="button" className={`level-chip ${subjectForm.applicableLevels.includes(level) ? 'level-chip-active' : ''}`} onClick={() => handleToggleLevel(level)}>{level}</button>
                    ))}
                  </div>
                </div>
                <button type="submit" className="primary-button"><Plus size={16} /> Add subject</button>
              </form>
              <div className="academics-list">
                {subjects.length === 0 ? (
                  <p className="academics-empty">No subjects yet.</p>
                ) : subjects.map((subj) => (
                  <div key={subj.id} className="academics-item">
                    <div className="academics-item-copy">
                      <strong>{subj.code} — {subj.name}</strong>
                      <span>{subj.applicableLevels.length} level(s) · {subj.status}</span>
                    </div>
                    <button className="row-action" title="Delete" onClick={() => setConfirmDelete({ type: 'subject', id: subj.id, name: subj.name })}><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === 'assignments' && (
            <section className="panel academics-section" style={{ maxWidth: '640px', margin: '0 auto' }}>
              <div className="academics-section-heading"><Link2 size={18} /><h2>Subject Assignments</h2></div>
              <form onSubmit={handleAssignSubject} className="academics-form">
                <div className="form-field">
                  <label htmlFor="assignYear">Academic year <span className="req">*</span></label>
                  <select id="assignYear" className="student-input" value={assignForm.academicYearId} onChange={(e) => setAssignForm({ ...assignForm, academicYearId: e.target.value, classId: '' })}>
                    <option value="">Select year</option>
                    {academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
                  </select>
                </div>
                <div className="form-grid-2">
                  <div className="form-field">
                    <label htmlFor="assignClass">Class <span className="req">*</span></label>
                    <select id="assignClass" className="student-input" value={assignForm.classId} onChange={(e) => setAssignForm({ ...assignForm, classId: e.target.value })}>
                      <option value="">Select class</option>
                      {filteredClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="assignSubject">Subject <span className="req">*</span></label>
                    <select id="assignSubject" className="student-input" value={assignForm.subjectId} onChange={(e) => setAssignForm({ ...assignForm, subjectId: e.target.value })}>
                      <option value="">Select subject</option>
                      {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className="primary-button" disabled={!assignForm.classId || !assignForm.subjectId}><Plus size={16} /> Assign subject</button>
              </form>
              <div className="academics-list">
                {classSubjects.length === 0 ? (
                  <p className="academics-empty">No subject assignments yet.</p>
                ) : classSubjects
                    .filter((cs) => !assignForm.academicYearId || cs.academicYearId === assignForm.academicYearId)
                    .map((cs) => (
                      <div key={cs.id} className="academics-item">
                        <div className="academics-item-copy">
                          <strong>{className(cs.classId)} → {subjectName(cs.subjectId)}</strong>
                          <span>{subjectCode(cs.subjectId)} · {yearName(cs.academicYearId)}</span>
                        </div>
                        <button className="row-action" title="Remove" onClick={() => setConfirmDelete({ type: 'assignment', id: cs.id, name: `${className(cs.classId)} — ${subjectName(cs.subjectId)}` })}><Trash2 size={15} /></button>
                      </div>
                    ))}
              </div>
            </section>
          )}
        </>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm deletion</h2>
            <p>Delete <strong>{confirmDelete.name}</strong>? This cannot be undone.</p>
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
