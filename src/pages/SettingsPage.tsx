import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Check, Settings as SettingsIcon, School } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { firestore } from '@/lib/firebase';

type SchoolSettings = {
  name: string;
  code: string;
  address: string;
  city: string;
  region: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  motto: string;
};

const emptySettings: SchoolSettings = {
  name: '', code: '', address: '', city: '', region: '', country: 'Ghana', phone: '', email: '', website: '', motto: '',
};

export function SettingsPage() {
  const { school } = useAuth();
  const [form, setForm] = useState<SchoolSettings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = useCallback(async () => {
    if (!firestore || !school) return;
    setLoading(true);
    setError('');
    try {
      const snap = await getDoc(doc(firestore, 'schools', school.id));
      if (snap.exists()) {
        const data = snap.data();
        setForm({
          name: data.name ?? '',
          code: data.code ?? '',
          address: data.address ?? '',
          city: data.city ?? '',
          region: data.region ?? '',
          country: data.country ?? 'Ghana',
          phone: data.phoneNumbers?.[0] ?? data.phone ?? '',
          email: data.email ?? '',
          website: data.website ?? '',
          motto: data.motto ?? '',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load school settings.');
    } finally {
      setLoading(false);
    }
  }, [school]);

  useEffect(() => { void loadData(); }, [loadData]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    window.setTimeout(() => setSuccess(''), 3000);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!firestore || !school) return;
    setSaving(true);
    setError('');
    try {
      await updateDoc(doc(firestore, 'schools', school.id), {
        name: form.name.trim(),
        code: form.code.trim(),
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        region: form.region.trim() || null,
        country: form.country.trim() || null,
        phoneNumbers: form.phone.trim() ? [form.phone.trim()] : [],
        email: form.email.trim() || null,
        website: form.website.trim() || null,
        motto: form.motto.trim() || null,
        updatedAt: serverTimestamp(),
      });
      showSuccess('School settings saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="academics-page">
      <div className="academics-header">
        <div>
          <p className="eyebrow">System Configuration</p>
          <h1>Settings</h1>
          <p className="welcome-copy">Update your school profile and contact information.</p>
        </div>
      </div>

      {error && <div className="auth-alert" style={{ marginBottom: '16px' }}>{error}</div>}
      {success && <div className="toast" style={{ position: 'static', marginBottom: '16px' }}><Check size={17} />{success}</div>}

      {loading ? (
        <div className="empty-state"><div className="empty-spinner" /><p>Loading settings…</p></div>
      ) : (
        <section className="panel academics-section" style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div className="academics-section-heading"><SettingsIcon size={18} /><h2>School Profile</h2></div>
          <form onSubmit={handleSave} className="academics-form">
            <div className="form-grid-2">
              <div className="form-field">
                <label htmlFor="schoolName">School name <span className="req">*</span></label>
                <input id="schoolName" className="student-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-field">
                <label htmlFor="schoolCode">School code</label>
                <input id="schoolCode" className="student-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="schoolMotto">Motto</label>
              <input id="schoolMotto" className="student-input" value={form.motto} onChange={(e) => setForm({ ...form, motto: e.target.value })} placeholder="Knowledge, Discipline, Excellence" />
            </div>
            <div className="form-field">
              <label htmlFor="schoolAddress">Address</label>
              <input id="schoolAddress" className="student-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="form-grid-3">
              <div className="form-field">
                <label htmlFor="schoolCity">City</label>
                <input id="schoolCity" className="student-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="form-field">
                <label htmlFor="schoolRegion">Region</label>
                <input id="schoolRegion" className="student-input" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
              </div>
              <div className="form-field">
                <label htmlFor="schoolCountry">Country</label>
                <input id="schoolCountry" className="student-input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-field">
                <label htmlFor="schoolPhone">Phone</label>
                <input id="schoolPhone" className="student-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+233 ..." />
              </div>
              <div className="form-field">
                <label htmlFor="schoolEmail">Email</label>
                <input id="schoolEmail" type="email" className="student-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="schoolWebsite">Website</label>
              <input id="schoolWebsite" className="student-input" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
            </div>
            <button type="submit" className="primary-button" disabled={saving}><School size={16} /> {saving ? 'Saving…' : 'Save settings'}</button>
          </form>
        </section>
      )}
    </div>
  );
}
