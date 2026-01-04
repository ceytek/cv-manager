import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@apollo/client/react';
import { Brain } from 'lucide-react';
import { JOBS_QUERY } from '../../graphql/jobs';

// Simple Jobs Overview list for CV Evaluation module
const JobsOverview = ({ onGoToAIEvaluation, onOpenDetails }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-US' : 'tr-TR';
  
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
        {jobs.length === 0 ? (
          <div style={{ padding: 24, color: '#6B7280' }}>{t('cvEvaluation.noJobs')}</div>
        ) : (
          jobs.map((job) => (
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
          ))
        )}
      </div>
    </div>
  );
};

export default JobsOverview;
