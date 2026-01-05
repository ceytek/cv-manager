import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@apollo/client/react';
import { Brain, List, LayoutGrid, MapPin, Briefcase, Users, Eye, Calendar } from 'lucide-react';
import { JOBS_QUERY } from '../../graphql/jobs';

// Simple Jobs Overview list for CV Evaluation module
const JobsOverview = ({ onGoToAIEvaluation, onOpenDetails }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-US' : 'tr-TR';
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  
  const { data, loading, error } = useQuery(JOBS_QUERY, {
    variables: { includeInactive: false },
    fetchPolicy: 'cache-and-network',
  });

  if (loading) return <div style={{ padding: 24 }}>{t('common.loading')}</div>;
  if (error) return <div style={{ padding: 24, color: '#DC2626' }}>{t('common.error')}: {error.message}</div>;

  const jobs = data?.jobs || [];

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
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
                  
                  <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
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
              <div style={{ color: '#6B7280', fontSize: 13 }}>{job.department?.name || '-'}</div>
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
