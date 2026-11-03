import { useState, type ReactNode } from 'react';
import { useAuth } from '@/auth/AuthContext';
import type { SchoolProfile, UserProfile } from '@/auth/AuthContext';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { StudentDirectory } from '@/pages/StudentDirectory';
import { StudentRegistrationPage } from '@/pages/StudentRegistrationPage';
import { StudentProfilePage } from '@/pages/StudentProfilePage';
import { StudentEditPage } from '@/pages/StudentEditPage';
import { AcademicsPage } from '@/pages/AcademicsPage';
import { AttendancePage } from '@/pages/AttendancePage';
import { ReportsPage } from '@/pages/ReportsPage';
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  WalletCards,
  X,
} from 'lucide-react';

type NavItem = {
  label: string;
  icon: ReactNode;
  badge?: string;
};

type View =
  | { name: 'dashboard' }
  | { name: 'students' }
  | { name: 'studentRegistration' }
  | { name: 'studentProfile'; studentId: string }
  | { name: 'studentEdit'; studentId: string }
  | { name: 'academics' }
  | { name: 'attendance' }
  | { name: 'reports' };

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Students', icon: <Users size={18} /> },
  { label: 'Academics', icon: <BookOpen size={18} /> },
  { label: 'Attendance', icon: <CalendarDays size={18} /> },
  { label: 'Finance', icon: <WalletCards size={18} /> },
  { label: 'Reports', icon: <ArrowUpRight size={18} /> },
];

function App() {
  const { user, profile, school, loading, profileError, configError, signOutUser } = useAuth();

  if (loading) return <AuthLoading />;
  if (!user) return <LoginPage />;
  if (configError) return <AccessDenied message={configError} onSignOut={signOutUser} />;
  if (profileError || !profile || !school) return <AccessDenied message={profileError ?? 'Your school workspace is unavailable.'} onSignOut={signOutUser} />;
  return <Dashboard profile={profile} school={school} onSignOut={signOutUser} />;
}

function AuthLoading() {
  return <main className="auth-loading"><div className="brand-mark"><GraduationCap size={23} /></div><p>Checking your school access…</p></main>;
}

function AccessDenied({ message, onSignOut }: { message: string; onSignOut: () => Promise<void> }) {
  return <main className="auth-loading"><div className="access-card"><div className="brand-mark"><ShieldCheck size={23} /></div><p className="eyebrow">Access unavailable</p><h1>We could not open your school workspace.</h1><p>{message}</p><button className="primary-button" onClick={() => void onSignOut()}>Sign out</button></div></main>;
}

function Dashboard({ profile, school, onSignOut }: { profile: UserProfile; school: SchoolProfile; onSignOut: () => Promise<void> }) {
  const [view, setView] = useState<View>({ name: 'dashboard' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notice, setNotice] = useState('');

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2800);
  };

  const activeNav: string = view.name === 'dashboard' ? 'Dashboard'
    : view.name.startsWith('student') ? 'Students'
    : view.name === 'academics' ? 'Academics'
    : view.name === 'attendance' ? 'Attendance'
    : view.name === 'reports' ? 'Reports'
    : 'Dashboard';

  const handleNav = (label: string) => {
    if (label === 'Dashboard') setView({ name: 'dashboard' });
    else if (label === 'Students') setView({ name: 'students' });
    else if (label === 'Academics') setView({ name: 'academics' });
    else if (label === 'Attendance') setView({ name: 'attendance' });
    else if (label === 'Reports') setView({ name: 'reports' });
    else showNotice(`${label} module is coming soon.`);
    setIsSidebarOpen(false);
  };

  const renderContent = () => {
    switch (view.name) {
      case 'students':
        return (
          <StudentDirectory
            onAddStudent={() => setView({ name: 'studentRegistration' })}
            onViewStudent={(id) => setView({ name: 'studentProfile', studentId: id })}
            onEditStudent={(id) => setView({ name: 'studentEdit', studentId: id })}
          />
        );
      case 'studentRegistration':
        return (
          <StudentRegistrationPage
            onBack={() => setView({ name: 'students' })}
            onCreated={(id) => { showNotice('Student registered successfully.'); setView({ name: 'studentProfile', studentId: id }); }}
          />
        );
      case 'studentProfile':
        return (
          <StudentProfilePage
            studentId={view.studentId}
            onBack={() => setView({ name: 'students' })}
            onEdit={(id) => setView({ name: 'studentEdit', studentId: id })}
          />
        );
      case 'studentEdit':
        return (
          <StudentEditPage
            studentId={view.studentId}
            onBack={() => setView({ name: 'studentProfile', studentId: view.studentId })}
            onSaved={() => { showNotice('Student updated successfully.'); setView({ name: 'studentProfile', studentId: view.studentId }); }}
          />
        );
      case 'academics':
        return <AcademicsPage />;
      case 'attendance':
        return <AttendancePage />;
      case 'reports':
        return <ReportsPage />;
      default:
        return <DashboardPage profile={profile} onAddStudent={() => setView({ name: 'studentRegistration' })} />;
    }
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-block">
          <div className="brand-mark"><GraduationCap size={22} strokeWidth={2.4} /></div>
          <div>
            <p className="brand-name">Mary Candyland</p>
            <p className="brand-subtitle">School Complex</p>
          </div>
          <button className="close-sidebar" onClick={() => setIsSidebarOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>

        <div className="school-switcher">
          <div className="school-avatar">MC</div>
          <div className="school-switcher-copy"><span>Current school</span><strong>{school.name}</strong></div>
          <ChevronDown size={16} />
        </div>

        <p className="nav-label">Workspace</p>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button key={item.label} className={`nav-item ${activeNav === item.label ? 'nav-item-active' : ''}`} onClick={() => handleNav(item.label)}>
              {item.icon}<span>{item.label}</span>
            </button>
          ))}
        </nav>

        <p className="nav-label nav-label-spaced">Manage</p>
        <nav className="main-nav" aria-label="Management navigation">
          <button className={`nav-item ${activeNav === 'Settings' ? 'nav-item-active' : ''}`} onClick={() => showNotice('Settings is coming soon.')}><Settings size={18} /><span>Settings</span></button>
          <button className={`nav-item ${activeNav === 'Users' ? 'nav-item-active' : ''}`} onClick={() => showNotice('User management is coming soon.')}><UserRound size={18} /><span>Users & roles</span></button>
        </nav>

        <div className="sidebar-footer">
          <div className="help-card"><Sparkles size={18} /><div><strong>Need a hand?</strong><span>Visit the help center</span></div><ArrowUpRight size={16} /></div>
          <button className="profile-row profile-button" onClick={() => void onSignOut()} title="Sign out"><div className="profile-avatar">{profile.displayName.slice(0, 2).toUpperCase()}</div><div className="profile-copy"><strong>{profile.displayName}</strong><span>{profile.role}</span></div><MoreHorizontal size={18} /></button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="menu-button" onClick={() => setIsSidebarOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="breadcrumb"><span>Mary Candyland</span><span className="breadcrumb-separator">/</span><strong>{activeNav}</strong></div>
          <div className="topbar-actions"><button className="icon-button search-button" aria-label="Search"><Search size={19} /></button><button className="icon-button notification-button" aria-label="Notifications" onClick={() => showNotice('You are all caught up.')}><Bell size={19} /><i /></button><div className="topbar-profile"><div className="profile-avatar small">{profile.displayName.slice(0, 2).toUpperCase()}</div><ChevronDown size={15} /></div></div>
        </header>

        <div className="content-wrap">
          {renderContent()}
        </div>
      </main>
      {notice && <div className="toast"><Check size={17} />{notice}</div>}
    </div>
  );
}

export default App;
