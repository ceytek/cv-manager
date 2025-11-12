import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  BarChart3, 
  Settings, 
  Bell,
  LogOut,
  UserPlus,
  Eye,
  EyeOff,
  KeyRound,
  FileText,
  Upload,
  PlusCircle,
  UserCheck
} from 'lucide-react';
import { useQuery, useMutation, useSubscription } from '@apollo/client/react';
import { USERS_QUERY, DEACTIVATE_USER_MUTATION } from '../graphql/auth';
import { DEPARTMENTS_QUERY } from '../graphql/departments';
import './Dashboard.css';
import { STATS_QUERY, STATS_SUBSCRIPTION } from '../graphql/stats';
import AddUserModal from './AddUserModal';
import DepartmentsPage from './DepartmentsPage';
import JobsPage from './JobsPage';
import CVPage from './CVPage';
import CVEvaluationPage from './CVEvaluation/CVEvaluationPage';
import LanguageSwitcher from './LanguageSwitcher';

const Dashboard = ({ currentUser, onLogout }) => {
  const { t } = useTranslation();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [showAddUser, setShowAddUser] = useState(false);
  const [settingsMenu, setSettingsMenu] = useState(null);
  const [cvEvalInitialView, setCvEvalInitialView] = useState('welcome');
  const [cvInitialView, setCvInitialView] = useState('welcome');
  const [jobsInitialCreate, setJobsInitialCreate] = useState(false);

  // Derive a safe display name
  const displayName = (currentUser?.fullName?.trim()) 
    || (currentUser?.email ? currentUser.email.split('@')[0] : '') 
    || 'Kullanıcı';
  const avatarInitial = displayName ? displayName.charAt(0).toUpperCase() : 'K';
  const isAdmin = currentUser?.role === 'admin';

  // Fetch departments for Jobs page
  const { data: departmentsData } = useQuery(DEPARTMENTS_QUERY, {
    skip: !isAdmin,
    variables: { includeInactive: false },
  });
  const departments = departmentsData?.departments || [];

  // Initial stats fetch once; subscription will keep it fresh
  const { data: statsData, loading: statsInitialLoading, refetch: refetchStats } = useQuery(STATS_QUERY, {
    fetchPolicy: 'network-only'
  });
  const [liveStats, setLiveStats] = useState(null);
  useSubscription(STATS_SUBSCRIPTION, {
    onData: ({ data }) => {
      const payload = data?.data?.statsUpdates;
      if (payload) setLiveStats(payload);
    },
    onError: () => {
      // Do a one-off refresh as a safety net; WS link should auto-reconnect
      if (typeof refetchStats === 'function') refetchStats();
    },
    shouldResubscribe: true,
  });
  const s = liveStats || statsData?.stats;
  const stats = [
    { title: t('stats.cvCount'), value: s?.candidateCount ?? '—' },
    { title: t('stats.jobCount'), value: s?.jobCount ?? '—' },
    { title: t('stats.applicationCount'), value: s?.applicationCount ?? '—' },
    { title: t('stats.departmentCount'), value: s?.departmentCount ?? '—' },
  ];
  const statsLoading = statsInitialLoading && !s;

  const trendData = {
    title: 'Başvuru Trendleri',
    value: 456,
    change: '+12.5%',
    labels: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
  };

  const sourceData = [
    { name: 'Kariyer Siteleri', value: 60, color: '#3B82F6' },
    { name: 'Şirket Sitesi', value: 25, color: '#10B981' },
    { name: 'Yönlendirmeler', value: 15, color: '#8B5CF6' }
  ];

  const recentJobs = [
    { 
      title: 'Kıdemli Frontend Geliştirici', 
      department: 'Mühendislik', 
      applications: 128, 
      status: 'Aktif',
      statusColor: 'green'
    },
    { 
      title: 'UX/UI Tasarımcısı', 
      department: 'Tasarım', 
      applications: 72, 
      status: 'Aktif',
      statusColor: 'green'
    },
    { 
      title: 'Pazarlama Uzmanı', 
      department: 'Pazarlama', 
      applications: 45, 
      status: 'İnceleniyor',
      statusColor: 'yellow'
    },
    { 
      title: 'Veri Bilimci', 
      department: 'Analitik', 
      applications: 31, 
      status: 'Kapalı',
      statusColor: 'red'
    }
  ];

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('sidebar.dashboard') },
    ...(isAdmin ? [{ id: 'users', icon: Users, label: t('sidebar.users') }] : []),
    ...(isAdmin ? [{ id: 'departments', icon: Briefcase, label: t('sidebar.departments') }] : []),
    { id: 'jobs', icon: Briefcase, label: t('sidebar.jobs') },
    { id: 'cvs', icon: FileText, label: t('sidebar.cvManagement') },
    { id: 'cv-evaluation', icon: BarChart3, label: t('sidebar.cvEvaluation') },
    { id: 'settings', icon: Settings, label: t('sidebar.settings') }
  ];

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">👔</div>
            <span className="logo-text">{t('sidebar.appName')}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <div key={item.id}>
              <button
                className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
                onClick={() => {
                  if (item.id === 'settings') {
                    setActiveMenu('settings');
                    setSettingsMenu(null); // only expand submenu
                  } else {
                    // For CV Management via sidebar, land on welcome by default
                    if (item.id === 'cvs') {
                      setCvInitialView('welcome');
                    }
                    // For CV Evaluation via sidebar, land on welcome by default
                    if (item.id === 'cv-evaluation') {
                      setCvEvalInitialView('welcome');
                    }
                    // For Jobs via sidebar, default is list (not create)
                    if (item.id === 'jobs') {
                      setJobsInitialCreate(false);
                    }
                    setActiveMenu(item.id);
                    setSettingsMenu(null);
                  }
                }}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
              {item.id === 'settings' && activeMenu === 'settings' && (
                <div className="submenu">
                  <button
                    className={`submenu-item ${settingsMenu === 'password' ? 'active' : ''}`}
                    onClick={() => setSettingsMenu('password')}
                  >
                    <KeyRound size={16} style={{ marginRight: 8, opacity: 0.8 }} />
                    {t('settings.changePassword')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </nav>

  <div className="sidebar-footer">
          <button className="new-job-button" onClick={() => { setJobsInitialCreate(true); setActiveMenu('jobs'); }}>
            {t('sidebar.newJobButton')}
          </button>
          <div className="user-profile">
            <div className="user-avatar">
              {avatarInitial}
            </div>
            <div className="user-info">
              <div className="user-name">{displayName}</div>
              <div className="user-role">{t('sidebar.userRole')}</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={onLogout}>
            <LogOut size={16} />
            <span>{t('common.logout')}</span>
          </button>
        </div>
      </aside>

  {/* Main content */}
      <main className="main-content">
        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="page-title">{activeMenu === 'settings' && settingsMenu === 'password' ? t('settings.changePassword') : t('header.welcome', { name: displayName })}</h1>
            {!(activeMenu === 'settings' && settingsMenu === 'password') && (
              <p className="page-subtitle">{t('header.subtitle')}</p>
            )}
          </div>
          <div className="topbar-right">
            <LanguageSwitcher />
            <button className="icon-button">
              <Bell size={20} />
            </button>
            {isAdmin && (
              <button className="icon-button" onClick={() => setShowAddUser(true)} title={t('header.addUser')}>
                <UserPlus size={20} />
              </button>
            )}
            <button className="logout-btn" onClick={onLogout}>
              {t('common.logout')}
            </button>
          </div>
        </header>

        {/* Users (admin) */}
        {activeMenu === 'users' && isAdmin && (
          <UsersTable />
        )}

        {/* Departments (admin) */}
        {activeMenu === 'departments' && isAdmin && (
          <DepartmentsPage />
        )}

        {/* Jobs */}
        {activeMenu === 'jobs' && (
          <JobsPage departments={departments} initialCreate={jobsInitialCreate} />
        )}

        {/* CVs */}
        {activeMenu === 'cvs' && (
          <CVPage departments={departments} initialView={cvInitialView} />
        )}

        {/* CV Evaluation */}
        {activeMenu === 'cv-evaluation' && (
          <CVEvaluationPage initialView={cvEvalInitialView} />
        )}

        {/* Settings pages - open only when submenu chosen */}
  {activeMenu === 'settings' && settingsMenu === 'password' && (
          <div className="table-card" style={{ maxWidth: 520 }}>
            <ChangePasswordForm onLogout={onLogout} />
          </div>
        )}

  {/* Show dashboard widgets unless a settings subpage is open */}
  {!(activeMenu === 'settings' && settingsMenu) && activeMenu !== 'users' && activeMenu !== 'departments' && activeMenu !== 'jobs' && activeMenu !== 'cvs' && activeMenu !== 'cv-evaluation' && (
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-header">
                <span className="stat-title">{stat.title}</span>
              </div>
              <div className="stat-value">{statsLoading ? '...' : stat.value}</div>
            </div>
          ))}
        </div>
        )}

        {/* Quick actions panel under stats */}
        {!(activeMenu === 'settings' && settingsMenu) && activeMenu === 'dashboard' && (
          <div className="action-panel">
            <button className="action-card" onClick={() => { setCvEvalInitialView('analysis'); setActiveMenu('cv-evaluation'); }}>
              <div className="action-icon">
                <UserCheck size={28} color="#3B82F6" />
              </div>
              <div className="action-title">{t('actions.cvEvaluation')}</div>
              <div className="action-subtitle">{t('actions.cvEvaluationDesc')}</div>
            </button>

            <button className="action-card" onClick={() => { setCvInitialView('upload'); setActiveMenu('cvs'); }}>
              <div className="action-icon">
                <Upload size={28} color="#3B82F6" />
              </div>
              <div className="action-title">{t('actions.cvUpload')}</div>
              <div className="action-subtitle">{t('actions.cvUploadDesc')}</div>
            </button>

            <button className="action-card" onClick={() => { setJobsInitialCreate(true); setActiveMenu('jobs'); }}>
              <div className="action-icon">
                <PlusCircle size={28} color="#3B82F6" />
              </div>
              <div className="action-title">{t('actions.jobAdd')}</div>
              <div className="action-subtitle">{t('actions.jobAddDesc')}</div>
            </button>

            <button className="action-card" onClick={() => setActiveMenu('jobs')}>
              <div className="action-icon">
                <Briefcase size={28} color="#3B82F6" />
              </div>
              <div className="action-title">{t('actions.jobList')}</div>
              <div className="action-subtitle">{t('actions.jobListDesc')}</div>
            </button>
          </div>
        )}

  {/* Charts row removed as requested */}

  {/* Recent jobs table removed (dummy data) */}
      </main>
      {isAdmin && (
        <AddUserModal 
          isOpen={showAddUser} 
          onClose={() => setShowAddUser(false)} 
          onSuccess={() => {/* ileride liste yenileme eklenebilir */}}
        />
      )}
    </div>
  );
};

export default Dashboard;
// Admin Users Table
const UsersTable = () => {
  const { t } = useTranslation();
  const { data, loading, error, refetch } = useQuery(USERS_QUERY, { fetchPolicy: 'network-only' });
  const [deactivate] = useMutation(DEACTIVATE_USER_MUTATION);
  const onDeactivate = async (id) => {
    try {
      await deactivate({ variables: { userId: Number(id) } });
      refetch();
    } catch (e) {
      console.error(e);
      alert(t('users.deactivateError'));
    }
  };
  if (loading) return <div className="table-card">{t('common.loading')}</div>;
  if (error) return <div className="table-card">{t('common.error')}: {error.message}</div>;
  const rows = data?.users || [];
  return (
    <div className="table-card">
      <h3>{t('users.title')}</h3>
      <table className="jobs-table">
        <thead>
          <tr>
            <th>{t('users.fullName')}</th>
            <th>{t('users.email')}</th>
            <th>{t('users.role')}</th>
            <th>{t('users.status')}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id}>
              <td className="job-title">{u.fullName}</td>
              <td>{u.email}</td>
              <td>{u.role || 'user'}</td>
              <td>
                <span className={`status-badge ${u.isActive ? 'green' : 'red'}`}>
                  {u.isActive ? t('users.active') : t('users.inactive')}
                </span>
              </td>
              <td>
                {u.isActive && (
                  <button className="icon-button" title={t('users.deactivate')} onClick={() => onDeactivate(u.id)}>
                    🗑️
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Inline form component for simplicity
import authService from '../services/authService';
const ChangePasswordForm = ({ onLogout }) => {
  const { t } = useTranslation();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Password strength calculator
  const getStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const pct = Math.min(100, Math.round((score / 5) * 100));
    let label = 'Zayıf';
    let color = '#EF4444';
    if (score >= 3) { label = 'Orta'; color = '#F59E0B'; }
    if (score >= 4) { label = 'Güçlü'; color = '#10B981'; }
    return { pct, label, color };
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    // basic validations
    if (!oldPassword || !newPassword) {
      setLoading(false);
      setError(t('settings.fillAllFields'));
      return;
    }
    if (newPassword.length < 6) {
      setLoading(false);
      setError(t('settings.passwordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setLoading(false);
      setError(t('settings.passwordMismatch'));
      return;
    }
    try {
      const res = await authService.changePassword(oldPassword, newPassword);
      setMessage(res?.message || t('settings.passwordUpdated'));
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
      // Auto logout shortly after success
      setTimeout(() => {
        if (typeof onLogout === 'function') onLogout();
      }, 1200);
    } catch (e) {
      setError(e.message || t('settings.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="input-group">
        <label>{t('settings.currentPassword')}</label>
        <div className="password-input-wrapper">
          <input type={showOld ? 'text' : 'password'} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="••••••••" />
          <button type="button" className="password-toggle" onClick={() => setShowOld(v => !v)}>
            {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      <div className="input-group">
        <label>{t('settings.newPassword')}</label>
        <div className="password-input-wrapper">
          <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
          <button type="button" className="password-toggle" onClick={() => setShowNew(v => !v)}>
            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
  {/* Strength meter */}
  <PasswordStrength password={newPassword} />
      </div>
      <div className="input-group">
        <label>{t('settings.confirmPassword')}</label>
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
      </div>
      {error && <div className="error-message" style={{ marginTop: 8 }}>{error}</div>}
      {message && <div className="success-message" style={{ marginTop: 8, color: '#065F46' }}>{message}</div>}
      <button type="submit" className="logout-btn" disabled={loading} style={{ marginTop: 12 }}>
        {loading ? t('settings.updating') : t('settings.changePassword')}
      </button>
    </form>
  );
};

const PasswordStrength = ({ password }) => {
  const { t } = useTranslation();
  const calc = (pwd) => {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const pct = Math.min(100, Math.round((score / 5) * 100));
    let label = t('settings.passwordWeak');
    let color = '#EF4444';
    if (score >= 3) { label = t('settings.passwordMedium'); color = '#F59E0B'; }
    if (score >= 4) { label = t('settings.passwordStrong'); color = '#10B981'; }
    return { pct, label, color };
  };
  const { pct, label, color } = calc(password || '');
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ height: 6, background: '#E5E7EB', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 150ms ease' }} />
      </div>
      <div style={{ marginTop: 4, fontSize: 12, color: '#6B7280' }}>{t('settings.passwordStrength')}: <span style={{ color }}>{label}</span></div>
    </div>
  );
};
