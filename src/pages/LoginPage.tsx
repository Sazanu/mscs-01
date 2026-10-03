import { useState, type FormEvent } from 'react';
import { ArrowRight, GraduationCap, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';

export function LoginPage() {
  const { signIn, configError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Unable to sign in right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-layout">
      <section className="auth-brand-panel">
        <div className="auth-brand"><div className="brand-mark"><GraduationCap size={23} /></div><div><strong>Mary Candyland</strong><span>School Complex</span></div></div>
        <div className="auth-message"><p className="eyebrow">School administration, made clear</p><h1>Everything your school needs, in one calm workspace.</h1><p>Manage the day-to-day with secure access to the people, records, and decisions that keep Mary Candyland moving.</p></div>
        <div className="auth-security"><ShieldCheck size={18} /><span>Protected school access</span></div>
      </section>
      <section className="auth-form-panel"><div className="auth-form-wrap"><p className="eyebrow">Welcome back</p><h2>Sign in to your school</h2><p className="auth-subtitle">Use your school account to continue to the dashboard.</p>{configError && <div className="auth-alert">Firebase setup is incomplete. Add the required settings before signing in.</div>}{error && <div className="auth-alert">{error}</div>}<form onSubmit={handleSubmit}><label htmlFor="email">Email address</label><div className="input-wrap"><Mail size={17} /><input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@marycandyland.edu" required /></div><label htmlFor="password">Password</label><div className="input-wrap"><LockKeyhole size={17} /><input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /></div><button className="primary-button auth-submit" disabled={isSubmitting || Boolean(configError)}>{isSubmitting ? 'Signing in…' : 'Sign in'}<ArrowRight size={17} /></button></form><p className="auth-note">Access is managed by your school administrator. New users cannot select their own role.</p></div></section>
    </main>
  );
}
