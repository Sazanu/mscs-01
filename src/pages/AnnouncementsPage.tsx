import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Megaphone, Plus, Trash2, Pin, AlertTriangle, Bell } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import {
  fetchAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  type Announcement,
} from '@/data/announcementService';

const AUDIENCE_LABELS: Record<Announcement['audience'], string> = {
  all: 'Everyone',
  staff: 'Staff only',
  parents: 'Parents only',
  students: 'Students only',
};

const PRIORITY_STYLES: Record<Announcement['priority'], { color: string; bg: string; icon: typeof Pin }> = {
  normal: { color: '#405067', bg: '#eef2f8', icon: Bell },
  important: { color: '#c78118', bg: '#fff1d6', icon: Pin },
  urgent: { color: '#b65752', bg: '#fff4f3', icon: AlertTriangle },
};

function formatDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function AnnouncementsPage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId ?? '';
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superAdmin';

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Announcement | null>(null);

  const [form, setForm] = useState({
    title: '',
    body: '',
    audience: 'all' as Announcement['audience'],
    priority: 'normal' as Announcement['priority'],
  });

  const loadData = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError('');
    try {
      const items = await fetchAnnouncements(schoolId);
      setAnnouncements(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load announcements.');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { void loadData(); }, [loadData]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    window.setTimeout(() => setSuccess(''), 3000);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim() || !profile) return;
    try {
      await createAnnouncement(schoolId, {
        title: form.title,
        body: form.body,
        audience: form.audience,
        priority: form.priority,
        postedBy: profile.uid,
        postedByName: profile.displayName,
      });
      setForm({ title: '', body: '', audience: 'all', priority: 'normal' });
      setShowForm(false);
      showSuccess('Announcement posted.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to post announcement.');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteAnnouncement(confirmDelete.id);
      setConfirmDelete(null);
      showSuccess('Announcement deleted.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete.');
    }
  };

  return (
    <div className="academics-page">
      <div className="academics-header">
        <div>
          <p className="eyebrow">School Communications</p>
          <h1>Notice Board</h1>
          <p className="welcome-copy">School-wide announcements and important notices.</p>
        </div>
        {isAdmin && (
          <button className="primary-button" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> {showForm ? 'Cancel' : 'New announcement'}
          </button>
        )}
      </div>

      {error && <div className="auth-alert" style={{ marginBottom: '16px' }}>{error}</div>}
      {success && <div className="toast" style={{ position: 'static', marginBottom: '16px' }}>{success}</div>}

      {showForm && isAdmin && (
        <section className="panel academics-section" style={{ maxWidth: '680px', margin: '0 auto 24px' }}>
          <div className="academics-section-heading"><Megaphone size={18} /><h2>Post Announcement</h2></div>
          <form onSubmit={handleCreate} className="academics-form">
            <div className="form-field">
              <label htmlFor="annTitle">Title <span className="req">*</span></label>
              <input id="annTitle" className="student-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="PTA Meeting on Friday" />
            </div>
            <div className="form-field">
              <label htmlFor="annBody">Message <span className="req">*</span></label>
              <textarea id="annBody" className="student-input" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Write your announcement here..." style={{ resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <div className="form-grid-2">
              <div className="form-field">
                <label htmlFor="annAudience">Audience</label>
                <select id="annAudience" className="student-input" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as Announcement['audience'] })}>
                  <option value="all">Everyone</option>
                  <option value="staff">Staff only</option>
                  <option value="parents">Parents only</option>
                  <option value="students">Students only</option>
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="annPriority">Priority</label>
                <select id="annPriority" className="student-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Announcement['priority'] })}>
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <button type="submit" className="primary-button"><Megaphone size={16} /> Post announcement</button>
          </form>
        </section>
      )}

      {loading ? (
        <div className="empty-state"><div className="empty-spinner" /><p>Loading announcements…</p></div>
      ) : announcements.length === 0 ? (
        <div className="empty-state"><Megaphone size={32} /><h2>No announcements yet</h2><p>{isAdmin ? 'Post your first announcement to keep the school informed.' : 'Check back later for school updates.'}</p></div>
      ) : (
        <div className="announcement-list">
          {announcements.map((ann) => {
            const ps = PRIORITY_STYLES[ann.priority];
            const PriorityIcon = ps.icon;
            return (
              <article key={ann.id} className="announcement-card">
                <div className="announcement-header">
                  <div className="announcement-priority" style={{ color: ps.color, background: ps.bg }}>
                    <PriorityIcon size={14} />
                  </div>
                  <div className="announcement-copy">
                    <h3>{ann.title}</h3>
                    <span>Posted by {ann.postedByName} · {formatDate(ann.createdAt)} · {AUDIENCE_LABELS[ann.audience]}</span>
                  </div>
                  {isAdmin && (
                    <button className="row-action" title="Delete" onClick={() => setConfirmDelete(ann)}><Trash2 size={15} /></button>
                  )}
                </div>
                <p className="announcement-body">{ann.body}</p>
              </article>
            );
          })}
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Delete announcement?</h2>
            <p>"{confirmDelete.title}" will be permanently removed from the notice board.</p>
            <div className="modal-actions"><div /><div><button className="secondary-button" onClick={() => setConfirmDelete(null)}>Cancel</button><button className="primary-button" onClick={handleDelete} style={{ background: '#dc6b5f' }}>Delete</button></div></div>
          </div>
        </div>
      )}
    </div>
  );
}
