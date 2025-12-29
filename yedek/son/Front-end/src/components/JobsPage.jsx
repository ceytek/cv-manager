/**
 * Jobs Page - Sol Panel: Liste & Kartlar
 * Tamamen modüler yapı - User/Department'tan bağımsız
 */
import React, { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { JOBS_QUERY } from '../graphql/jobs';
import { Search, MapPin, Users, Calendar, Sparkles, FileText, Eye, Video, ListChecks, Edit2 } from 'lucide-react';
import JobForm from './JobForm';
import AIJobCreator from './JobForm/AIJobCreator';
import JobPreviewModal from './JobForm/JobPreviewModal';
import InterviewSettingsModal from './InterviewSettingsModal';
import LikertSettingsModal from './LikertSettingsModal';
import { useTranslation } from 'react-i18next';

const JobsPage = ({ departments = [], initialCreate = false }) => {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showAICreator, setShowAICreator] = useState(false);
  const [aiGeneratedData, setAiGeneratedData] = useState(null);
  const [previewJob, setPreviewJob] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [interviewSettingsJob, setInterviewSettingsJob] = useState(null);
  const [likertSettingsJob, setLikertSettingsJob] = useState(null);

  // When initialCreate is true, just show the selection screen (not opening form directly)
  useEffect(() => {
    if (initialCreate) {
      setSelectedJob(null);
      setIsCreating(false); // Changed from true to false - show selection instead
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

  const handleCreateWithAI = () => {
    setShowAICreator(true);
  };

  const handleAIGenerate = (formData) => {
    console.log('AI Generated Job Data:', formData);
    
    // Store AI-generated data
    setAiGeneratedData(formData);
    
    // Open manual form with AI data pre-filled
    setSelectedJob(null);
    setIsCreating(true);
    setShowAICreator(false);
  };

  const handleFormSuccess = () => {
    refetch();
    setIsCreating(false);
    setSelectedJob(null);
    setAiGeneratedData(null); // Clear AI data after successful save
  };

  const handleFormCancel = () => {
    setIsCreating(false);
    setSelectedJob(null);
    setAiGeneratedData(null); // Clear AI data on cancel
  };

  const handlePreview = (job, e) => {
    e.stopPropagation(); // Prevent card click
    setPreviewJob(job);
    setShowPreview(true);
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
                  position: 'relative'
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
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                      {getRemotePolicyIcon(job.remotePolicy)}
                    </div>
                    {/* Edit icon next to status */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleJobClick(job); }}
                      title={t('common.edit')}
                      style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4 }}
                    >
                      <Edit2 size={14} color="#6B7280" />
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={(e) => handlePreview(job, e)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 10px',
                        background: '#F3F4F6',
                        border: 'none',
                        borderRadius: 6,
                        color: '#6B7280',
                        fontSize: 12,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Eye size={14} />
                      {t('jobsPage.preview')}
                    </button>
                    
                    <button
                      onClick={(e) => { e.stopPropagation(); setInterviewSettingsJob(job); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 10px',
                        background: job.interviewEnabled ? '#D1FAE5' : '#F3F4F6',
                        border: 'none',
                        borderRadius: 6,
                        color: job.interviewEnabled ? '#059669' : '#6B7280',
                        fontSize: 12,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Video size={14} />
                      {t('jobsPage.interview') || 'Mülakat'}
                    </button>
                    
                    <button
                      onClick={(e) => { e.stopPropagation(); setLikertSettingsJob(job); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 10px',
                        background: job.likertEnabled ? '#F3E8FF' : '#F3F4F6',
                        border: 'none',
                        borderRadius: 6,
                        color: job.likertEnabled ? '#7C3AED' : '#6B7280',
                        fontSize: 12,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <ListChecks size={14} />
                      Likert
                    </button>
                  </div>
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
            <p style={{ color: '#6B7280', marginBottom: 32, fontSize: 15 }}>{t('jobsPage.selectOrCreate')}</p>
            
            {/* İki Buton: Manuel ve AI ile İlan Oluştur */}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
              {/* Manuel İlan Oluştur */}
              <button
                onClick={handleCreateNew}
                style={{
                  padding: '14px 28px',
                  background: 'white',
                  border: '2px solid #3B82F6',
                  borderRadius: 12,
                  color: '#3B82F6',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#EFF6FF';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <FileText size={20} />
                {t('jobsPage.createManualJob')}
              </button>

              {/* AI ile İlan Oluştur */}
              <button
                onClick={handleCreateWithAI}
                style={{
                  padding: '14px 28px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: 12,
                  color: 'white',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                }}
              >
                <Sparkles size={20} />
                {t('jobsPage.createAIJob')}
              </button>
            </div>
          </div>
        ) : (
          <JobForm
            job={selectedJob}
            aiData={aiGeneratedData} // Pass AI-generated data to form
            departments={departments}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        )}
      </div>

      {/* AI Job Creator Modal */}
      <AIJobCreator
        isOpen={showAICreator}
        onClose={() => setShowAICreator(false)}
        onGenerate={handleAIGenerate}
      />

      {/* Job Preview Modal */}
      {showPreview && previewJob && (
        <JobPreviewModal
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false);
            setPreviewJob(null);
          }}
          jobData={previewJob}
          departments={departments}
          onPublish={() => {
            // Preview modal sadece görüntüleme için, publish fonksiyonu yok
            setShowPreview(false);
            setPreviewJob(null);
          }}
          isLoading={false}
        />
      )}

      {/* Interview Settings Modal */}
      {interviewSettingsJob && (
        <InterviewSettingsModal
          isOpen={!!interviewSettingsJob}
          onClose={() => setInterviewSettingsJob(null)}
          job={interviewSettingsJob}
          onSuccess={() => {
            refetch();
            setInterviewSettingsJob(null);
          }}
        />
      )}

      {/* Likert Settings Modal */}
      {likertSettingsJob && (
        <LikertSettingsModal
          isOpen={!!likertSettingsJob}
          onClose={() => setLikertSettingsJob(null)}
          job={likertSettingsJob}
          onSuccess={() => {
            refetch();
            setLikertSettingsJob(null);
          }}
        />
      )}
    </div>
  );
};

export default JobsPage;
