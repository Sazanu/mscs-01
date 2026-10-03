import { useState, type ReactNode } from 'react';
import { useAuth } from '@/auth/AuthContext';
import type { SchoolProfile, UserProfile } from '@/auth/AuthContext';
import { attendanceData, dashboardMetrics, recentActivities } from '@/data/dashboardSample';
import { InitialSetupPage } from '@/pages/InitialSetupPage';
import { LoginPage } from '@/pages/LoginPage';
import { StudentDirectory } from '@/pages/StudentDirectory';
import { StudentRegistrationPage } from '@/pages/StudentRegistrationPage';
import { StudentProfilePage } from '@/pages/StudentProfilePage';
import { StudentEditPage } from '@/pages/StudentEditPage';
import { AcademicsPage } from '@/pages/AcademicsPage';
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  GraduationCap,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Plus,
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

type Metric = {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  accent: string;
  trend?: string;
};

type View =
  | { name: 'dashboard' }
  | { name: 'students' }
  | { name: 'studentRegistration' }
  | { name: 'studentProfile'; studentId: string }
  | { name: 'studentEdit'; studentId: string }
  | { name: 'academics' };

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Students', icon: <Users size={18} /> },
  { label: 'Academics', icon: <BookOpen size={18} /> },
  { label: 'Attendance', icon: <CalendarDays size={18} /> },
  { label: 'Finance', icon: <WalletCards size={18} /> },
  { label: 'Reports', icon: <ArrowUpRight size={18} /> },
];

const metricIcons: Record<string, ReactNode> = {
  'Total students': <GraduationCap size={20} />,
  'Attendance rate': <ShieldCheck size={20} />,
  'Fees collected': <CircleDollarSign size={20} />,
  'Staff members': <UserRound size={20} />,
};

const activityIcons: Record<string, ReactNode> = {
  student: <Plus size={16} />,
  finance: <CircleDollarSign size={16} />,
  result: <Check size={16} />,
};

const metrics: Metric[] = dashboardMetrics.map((metric) => ({ ...metric, icon: metricIcons[metric.label] }));
const activities = recentActivities.map((activity) => ({ ...activity, icon: activityIcons[activity.type] }));

function App() {
  const { user, profile, school, needsSetup, loading, profileError, configError, signOutUser } = useAuth();

  if (loading) return <AuthLoading />;
  if (!user) return <LoginPage />;
  if (configError) return <AccessDenied message={configError} onSignOut={signOutUser} />;
  if (needsSetup) return <InitialSetupPage />;
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
    : 'Dashboard';

  const handleNav = (label: string) => {
    if (label === 'Dashboard') setView({ name: 'dashboard' });
    else if (label === 'Students') setView({ name: 'students' });
    else if (label === 'Academics') setView({ name: 'academics' });
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
      default:
        return <DashboardContent profile={profile} showNotice={showNotice} onAddStudent={() => setView({ name: 'studentRegistration' })} />;
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

type DashboardContentProps = {
  profile: UserProfile;
  showNotice: (message: string) => void;
  onAddStudent: () => void;
};

function DashboardContent({ profile, showNotice, onAddStudent }: DashboardContentProps) {
  return (
    <>
      <section className="welcome-row">
        <div><p className="eyebrow">Wednesday, 01 October 2026</p><h1>Good morning, {profile.displayName.split(' ')[0]}</h1><p className="welcome-copy">Here is what is happening across your school today.</p></div>
        <button className="primary-button" onClick={onAddStudent}><Plus size={18} /> Add student</button>
      </section>

      <section className="metric-grid" aria-label="School overview">
        {metrics.map((metric) => <article className="metric-card" key={metric.label}><div className={`metric-icon ${metric.accent}`}>{metric.icon}</div><div className="metric-copy"><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small>{metric.trend && <em>{metric.trend}</em>}</div><button className="card-menu" aria-label={`More ${metric.label} options`}><MoreHorizontal size={18} /></button></article>)}
      </section>

      <section className="dashboard-grid">
        <article className="panel attendance-panel"><div className="panel-heading"><div><p className="eyebrow">Daily overview</p><h2>Attendance trends</h2></div><button className="select-button">This week <ChevronDown size={15} /></button></div><div className="attendance-summary"><div><strong>94.8%</strong><span><b>↑ 2.4%</b> from last week</span></div><div className="legend"><span><i className="legend-dot present" />Present</span><span><i className="legend-dot absent" />Absent</span></div></div><div className="chart"><div className="chart-y-axis"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div className="chart-area"><div className="chart-lines"><i /><i /><i /><i /><i /></div><div className="bars">{attendanceData.map((item) => <div className="bar-group" key={item.day}><div className="bar-value">{item.value}%</div><div className="bar-track"><div className="bar-fill" style={{ height: `${item.value}%` }} /></div><span>{item.day}</span></div>)}</div></div></div></article>

        <article className="panel activities-panel"><div className="panel-heading"><div><p className="eyebrow">Live feed</p><h2>Recent activity</h2></div><button className="text-button" onClick={() => showNotice('Showing the full activity history.')}>View all <ArrowUpRight size={15} /></button></div><div className="activity-list">{activities.map((activity) => <div className="activity-item" key={activity.title}><div className="activity-icon">{activity.icon}</div><div className="activity-copy"><strong>{activity.title}</strong><span>{activity.detail}</span></div><time>{activity.time}</time></div>)}</div><button className="activity-footer" onClick={() => showNotice('Activity history is up to date.')}>All activity is up to date <Check size={15} /></button></article>
      </section>

      <section className="bottom-grid">
        <article className="panel birthdays-panel"><div className="panel-heading"><div><p className="eyebrow">This week</p><h2>Upcoming birthdays</h2></div><button className="icon-button subtle" aria-label="More birthday options"><MoreHorizontal size={18} /></button></div><div className="birthday-list"><div className="birthday-row"><div className="birthday-avatar pink">AN</div><div><strong>Adwoa Nyarko</strong><span>Primary 2 · 03 Oct</span></div><span className="birthday-tag">In 2 days</span></div><div className="birthday-row"><div className="birthday-avatar blue">KO</div><div><strong>Kofi Owusu</strong><span>KG 2 · 05 Oct</span></div><span className="birthday-tag">In 4 days</span></div></div></article>
        <article className="panel classes-panel"><div className="panel-heading"><div><p className="eyebrow">Academic year 2026/27</p><h2>Class overview</h2></div><button className="text-button" onClick={() => showNotice('Opening the full class list.')}>View classes <ArrowUpRight size={15} /></button></div><div className="class-progress"><div className="progress-label"><span>Students by school level</span><strong>248 total</strong></div><div className="progress-bar"><i className="progress-creche" /><i className="progress-primary" /><i className="progress-jhs" /></div><div className="progress-legend"><span><i className="legend-dot creche" />Early years <b>62</b></span><span><i className="legend-dot primary" />Primary <b>128</b></span><span><i className="legend-dot jhs" />JHS <b>58</b></span></div></div></article>
      </section>
    </>
  );
}

export default App;
