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
  UserCheck,
  History,
  Video,
  ListChecks,
  ScrollText,
  Layers,
  ChevronDown,
  MailX,
  Activity,
  Clock
} from 'lucide-react';
import { useQuery, useMutation, useSubscription } from '@apollo/client/react';
import { USERS_QUERY, DEACTIVATE_USER_MUTATION } from '../graphql/auth';
import { DEPARTMENTS_QUERY } from '../graphql/departments';
import { JOBS_QUERY } from '../graphql/jobs';
import './Dashboard.css';
import { STATS_QUERY, STATS_SUBSCRIPTION } from '../graphql/stats';
import { GET_RECENT_ACTIVITIES } from '../graphql/history';
import AddUserModal from './AddUserModal';
import DepartmentsPage from './DepartmentsPage';
import JobsPage from './JobsPage';
import CVPage from './CVPage';
import CVEvaluationPage from './CVEvaluation/CVEvaluationPage';
import UsageHistoryPage from './UsageHistory/UsageHistoryPageNew';
import LanguageSwitcher from './LanguageSwitcher';
import UsageIndicator from './UsageIndicator';
import SubscriptionBanner from './SubscriptionBanner';
import SubscriptionUsageWidget from './SubscriptionUsageWidget';
import InterviewTemplatesPage from './InterviewTemplatesPage';
import LikertTemplatesPage from './LikertTemplatesPage';
import AgreementTemplatesPage from './AgreementTemplatesPage';
import RejectionTemplatesPage from './RejectionTemplatesPage';

const Dashboard = ({ currentUser, onLogout }) => {
  const { t } = useTranslation();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [showAddUser, setShowAddUser] = useState(false);
  const [settingsMenu, setSettingsMenu] = useState(null);
  const [templatesMenu, setTemplatesMenu] = useState(null);
  const [cvEvalInitialView, setCvEvalInitialView] = useState('welcome');
  const [cvEvalInitialJob, setCvEvalInitialJob] = useState(null);
  const [cvEvalInitialApplication, setCvEvalInitialApplication] = useState(null);
  const [cvInitialView, setCvInitialView] = useState('welcome');
  const [jobsInitialCreate, setJobsInitialCreate] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [jobsListPage, setJobsListPage] = useState(0); // Pagination for jobs widget
  const [activitiesPage, setActivitiesPage] = useState(0); // Pagination for activities widget

  // Derive a safe display name
  const displayName = (currentUser?.fullName?.trim()) 
    || (currentUser?.email ? currentUser.email.split('@')[0] : '') 
    || 'Kullanıcı';
  const avatarInitial = displayName ? displayName.charAt(0).toUpperCase() : 'K';
  const isAdmin = currentUser?.role === 'admin';

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showUserMenu && !e.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  // Fetch departments for Jobs page
  const { data: departmentsData } = useQuery(DEPARTMENTS_QUERY, {
    skip: !isAdmin,
    variables: { includeInactive: false },
  });
  const departments = departmentsData?.departments || [];

  // Fetch recent jobs (auto-refresh every 10 seconds)
  const { data: jobsData } = useQuery(JOBS_QUERY, {
    variables: {
      includeInactive: false,
      status: 'active',
      searchTerm: null,
    },
    fetchPolicy: 'cache-and-network',
    pollInterval: 10000, // Refresh every 10 seconds
  });
  const recentJobs = (jobsData?.jobs || []).slice(0, 3);
  
  // Debug: Log job data
  console.log('Recent Jobs Data:', recentJobs);

  // Fetch recent activities (auto-refresh every 5 seconds)
  const { data: activitiesData, loading: activitiesLoading } = useQuery(GET_RECENT_ACTIVITIES, {
    variables: { limit: 50 },
    fetchPolicy: 'cache-and-network',
    pollInterval: 5000, // Refresh every 5 seconds
  });
  const allActivities = activitiesData?.recentActivities?.activities || [];

  // Get department name by ID
  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : t('dashboard.unknownDepartment');
  };
  
  // Extract plain text from HTML description
  const getDescriptionPreview = (job) => {
    let text = job.descriptionPlain || job.description || '';
    // If it's HTML, strip tags
    if (text.includes('<')) {
      const div = document.createElement('div');
      div.innerHTML = text;
      text = div.textContent || div.innerText || '';
    }
    return text.trim().substring(0, 80) || t('dashboard.noDescription');
  };

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

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('sidebar.dashboard') },
    ...(isAdmin ? [{ id: 'users', icon: Users, label: t('sidebar.users') }] : []),
    ...(isAdmin ? [{ id: 'departments', icon: Briefcase, label: t('sidebar.departments') }] : []),
    { id: 'jobs', icon: Briefcase, label: t('sidebar.jobs') },
    { id: 'cvs', icon: FileText, label: t('sidebar.cvManagement') },
    { id: 'cv-evaluation', icon: BarChart3, label: t('sidebar.cvEvaluation') },
    { id: 'usage-history', icon: History, label: t('sidebar.usageHistory') },
    { id: 'templates', icon: Layers, label: t('sidebar.templates') },
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
                    setSettingsMenu(null);
                    setTemplatesMenu(null);
                  } else if (item.id === 'templates') {
                    setActiveMenu('templates');
                    setTemplatesMenu(null);
                    setSettingsMenu(null);
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
                    setTemplatesMenu(null);
                  }
                }}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
              
              {/* Templates Submenu */}
              {item.id === 'templates' && activeMenu === 'templates' && (
                <div className="submenu">
                  <button
                    className={`submenu-item ${templatesMenu === 'interviewTemplates' ? 'active' : ''}`}
                    onClick={() => setTemplatesMenu('interviewTemplates')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Video size={16} color="#6B7280" />
                      {t('templates.interviewTemplates')}
                    </span>
                  </button>
                  <button
                    className={`submenu-item ${templatesMenu === 'likertTemplates' ? 'active' : ''}`}
                    onClick={() => setTemplatesMenu('likertTemplates')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <ListChecks size={16} color="#6B7280" />
                      {t('templates.likertTemplates')}
                    </span>
                  </button>
                  <button
                    className={`submenu-item ${templatesMenu === 'agreementTemplates' ? 'active' : ''}`}
                    onClick={() => setTemplatesMenu('agreementTemplates')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <ScrollText size={16} color="#6B7280" />
                      {t('templates.agreementTemplates')}
                    </span>
                  </button>
                  <button
                    className={`submenu-item ${templatesMenu === 'rejectionTemplates' ? 'active' : ''}`}
                    onClick={() => setTemplatesMenu('rejectionTemplates')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <MailX size={16} color="#6B7280" />
                      {t('templates.rejectionTemplates', 'Red Mesajları')}
                    </span>
                  </button>
                </div>
              )}
              
              {/* Settings Submenu - Only Password */}
              {item.id === 'settings' && activeMenu === 'settings' && (
                <div className="submenu">
                  <button
                    className={`submenu-item ${settingsMenu === 'password' ? 'active' : ''}`}
                    onClick={() => setSettingsMenu('password')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <KeyRound size={16} color="#6B7280" />
                      {t('settings.changePassword')}
                    </span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <SubscriptionUsageWidget />
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
            
            {/* User Profile Dropdown */}
            <div className="user-menu-container">
              <button 
                className="user-menu-trigger"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="user-avatar-small">
                  {avatarInitial}
                </div>
                <div className="user-menu-info">
                  <span className="user-menu-name">{displayName}</span>
                  <span className="user-menu-role">{t('sidebar.userRole')}</span>
                </div>
                <ChevronDown size={16} className={`user-menu-chevron ${showUserMenu ? 'open' : ''}`} />
              </button>
              
              {showUserMenu && (
                <div className="user-dropdown">
                  <button className="user-dropdown-item" onClick={() => { onLogout(); setShowUserMenu(false); }}>
                    <LogOut size={16} />
                    <span>{t('common.logout')}</span>
                  </button>
                </div>
              )}
            </div>
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
          <CVEvaluationPage initialView={cvEvalInitialView} initialJob={cvEvalInitialJob} />
        )}

        {/* Usage History */}
        {activeMenu === 'usage-history' && (
          <UsageHistoryPage />
        )}

        {/* Settings pages - open only when submenu chosen */}
        {activeMenu === 'settings' && settingsMenu === 'password' && (
          <div className="table-card" style={{ maxWidth: 520 }}>
            <ChangePasswordForm onLogout={onLogout} />
          </div>
        )}

        {/* Templates pages */}
        {activeMenu === 'templates' && templatesMenu === 'interviewTemplates' && (
          <InterviewTemplatesPage />
        )}

        {activeMenu === 'templates' && templatesMenu === 'likertTemplates' && (
          <LikertTemplatesPage />
        )}

        {activeMenu === 'templates' && templatesMenu === 'agreementTemplates' && (
          <AgreementTemplatesPage />
        )}

        {activeMenu === 'templates' && templatesMenu === 'rejectionTemplates' && (
          <RejectionTemplatesPage />
        )}

        {/* Show dashboard widgets unless a settings/templates subpage is open */}
  {!(activeMenu === 'settings' && settingsMenu) && !(activeMenu === 'templates' && templatesMenu) && activeMenu !== 'users' && activeMenu !== 'departments' && activeMenu !== 'jobs' && activeMenu !== 'cvs' && activeMenu !== 'cv-evaluation' && activeMenu !== 'usage-history' && activeMenu !== 'templates' && (
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

        {/* Subscription Banner & Usage Indicator */}
        {!(activeMenu === 'settings' && settingsMenu) && activeMenu === 'dashboard' && (
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <UsageIndicator />
          </div>
        )}

        {/* Jobs Widget Row - Left: Jobs Table, Right: Reserved for future widget */}
        {!(activeMenu === 'settings' && settingsMenu) && activeMenu === 'dashboard' && (
          <div style={{ 
            marginTop: 32,
            marginBottom: 32,
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 24 
          }}>
            {/* Left Side: Jobs Table Widget */}
            <div style={{
              background: 'white',
              borderRadius: 16,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #E5E7EB',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '16px 20px',
                borderBottom: '1px solid #E5E7EB',
              }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: 16, 
                  fontWeight: 600, 
                  color: '#1F2937' 
                }}>
                  {t('dashboard.jobsWidget', 'Akışlar')}
                </h3>
                <button
                  onClick={() => setActiveMenu('jobs')}
                  style={{
                    padding: '4px 12px',
                    background: 'transparent',
                    border: 'none',
                    color: '#3B82F6',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {t('dashboard.viewAll')} →
                </button>
              </div>

              {/* Table */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Table Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  padding: '12px 20px',
                  background: '#F9FAFB',
                  borderBottom: '1px solid #E5E7EB',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  <span>{t('dashboard.jobTitle', 'İş İlanı')}</span>
                  <span style={{ textAlign: 'right' }}>{t('dashboard.applicants', 'Başvuran')}</span>
                </div>

                {/* Table Body - Fixed height for 5 rows */}
                <div style={{ 
                  minHeight: 350, // Match activities widget height
                  maxHeight: 350,
                  overflowY: 'auto',
                }}>
                  {(jobsData?.jobs || [])
                    .slice(jobsListPage * 5, (jobsListPage + 1) * 5)
                    .map((job, idx, arr) => (
                      <div
                        key={job.id}
                        onClick={() => {
                          setCvEvalInitialJob(job);
                          setCvEvalInitialView('job-details');
                          setActiveMenu('cv-evaluation');
                        }}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr auto',
                          alignItems: 'center',
                          padding: '14px 20px',
                          borderBottom: idx < arr.length - 1 ? '1px solid #F3F4F6' : 'none',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                          minHeight: 50,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ 
                          color: '#3B82F6', 
                          fontWeight: 500, 
                          fontSize: 14,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          paddingRight: 16,
                        }}>
                          {job.title}
                        </span>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 6,
                          color: '#F59E0B',
                          fontSize: 14,
                        }}>
                          <Users size={16} />
                          <span style={{ fontWeight: 500 }}>
                            {job.analysisCount || 0} {t('dashboard.candidates', 'aday')}
                          </span>
                        </div>
                      </div>
                    ))}

                  {/* Empty state */}
                  {(!jobsData?.jobs || jobsData.jobs.length === 0) && (
                    <div style={{ 
                      padding: 48, 
                      textAlign: 'center', 
                      color: '#9CA3AF',
                      fontSize: 14,
                    }}>
                      {t('dashboard.noJobs', 'Henüz iş ilanı yok')}
                    </div>
                  )}
                </div>
              </div>

              {/* Pagination Footer */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 20px',
                borderTop: '1px solid #E5E7EB',
                background: '#FAFAFA',
                fontSize: 13,
                color: '#6B7280',
              }}>
                <span>
                  {t('dashboard.showing', 'Gösterilen')}: {Math.min((jobsListPage + 1) * 5, jobsData?.jobs?.length || 0)} / {jobsData?.jobs?.length || 0}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => setJobsListPage(p => Math.max(0, p - 1))}
                    disabled={jobsListPage === 0}
                    style={{
                      padding: '6px 10px',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: 6,
                      color: jobsListPage === 0 ? '#D1D5DB' : '#374151',
                      fontSize: 13,
                      cursor: jobsListPage === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    ‹
                  </button>
                  <span style={{ minWidth: 60, textAlign: 'center' }}>
                    {jobsListPage + 1} / {Math.max(1, Math.ceil((jobsData?.jobs?.length || 0) / 5))}
                  </span>
                  <button
                    onClick={() => setJobsListPage(p => Math.min(Math.ceil((jobsData?.jobs?.length || 0) / 5) - 1, p + 1))}
                    disabled={jobsListPage >= Math.ceil((jobsData?.jobs?.length || 0) / 5) - 1}
                    style={{
                      padding: '6px 10px',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: 6,
                      color: jobsListPage >= Math.ceil((jobsData?.jobs?.length || 0) / 5) - 1 ? '#D1D5DB' : '#374151',
                      fontSize: 13,
                      cursor: jobsListPage >= Math.ceil((jobsData?.jobs?.length || 0) / 5) - 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side: Recent Activities Widget */}
            <div style={{
              background: 'white',
              borderRadius: 16,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #E5E7EB',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 380,
            }}>
              {/* Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '16px 20px',
                borderBottom: '1px solid #E5E7EB',
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8,
                  fontWeight: 600, 
                  fontSize: 16,
                  color: '#111827',
                }}>
                  <Activity size={20} color="#3B82F6" />
                  {t('dashboard.recentActivities', 'Son İşlemler')}
                </div>
              </div>

              {/* Table Header */}
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                padding: '10px 20px',
                background: '#F9FAFB',
                borderBottom: '1px solid #E5E7EB',
                fontWeight: 600,
                fontSize: 12,
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                <span>{t('dashboard.activity', 'İşlem')}</span>
                <span>{t('dashboard.time', 'Zaman')}</span>
              </div>

              {/* Activities List */}
              <div style={{ 
                flex: 1,
                height: 350, 
                overflowY: 'auto',
              }}>
                {allActivities
                  .slice(activitiesPage * 5, (activitiesPage + 1) * 5)
                  .map((activity, idx, arr) => {
                    // Format time as relative
                    const date = new Date(activity.createdAt);
                    const now = new Date();
                    const diffMs = now - date;
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMs / 3600000);
                    const diffDays = Math.floor(diffMs / 86400000);
                    let timeAgo;
                    if (diffMins < 60) {
                      timeAgo = `${diffMins} ${t('dashboard.minutesAgo', 'dk önce')}`;
                    } else if (diffHours < 24) {
                      timeAgo = `${diffHours} ${t('dashboard.hoursAgo', 'saat önce')}`;
                    } else {
                      timeAgo = `${diffDays} ${t('dashboard.daysAgo', 'gün önce')}`;
                    }

                    // Get action name based on language
                    const actionName = localStorage.getItem('i18nextLng')?.startsWith('en') 
                      ? activity.actionNameEn 
                      : activity.actionNameTr;

                    // Get color for the action
                    const colorMap = {
                      blue: '#3B82F6',
                      green: '#10B981',
                      red: '#EF4444',
                      orange: '#F59E0B',
                      purple: '#8B5CF6',
                      gray: '#6B7280',
                    };
                    const color = colorMap[activity.color] || '#6B7280';

                    // Generate avatar color from candidate name (consistent per person)
                    const avatarColors = [
                      '#3B82F6', // Blue
                      '#10B981', // Green
                      '#F59E0B', // Orange
                      '#8B5CF6', // Purple
                      '#EF4444', // Red
                      '#EC4899', // Pink
                      '#14B8A6', // Teal
                      '#F97316', // Deep Orange
                      '#6366F1', // Indigo
                      '#84CC16', // Lime
                    ];
                    const nameHash = activity.candidateName
                      .split('')
                      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    const avatarColor = avatarColors[nameHash % avatarColors.length];

                    return (
                      <div
                        key={activity.id}
                        onClick={() => {
                          // Find job from jobsData
                          const job = jobsData?.jobs?.find(j => j.id === activity.jobId);
                          if (job) {
                            setCvEvalInitialJob(job);
                            setCvEvalInitialView('job-details');
                            setActiveMenu('cv-evaluation');
                          } else {
                            // Fallback: just go to analysis page
                            setCvEvalInitialView('analysis');
                            setActiveMenu('cv-evaluation');
                          }
                        }}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr auto',
                          alignItems: 'center',
                          padding: '14px 20px',
                          borderBottom: idx < arr.length - 1 ? '1px solid #F3F4F6' : 'none',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                          minHeight: 70,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          overflow: 'hidden',
                        }}>
                          {/* Avatar */}
                          <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: avatarColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: 14,
                            flexShrink: 0,
                          }}>
                            {activity.candidateName
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          {/* Name & Email & Action */}
                          <div style={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            overflow: 'hidden',
                            flex: 1,
                          }}>
                            <span style={{ 
                              fontWeight: 600, 
                              fontSize: 14,
                              color: '#111827',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {activity.candidateName}
                            </span>
                            <span style={{ 
                              fontSize: 12,
                              color: '#6B7280',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {activity.candidateEmail || '-'}
                            </span>
                            <span style={{ 
                              fontSize: 11,
                              color: color,
                              fontWeight: 500,
                            }}>
                              {actionName}
                            </span>
                          </div>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 4,
                          color: '#9CA3AF',
                          fontSize: 12,
                          flexShrink: 0,
                        }}>
                          <Clock size={12} />
                          <span>{timeAgo}</span>
                        </div>
                      </div>
                    );
                  })}

                {/* Empty state */}
                {allActivities.length === 0 && (
                  <div style={{ 
                    padding: 48, 
                    textAlign: 'center', 
                    color: '#9CA3AF',
                    fontSize: 14,
                  }}>
                    {t('dashboard.noActivities', 'Henüz işlem yok')}
                  </div>
                )}
              </div>

              {/* Pagination Footer */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 20px',
                borderTop: '1px solid #E5E7EB',
                background: '#FAFAFA',
                fontSize: 13,
                color: '#6B7280',
              }}>
                <span>
                  {t('dashboard.showing', 'Gösterilen')}: {Math.min((activitiesPage + 1) * 5, allActivities.length)} / {allActivities.length}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => setActivitiesPage(p => Math.max(0, p - 1))}
                    disabled={activitiesPage === 0}
                    style={{
                      padding: '6px 10px',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: 6,
                      color: activitiesPage === 0 ? '#D1D5DB' : '#374151',
                      fontSize: 13,
                      cursor: activitiesPage === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    ‹
                  </button>
                  <span style={{ minWidth: 60, textAlign: 'center' }}>
                    {activitiesPage + 1} / {Math.max(1, Math.ceil(allActivities.length / 5))}
                  </span>
                  <button
                    onClick={() => setActivitiesPage(p => Math.min(Math.ceil(allActivities.length / 5) - 1, p + 1))}
                    disabled={activitiesPage >= Math.ceil(allActivities.length / 5) - 1}
                    style={{
                      padding: '6px 10px',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: 6,
                      color: activitiesPage >= Math.ceil(allActivities.length / 5) - 1 ? '#D1D5DB' : '#374151',
                      fontSize: 13,
                      cursor: activitiesPage >= Math.ceil(allActivities.length / 5) - 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
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
