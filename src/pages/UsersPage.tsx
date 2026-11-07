import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { collection, getDocs, query, where, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Plus, UserRound, ShieldCheck, Trash2, Check } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { firestore } from '@/lib/firebase';
import type { UserRole } from '@/auth/AuthContext';

type UserRecord = {
  id: string;
  uid: string;
  schoolId: string;
  email: string;
  displayName: string;
  role: UserRole;
  active: boolean;
};

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'superAdmin', label: 'Super Admin' },
  { value: 'admin', label: 'Administrator' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'parent', label: 'Parent' },
  { value: 'student', label: 'Student' },
];

function roleLabel(role: string): string {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

export function UsersPage() {
  const { school } = useAuth();
  const schoolId = school?.id ?? '';
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState({
    email: '',
    displayName: '',
    role: 'teacher' as UserRole,
  });

  const loadData = useCallback(async () => {
    if (!firestore || !schoolId) return;
    setLoading(true);
    setError('');
    try {
      const q = query(collection(firestore, 'users'), where('schoolId', '==', schoolId));
      const snap = await getDocs(q);
      setUsers(snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          uid: data.uid ?? d.id,
          schoolId: data.schoolId ?? '',
          email: data.email ?? '',
          displayName: data.displayName ?? '',
          role: (data.role as UserRole) ?? 'teacher',
          active: data.active ?? true,
        };
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { void loadData(); }, [loadData]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    window.setTimeout(() => setSuccess(''), 3000);
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!firestore || !form.email.trim() || !form.displayName.trim()) return;
    try {
      await addDoc(collection(firestore, 'users'), {
        uid: '',
        schoolId,
        email: form.email.trim(),
        displayName: form.displayName.trim(),
        role: form.role,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setForm({ email: '', displayName: '', role: 'teacher' });
      setShowAdd(false);
      showSuccess('User added. They will need a Firebase Auth account with the same email to sign in.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add user.');
    }
  };

  const handleToggleActive = async (user: UserRecord) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'users', user.id), {
        active: !user.active,
        updatedAt: serverTimestamp(),
      });
      showSuccess(user.active ? 'User deactivated.' : 'User activated.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update user.');
    }
  };

  const handleChangeRole = async (user: UserRecord, newRole: UserRole) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'users', user.id), {
        role: newRole,
        updatedAt: serverTimestamp(),
      });
      showSuccess('Role updated.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update role.');
    }
  };

  return (
    <div className="academics-page">
      <div className="academics-header">
        <div>
          <p className="eyebrow">Access Management</p>
          <h1>Users &amp; Roles</h1>
          <p className="welcome-copy">Manage who can access the school system and their permissions.</p>
        </div>
        <button className="primary-button" onClick={() => setShowAdd(!showAdd)}><Plus size={16} /> Add user</button>
      </div>

      {error && <div className="auth-alert" style={{ marginBottom: '16px' }}>{error}</div>}
      {success && <div className="toast" style={{ position: 'static', marginBottom: '16px' }}><Check size={17} />{success}</div>}

      {showAdd && (
        <section className="panel academics-section" style={{ maxWidth: '560px', margin: '0 auto 22px' }}>
          <div className="academics-section-heading"><UserRound size={18} /><h2>New User</h2></div>
          <form onSubmit={handleAdd} className="academics-form">
            <div className="form-field">
              <label htmlFor="userName">Display name <span className="req">*</span></label>
              <input id="userName" className="student-input" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Jane Doe" />
            </div>
            <div className="form-field">
              <label htmlFor="userEmail">Email <span className="req">*</span></label>
              <input id="userEmail" type="email" className="student-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@marycandyland.edu" />
            </div>
            <div className="form-field">
              <label htmlFor="userRole">Role</label>
              <select id="userRole" className="student-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="primary-button"><Plus size={16} /> Add user</button>
              <button type="button" className="secondary-button" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </form>
        </section>
      )}

      {loading ? (
        <div className="empty-state"><div className="empty-spinner" /><p>Loading users…</p></div>
      ) : users.length === 0 ? (
        <div className="empty-state"><ShieldCheck size={32} /><h2>No users yet</h2><p>Add a user to grant them system access.</p></div>
      ) : (
        <div className="student-table-wrap">
          <table className="student-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.displayName}</td>
                  <td>{u.email}</td>
                  <td>
                    <select className="filter-select" value={u.role} onChange={(e) => handleChangeRole(u, e.target.value as UserRole)}>
                      {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </td>
                  <td>{u.active ? <span style={{ color: '#238c70', fontWeight: 700 }}>Active</span> : <span style={{ color: '#dc6b5f', fontWeight: 700 }}>Inactive</span>}</td>
                  <td>
                    <div className="row-actions">
                      <button className="row-action" title={u.active ? 'Deactivate' : 'Activate'} onClick={() => handleToggleActive(u)}>
                        {u.active ? <Trash2 size={15} /> : <Check size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
