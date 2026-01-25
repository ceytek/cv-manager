import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@apollo/client/react';
import { Brain, List, LayoutGrid, MapPin, Briefcase, Users, Eye, Calendar, Search, Filter, ChevronDown, X } from 'lucide-react';
import { JOBS_QUERY } from '../../graphql/jobs';
import { DEPARTMENTS_QUERY } from '../../graphql/departments';

// Simple Jobs Overview list for CV Evaluation module
const JobsOverview = ({ onGoToAIEvaluation, onOpenDetails }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-US' : 'tr-TR';
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatuses, setSelectedStatuses] = useState(['active', 'closed', 'archived']); // Default: exclude 'draft'
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  
  const { data, loading, error } = useQuery(JOBS_QUERY, {
    variables: { includeInactive: true }, // Get all jobs including drafts, we'll filter client-side
    fetchPolicy: 'cache-and-network',
  });

  const { data: departmentsData } = useQuery(DEPARTMENTS_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  const allJobs = data?.jobs || [];
  const departments = departmentsData?.departments || [];

  // Available statuses
  const statusOptions = [
    { value: 'active', label: t('cvEvaluation.statusActive', 'Aktif') },
    { value: 'draft', label: t('cvEvaluation.statusDraft', 'Taslak') },
    { value: 'closed', label: t('cvEvaluation.statusClosed', 'Kapalı') },
    { value: 'archived', label: t('cvEvaluation.statusArchived', 'Arşivlenmiş') },
  ];

  // Filter and sort jobs
  const jobs = useMemo(() => {
    let filtered = allJobs;

    // Filter by search term (job title)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(job => 
        job.title?.toLowerCase().includes(term)
      );
    }

    // Filter by department
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(job => job.department?.id === selectedDepartment);
    }

    // Filter by status
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(job => selectedStatuses.includes(job.status));
    }

    // Sort by application count (most to least)
    filtered = [...filtered].sort((a, b) => (b.analysisCount || 0) - (a.analysisCount || 0));

    return filtered;
  }, [allJobs, searchTerm, selectedDepartment, selectedStatuses]);

  const toggleStatus = (status) => {
    if (selectedStatuses.includes(status)) {
      // Don't allow deselecting all statuses
      if (selectedStatuses.length > 1) {
        setSelectedStatuses(selectedStatuses.filter(s => s !== status));
      }
    } else {
      setSelectedStatuses([...selectedStatuses, status]);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('all');
    setSelectedStatuses(['active', 'closed', 'archived']);
  };

  const hasActiveFilters = searchTerm || selectedDepartment !== 'all' || !selectedStatuses.includes('active') || selectedStatuses.includes('draft') || selectedStatuses.length !== 3;

  if (loading) return <div style={{ padding: 24 }}>{t('common.loading')}</div>;
  if (error) return <div style={{ padding: 24, color: '#DC2626' }}>{t('common.error')}: {error.message}</div>;

  const getStatusBadge = (status) => {
    const styles = {
      active: { bg: '#D1FAE5', color: '#065F46', label: t('cvEvaluation.statusActive') },
      draft: { bg: '#FEF3C7', color: '#92400E', label: t('cvEvaluation.statusDraft') },
      closed: { bg: '#FEE2E2', color: '#991B1B', label: t('cvEvaluation.statusClosed') },
      archived: { bg: '#E5E7EB', color: '#374151', label: t('cvEvaluation.statusArchived') },
    };
    const s = styles[status] || styles.draft;
    return (
      <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: 14, fontSize: 12, fontWeight: 600 }}>
        {s.label}
      </span>
    );
  };

  // Generate avatar color based on initials
  const getAvatarColor = (initials) => {
    const colors = ['#6B7280', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    const index = initials ? (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % colors.length : 0;
    return colors[index];
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>{t('cvEvaluation.jobsOverviewTitle')}</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
          
          <button
            onClick={onGoToAIEvaluation}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Brain size={18} />
            {t('cvEvaluation.aiPoweredEvaluation')}
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ 
        display: 'flex', 
        gap: 12, 
        marginBottom: 20, 
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: '16px 20px',
        background: '#F9FAFB',
        borderRadius: 12,
        border: '1px solid #E5E7EB',
      }}>
        {/* Search by Name */}
        <div style={{ position: 'relative', flex: '1 1 250px', maxWidth: 300 }}>
          <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('cvEvaluation.searchByName', 'İlan adına göre ara...')}
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              fontSize: 14,
              outline: 'none',
              background: 'white',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
            onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={14} color="#9CA3AF" />
            </button>
          )}
        </div>

        {/* Department Filter */}
        <div style={{ position: 'relative', minWidth: 180 }}>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 32px 10px 12px',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              fontSize: 14,
              outline: 'none',
              background: 'white',
              cursor: 'pointer',
              appearance: 'none',
              color: selectedDepartment === 'all' ? '#6B7280' : '#111827',
            }}
          >
            <option value="all">{t('cvEvaluation.allDepartments', 'Tüm Departmanlar')}</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
          <ChevronDown size={16} color="#6B7280" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>

        {/* Status Filter (Multi-select dropdown) */}
        <div style={{ position: 'relative', minWidth: 160 }}>
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            style={{
              width: '100%',
              padding: '10px 32px 10px 12px',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              fontSize: 14,
              outline: 'none',
              background: 'white',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#111827',
            }}
          >
            <Filter size={14} color="#6B7280" />
            {t('cvEvaluation.status', 'Durum')} ({selectedStatuses.length})
          </button>
          <ChevronDown size={16} color="#6B7280" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          
          {showStatusDropdown && (
            <>
              <div 
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
                onClick={() => setShowStatusDropdown(false)}
              />
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 4,
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 100,
                minWidth: 180,
                padding: '8px 0',
              }}>
                {statusOptions.map(status => (
                  <label
                    key={status.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 14px',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: '#374151',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(status.value)}
                      onChange={() => toggleStatus(status.value)}
                      style={{ 
                        width: 16, 
                        height: 16, 
                        accentColor: '#3B82F6',
                        cursor: 'pointer',
                      }}
                    />
                    {status.label}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              padding: '10px 14px',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              background: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#6B7280',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#FECACA'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
          >
            <X size={14} />
            {t('cvEvaluation.clearFilters', 'Filtreleri Temizle')}
          </button>
        )}

        {/* Results Count */}
        <div style={{ marginLeft: 'auto', fontSize: 13, color: '#6B7280' }}>
          {jobs.length} {t('cvEvaluation.jobsFound', 'ilan bulundu')}
        </div>
      </div>

      {jobs.length === 0 ? (
        <div style={{ 
          padding: 60, 
          textAlign: 'center', 
          background: 'white', 
          borderRadius: 12, 
          border: '1px solid #E5E7EB' 
        }}>
          <Users size={48} color="#D1D5DB" style={{ marginBottom: 16 }} />
          <p style={{ color: '#6B7280', fontSize: 16 }}>{t('cvEvaluation.noJobs')}</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ============ GRID VIEW ============ */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {jobs.map((job) => {
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
                {/* Card Header */}
                <div style={{ 
                  padding: '16px 20px', 
                  borderBottom: '1px solid #F3F4F6',
                  background: '#FAFAFA',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  {getStatusBadge(job.status)}
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                    <Calendar size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                    {new Date(job.createdAt).toLocaleDateString(locale)}
                  </span>
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
                  
                  <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {job.department && (
                      <span style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: job.department.color || '#6B7280',
                        flexShrink: 0,
                      }} />
                    )}
                    {job.department?.name || '-'}
                  </p>
                  
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
                                background: getAvatarColor(initials),
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
                          {applicantCount} {t('cvEvaluation.applicant', 'Başvuru')}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                        {t('cvEvaluation.noApplications')}
                      </span>
                    )}
                    
                    <button
                      onClick={() => onOpenDetails && onOpenDetails(job)}
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
                      {t('cvEvaluation.view', 'Görüntüle')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ============ LIST VIEW ============ */
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '2fr 1fr 1fr 1fr 100px 100px', 
            padding: '14px 16px', 
            background: '#F9FAFB', 
            borderBottom: '1px solid #E5E7EB', 
            fontSize: 12, 
            fontWeight: 700, 
            color: '#6B7280',
            textTransform: 'uppercase',
          }}>
            <div>{t('cvEvaluation.jobName')}</div>
            <div>{t('jobDetails.department')}</div>
            <div>{t('cvEvaluation.publishDate')}</div>
            <div>{t('cvEvaluation.completedAnalyses')}</div>
            <div>{t('cvEvaluation.status')}</div>
            <div>{t('cvEvaluation.operations')}</div>
          </div>
          {jobs.map((job) => (
            <div key={job.id} style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1fr 1fr 1fr 100px 100px', 
              padding: '16px', 
              borderBottom: '1px solid #E5E7EB', 
              alignItems: 'center' 
            }}>
              <div style={{ fontWeight: 600, color: '#111827' }}>{job.title}</div>
              <div style={{ color: '#6B7280', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                {job.department && (
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: job.department.color || '#6B7280',
                    flexShrink: 0,
                  }} />
                )}
                {job.department?.name || '-'}
              </div>
              <div style={{ color: '#6B7280' }}>{new Date(job.createdAt).toLocaleDateString(locale)}</div>
              
              {/* Applicants with Avatars */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {(job.analysisCount || 0) > 0 ? (
                  <>
                    <div style={{ display: 'flex' }}>
                      {(job.recentApplicants || []).slice(0, 2).map((initials, i) => (
                        <div
                          key={i}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: getAvatarColor(initials),
                            border: '2px solid white',
                            marginLeft: i > 0 ? -8 : 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: 9,
                            fontWeight: 600,
                            zIndex: 2 - i,
                          }}
                        >
                          {initials}
                        </div>
                      ))}
                      {(job.analysisCount || 0) > 2 && (
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: '#F59E0B',
                          border: '2px solid white',
                          marginLeft: -8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: 9,
                          fontWeight: 600,
                        }}>
                          +{(job.analysisCount || 0) - 2}
                        </div>
                      )}
                    </div>
                    <span style={{ fontWeight: 600, color: '#111827', fontSize: 13 }}>
                      {job.analysisCount}
                    </span>
                  </>
                ) : (
                  <span style={{ color: '#9CA3AF', fontSize: 13 }}>
                    {t('cvEvaluation.noApplications')}
                  </span>
                )}
              </div>
              
              <div>{getStatusBadge(job.status)}</div>
              <div>
                <button
                  onClick={() => onOpenDetails && onOpenDetails(job)}
                  style={{
                    padding: '6px 12px',
                    background: 'transparent',
                    color: '#2563EB',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t('cvEvaluation.viewDetails')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobsOverview;
