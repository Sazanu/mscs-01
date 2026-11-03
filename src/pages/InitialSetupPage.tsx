import { useState } from 'react';
import { Check, GraduationCap, LockKeyhole, School, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { provisionInitialSchool } from '@/data/schoolProvisioning';

export function InitialSetupPage() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSetup = async () => {
    if (!user) return;
    setError('');
    setIsSubmitting(true);
    try {
      await provisionInitialSchool(user);
      window.location.reload();
    } catch {
      setError('The school workspace could not be initialized. It may already be set up, or Firebase access may not be ready.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="setup-layout">
      <section className="setup-card">
        <div className="brand-mark"><GraduationCap size={23} /></div>
        <p className="eyebrow">First-time setup</p>
        <h1>Establish your school workspace</h1>
        <p className="setup-copy">Your authenticated account is ready to initialize the Mary Candyland workspace. This one-time action creates only the school record and your administrator profile.</p>
        <div className="setup-summary"><div><School size={18} /><span><strong>Mary Candyland School Complex</strong><small>School ID: mary-candyland</small></span></div><div><ShieldCheck size={18} /><span><strong>Administrator access</strong><small>Role is assigned by the setup process</small></span></div><div><LockKeyhole size={18} /><span><strong>Protected initialization</strong><small>School and user records are created together</small></span></div></div>
        {error && <div className="auth-alert">{error}</div>}
        <button className="primary-button setup-button" onClick={() => void handleSetup()} disabled={isSubmitting}>{isSubmitting ? 'Initializing workspace…' : 'Initialize workspace'}{!isSubmitting && <Check size={17} />}</button>
        <p className="auth-note">Signed in as {user?.email ?? 'your administrator account'}. Do not share your password.</p>
      </section>
    </main>
  );
}
