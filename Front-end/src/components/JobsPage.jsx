/**
 * Jobs Page - İş İlanları Yönetimi
 * 3. resim tasarımına göre düzenlendi
 */
import React, { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { JOBS_QUERY } from '../graphql/jobs';
import { Search, MapPin, Users, Calendar, Sparkles, FileText, Eye, Video, ListChecks, Edit2, Trash2, Briefcase, Clock, Building2, X, List, LayoutGrid } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobFormModal, setShowJobFormModal] = useState(false);
  const [showAICreator, setShowAICreator] = useState(false);
  const [aiGeneratedData, setAiGeneratedData] = useState(null);
  const [previewJob, setPreviewJob] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [interviewSettingsJob, setInterviewSettingsJob] = useState(null);
  const [likertSettingsJob, setLikertSettingsJob] = useState(null);

  // When initialCreate is true, show job form modal
  useEffect(() => {
    if (initialCreate) {
      setShowJobFormModal(true);
    }
  }, [initialCreate]);

  // Fetch jobs
  const { data, loading, error, refetch } = useQuery(JOBS_QUERY, {
    variables: {
      includeInactive: activeFilter === 'archived',
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

  const handleEditJob = (job, e) => {
    e?.stopPropagation();
    setSelectedJob(job);
    setShowJobFormModal(true);
  };

  const handleCreateNew = () => {
    setSelectedJob(null);
    setAiGeneratedData(null);
    setShowJobFormModal(true);
  };

  const handleCreateWithAI = () => {
    setShowAICreator(true);
  };

  const handleAIGenerate = (formData) => {
    console.log('AI Generated Job Data:', formData);
    setAiGeneratedData(formData);
    setSelectedJob(null);
    setShowJobFormModal(true);
    setShowAICreator(false);
  };

  const handleFormSuccess = () => {
    refetch();
    setShowJobFormModal(false);
    setSelectedJob(null);
    setAiGeneratedData(null);
  };

  const handleFormCancel = () => {
    setShowJobFormModal(false);
    setSelectedJob(null);
    setAiGeneratedData(null);
  };

  const handlePreview = (job, e) => {
    e?.stopPropagation();
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
      active: { label: t('jobsPage.statusActive'), bg: '#DCFCE7', color: '#16A34A' },
      draft: { label: t('jobsPage.statusDraft'), bg: '#FEF3C7', color: '#D97706' },
      closed: { label: t('jobsPage.statusClosed'), bg: '#FEE2E2', color: '#DC2626' },
      archived: { label: t('jobsPage.statusArchived'), bg: '#F3F4F6', color: '#6B7280' },
    };
    const badge = badges[status] || badges.draft;
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        background: badge.bg,
        color: badge.color,
      }}>
        {badge.label}
      </span>
    );
  };

  // Remote policy display
  const getRemotePolicyDisplay = (policy) => {
    if (policy === 'remote') return { icon: '🌐', label: 'Remote' };
    if (policy === 'hybrid') return { icon: '🔀', label: 'Hybrid' };
    return { icon: '🏢', label: 'Office' };
  };

  // Employment type display
  const getEmploymentType = (type) => {
    const types = {
      'full-time': t('jobsPage.fullTime', 'Tam Zamanlı'),
      'part-time': t('jobsPage.partTime', 'Yarı Zamanlı'),
      'contract': t('jobsPage.contract', 'Sözleşmeli'),
      'intern': t('jobsPage.intern', 'Stajyer'),
    };
    return types[type] || type;
  };

  // Generate avatar colors for applicants
  const avatarColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899'];

  if (loading && jobs.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div style={{ textAlign: 'center', color: '#6B7280' }}>
          <div className="spinner" style={{ marginBottom: 16 }}></div>
          {t('jobsPage.loading')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div style={{ textAlign: 'center', color: '#DC2626' }}>
          {t('jobsPage.error', { message: error.message })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: 24,
      }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1F2937', marginBottom: 8 }}>
            {t('jobsPage.pageTitle', 'İş İlanları Yönetimi')}
          </h1>
          <p style={{ color: '#6B7280', fontSize: 14 }}>
            {t('jobsPage.pageSubtitle', 'Aktif iş ilanlarını yönetin ve yeni pozisyonlar oluşturun.')}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          {/* Create New Job Button */}
          <button
            onClick={handleCreateNew}
            style={{
              padding: '12px 20px',
              background: 'white',
              border: '2px solid #3B82F6',
              borderRadius: 10,
              color: '#3B82F6',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#EFF6FF'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            <FileText size={18} />
            {t('jobsPage.createNewJob', 'Create New Job')}
          </button>

          {/* Create with AI Button */}
          <button
            onClick={handleCreateWithAI}
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'}
          >
            <Sparkles size={18} />
            {t('jobsPage.createAIJob', 'Create with AI')}
          </button>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 24,
        gap: 24,
      }}>
        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              style={{
                padding: '10px 20px',
                borderRadius: 25,
                border: activeFilter === f.id ? '2px solid #3B82F6' : '2px solid transparent',
                background: activeFilter === f.id ? '#EFF6FF' : '#F9FAFB',
                color: activeFilter === f.id ? '#3B82F6' : '#6B7280',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {f.label}
              {f.count > 0 && (
                <span style={{
                  background: activeFilter === f.id ? '#3B82F6' : '#E5E7EB',
                  color: activeFilter === f.id ? 'white' : '#6B7280',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: 320 }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder={t('jobsPage.searchPlaceholder', 'İlan başlığı, departman veya anahtar kelime ara...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 44px',
                border: '1px solid #E5E7EB',
                borderRadius: 10,
                fontSize: 14,
                background: '#F9FAFB',
                outline: 'none',
              }}
            />
          </div>
          
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 8, padding: 4 }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '8px 12px',
                background: viewMode === 'list' ? 'white' : 'transparent',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 500,
                color: viewMode === 'list' ? '#111827' : '#6B7280',
                boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <List size={16} />
              {t('jobsPage.listView', 'Liste')}
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '8px 12px',
                background: viewMode === 'grid' ? 'white' : 'transparent',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 500,
                color: viewMode === 'grid' ? '#111827' : '#6B7280',
                boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <LayoutGrid size={16} />
              {t('jobsPage.gridView', 'Kart')}
            </button>
          </div>
        </div>
      </div>

      {/* Job Cards */}
      {jobs.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 60, 
          background: 'white',
          borderRadius: 16,
          border: '1px solid #E5E7EB',
        }}>
          <Briefcase size={48} color="#D1D5DB" style={{ marginBottom: 16 }} />
          <p style={{ color: '#6B7280', fontSize: 16 }}>{t('jobsPage.noJobsFound')}</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ============ GRID VIEW ============ */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {jobs.map(job => {
            const remotePolicy = getRemotePolicyDisplay(job.remotePolicy);
            const applicantCount = job.analysisCount || 0;
            
            return (
              <div
                key={job.id}
                style={{
                  background: 'white',
                  borderRadius: 16,
                  border: '1px solid #E5E7EB',
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = '#3B82F6';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Card Header with Status */}
                <div style={{ 
                  padding: '16px 20px', 
                  borderBottom: '1px solid #F3F4F6',
                  background: '#FAFAFA',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {getStatusBadge(job.status)}
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={(e) => handleEditJob(job, e)}
                        style={{
                          padding: 6,
                          background: 'transparent',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          color: '#6B7280',
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Card Body */}
                <div style={{ padding: 20 }}>
                  <h3 style={{ 
                    fontSize: 16, 
                    fontWeight: 600, 
                    color: '#1F2937', 
                    margin: 0, 
                    marginBottom: 8,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {job.title}
                  </h3>
                  
                  <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
                    {getDepartmentName(job.departmentId)}
                  </p>
                  
                  {/* Info Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      background: '#F3F4F6', 
                      borderRadius: 6, 
                      fontSize: 11, 
                      color: '#6B7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      <MapPin size={12} /> {job.location || '-'}
                    </span>
                    <span style={{ 
                      padding: '4px 10px', 
                      background: '#F3F4F6', 
                      borderRadius: 6, 
                      fontSize: 11, 
                      color: '#6B7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      <Briefcase size={12} /> {getEmploymentType(job.employmentType)}
                    </span>
                  </div>
                  
                  {/* Applicants */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    paddingTop: 16,
                    borderTop: '1px solid #F3F4F6',
                  }}>
                    {applicantCount > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ display: 'flex' }}>
                          {(job.recentApplicants || []).slice(0, 2).map((initials, i) => (
                            <div
                              key={i}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: avatarColors[i % avatarColors.length],
                                border: '2px solid white',
                                marginLeft: i > 0 ? -8 : 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: 9,
                                fontWeight: 600,
                              }}
                            >
                              {initials}
                            </div>
                          ))}
                          {applicantCount > 2 && (
                            <div style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              background: '#F3F4F6',
                              border: '2px solid white',
                              marginLeft: -8,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#6B7280',
                              fontSize: 9,
                              fontWeight: 600,
                            }}>
                              +{applicantCount - 2}
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                          {applicantCount} {t('jobsPage.applicants', 'Başvuru')}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                        {t('jobsPage.noApplicants', 'Henüz başvuru yok')}
                      </span>
                    )}
                    
                    <button
                      onClick={(e) => handlePreview(job, e)}
                      style={{
                        padding: '6px 12px',
                        background: '#3B82F6',
                        border: 'none',
                        borderRadius: 6,
                        color: 'white',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Eye size={14} />
                      {t('jobsPage.view', 'Görüntüle')}
                    </button>
                  </div>
                </div>
                
                {/* Card Footer Actions */}
                <div style={{ 
                  display: 'flex', 
                  borderTop: '1px solid #F3F4F6',
                }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setInterviewSettingsJob(job); }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: job.interviewEnabled ? '#EFF6FF' : 'transparent',
                      border: 'none',
                      borderRight: '1px solid #F3F4F6',
                      color: job.interviewEnabled ? '#2563EB' : '#6B7280',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'all 0.15s',
                    }}
                  >
                    <Video size={14} />
                    Interview
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setLikertSettingsJob(job); }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: job.likertEnabled ? '#FDF2F8' : 'transparent',
                      border: 'none',
                      color: job.likertEnabled ? '#DB2777' : '#6B7280',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'all 0.15s',
                    }}
                  >
                    <ListChecks size={14} />
                    Likert
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ============ LIST VIEW ============ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {jobs.map(job => {
            const remotePolicy = getRemotePolicyDisplay(job.remotePolicy);
            const applicantCount = job.analysisCount || 0;
            
            return (
              <div
                key={job.id}
                style={{
                  background: 'white',
                  borderRadius: 16,
                  padding: 24,
                  border: '1px solid #E5E7EB',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = '#3B82F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {/* Left: Job Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', margin: 0 }}>
                        {job.title}
                      </h3>
                      {getStatusBadge(job.status)}
                    </div>
                    
                    <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
                      {getDepartmentName(job.departmentId)}
                    </p>
                    
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: '#6B7280' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{remotePolicy.icon}</span> {remotePolicy.label}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={14} /> {job.location}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Briefcase size={14} /> {getEmploymentType(job.employmentType)}
                      </span>
                      {job.deadline && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={14} /> Son: {new Date(job.deadline).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Applicants & Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    {/* Applicants */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {applicantCount > 0 ? (
                        <>
                          <div style={{ display: 'flex' }}>
                            {/* Show real applicant initials (max 2) */}
                            {(job.recentApplicants || []).slice(0, 2).map((initials, i) => (
                              <div
                                key={i}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  background: i === 0 ? '#6B7280' : '#3B82F6',
                                  border: '2px solid white',
                                  marginLeft: i > 0 ? -8 : 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: 10,
                                  fontWeight: 600,
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                }}
                              >
                                {initials}
                              </div>
                            ))}
                            {/* Show +X for remaining */}
                            {applicantCount > 2 && (
                              <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: '#F59E0B',
                                border: '2px solid white',
                                marginLeft: -8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: 10,
                                fontWeight: 600,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              }}>
                                +{applicantCount - 2}
                              </div>
                            )}
                          </div>
                          <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
                            {applicantCount} {t('jobsPage.applicants', 'Başvuru')}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: 13, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Users size={16} /> {t('jobsPage.noApplicants', 'Henüz başvuru yok')}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={(e) => handlePreview(job, e)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          background: '#F3F4F6',
                          border: 'none',
                          borderRadius: 8,
                          color: '#374151',
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Eye size={16} />
                        {t('jobsPage.preview', 'Preview')}
                      </button>
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); setInterviewSettingsJob(job); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          background: job.interviewEnabled ? '#DBEAFE' : '#F3F4F6',
                          border: job.interviewEnabled ? '1px solid #3B82F6' : 'none',
                          borderRadius: 8,
                          color: job.interviewEnabled ? '#2563EB' : '#374151',
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Video size={16} />
                        {t('jobsPage.interview', 'Interview')}
                      </button>
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); setLikertSettingsJob(job); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          background: job.likertEnabled ? '#FDF2F8' : '#F3F4F6',
                          border: job.likertEnabled ? '1px solid #EC4899' : 'none',
                          borderRadius: 8,
                          color: job.likertEnabled ? '#DB2777' : '#374151',
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <ListChecks size={16} />
                        Likert
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={(e) => handleEditJob(job, e)}
                        style={{
                          padding: '8px',
                          background: '#F3F4F6',
                          border: 'none',
                          borderRadius: 8,
                          color: '#6B7280',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        title={t('common.edit', 'Düzenle')}
                      >
                        <Edit2 size={16} />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          padding: '8px',
                          background: '#F3F4F6',
                          border: 'none',
                          borderRadius: 8,
                          color: '#6B7280',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        title={t('common.delete', 'Sil')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Job Form Modal */}
      {showJobFormModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 24,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            width: '100%',
            maxWidth: 800,
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid #E5E7EB',
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
                {selectedJob ? t('jobsPage.editJob', 'İlanı Düzenle') : t('jobsPage.createNewJob', 'Yeni İlan Oluştur')}
              </h2>
              <button
                onClick={handleFormCancel}
                style={{
                  padding: 8,
                  background: '#F3F4F6',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                <X size={20} color="#6B7280" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: 24 }}>
              <JobForm
                job={selectedJob}
                aiData={aiGeneratedData}
                departments={departments}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
                isModal={true}
              />
            </div>
          </div>
        </div>
      )}

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
