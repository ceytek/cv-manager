/**
 * Jobs Page - Sol Panel: Liste & Kartlar
 * Tamamen modüler yapı - User/Department'tan bağımsız
 */
import React, { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { JOBS_QUERY } from '../graphql/jobs';
import { Search, MapPin, Users, Calendar } from 'lucide-react';
import JobForm from './JobForm';
import { useTranslation } from 'react-i18next';

const JobsPage = ({ departments = [], initialCreate = false }) => {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // When asked, start directly in create mode
  useEffect(() => {
    if (initialCreate) {
      setSelectedJob(null);
      setIsCreating(true);
    }
  }, [initialCreate]);

  // Fetch jobs
  const { data, loading, error, refetch } = useQuery(JOBS_QUERY, {
    variables: {
      includeInactive: false,
      status: activeFilter === 'all' ? null : activeFilter,
      searchTerm: searchTerm || null,
    },
    fetchPolicy: 'cache-and-network',
  });

  const jobs = data?.jobs || [];

  // Filter buttons
  const filters = [
    { id: 'active', label: t('jobsPage.filterActive'), count: jobs.filter(j => j.status === 'active').length },
    { id: 'draft', label: t('jobsPage.filterDraft'), count: jobs.filter(j => j.status === 'draft').length },
    { id: 'closed', label: t('jobsPage.filterClosed'), count: jobs.filter(j => j.status === 'closed').length },
    { id: 'archived', label: t('jobsPage.filterArchived'), count: jobs.filter(j => j.status === 'archived').length },
  ];

  const handleJobClick = (job) => {
    setSelectedJob(job);
    setIsCreating(false);
  };

  const handleCreateNew = () => {
    setSelectedJob(null);
    setIsCreating(true);
  };

  const handleFormSuccess = () => {
    refetch();
    setIsCreating(false);
    setSelectedJob(null);
  };

  const handleFormCancel = () => {
    setIsCreating(false);
    setSelectedJob(null);
  };

  // Get department name by ID
  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : t('jobsPage.unknownDepartment');
  };

  // Status badge helper
  const getStatusBadge = (status) => {
    const badges = {
      active: { label: t('jobsPage.statusActive'), class: 'green' },
      draft: { label: t('jobsPage.statusDraft'), class: 'yellow' },
      closed: { label: t('jobsPage.statusClosed'), class: 'red' },
      archived: { label: t('jobsPage.statusArchived'), class: 'status-badge' },
    };
    const badge = badges[status] || badges.draft;
    return <span className={`status-badge ${badge.class}`}>{badge.label}</span>;
  };

  // Remote policy icon
  const getRemotePolicyIcon = (policy) => {
    if (policy === 'remote') return t('jobsPage.remoteRemote');
    if (policy === 'hybrid') return t('jobsPage.remoteHybrid');
    return t('jobsPage.remoteOffice');
  };

  if (loading) return <div className="flex items-center justify-center h-64">{t('jobsPage.loading')}</div>;
  if (error) return <div className="flex items-center justify-center h-64 text-red-600">{t('jobsPage.error', { message: error.message })}</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24, height: 'calc(100vh - 120px)' }}>
      {/* Sol Panel: Liste */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        {/* Arama ve Filtreler */}
        <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>{t('jobsPage.title')}</h2>
          
          {/* Arama */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder={t('jobsPage.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: 40,
                padding: '10px 12px',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                fontSize: 14,
              }}
            />
          </div>

          {/* Filtre Butonları */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  border: 'none',
                  background: activeFilter === f.id ? '#3B82F6' : '#F3F4F6',
                  color: activeFilter === f.id ? 'white' : '#6B7280',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {f.label} {f.count > 0 && `(${f.count})`}
              </button>
            ))}
          </div>
        </div>

        {/* İlan Kartları */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {jobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>
              <p>{t('jobsPage.noJobsFound')}</p>
            </div>
          ) : (
            jobs.map(job => (
              <div
                key={job.id}
                onClick={() => handleJobClick(job)}
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  border: selectedJob?.id === job.id ? '2px solid #3B82F6' : '2px solid transparent',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1F2937' }}>{job.title}</h3>
                  {getStatusBadge(job.status)}
                </div>
                
                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>{getDepartmentName(job.departmentId)}</p>
                
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: '#6B7280' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={14} /> {/* Başvuru sayısı gelecek */} 0 {t('jobsPage.applications')}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={14} /> {job.location}
                  </span>
                  {job.deadline && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={14} /> {t('jobsPage.lastDate')} {new Date(job.deadline).toLocaleDateString('tr-TR')}
                    </span>
                  )}
                </div>
                
                <div style={{ marginTop: 8, fontSize: 11, color: '#9CA3AF' }}>
                  {getRemotePolicyIcon(job.remotePolicy)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sağ Panel: Form */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
        {!isCreating && !selectedJob ? (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <p style={{ color: '#6B7280', marginBottom: 20 }}>{t('jobsPage.selectOrCreate')}</p>
            <button
              onClick={handleCreateNew}
              className="btn-primary"
            >
              {t('jobsPage.createNewJob')}
            </button>
          </div>
        ) : (
          <JobForm
            job={selectedJob}
            departments={departments}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        )}
      </div>

      {/* Yeni İlan Butonu (Sol Alt) */}
      {!isCreating && !selectedJob && (
        <button
          onClick={handleCreateNew}
          style={{
            position: 'fixed',
            bottom: 24,
            left: 284,
            width: 200,
            padding: '12px 20px',
            background: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
          }}
        >
          {t('jobsPage.createNewJob')}
        </button>
      )}
    </div>
  );
};

export default JobsPage;
