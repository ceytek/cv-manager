import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@apollo/client/react';
import { JOBS_QUERY } from '../../graphql/jobs';

// Simple Jobs Overview list for CV Evaluation module
const JobsOverview = ({ onBack, onOpenDetails }) => {
  const { t } = useTranslation();
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

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', fontSize: 14
          }}
        >{t('common.back')}</button>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>{t('cvEvaluation.jobsOverviewTitle')}</h1>
        <div />
      </div>

      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '14px 16px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', fontSize: 12, fontWeight: 700, color: '#6B7280' }}>
          <div>{t('cvEvaluation.jobName')}</div>
          <div>{t('cvEvaluation.publishDate')}</div>
          <div>{t('cvEvaluation.completedAnalyses')}</div>
          <div>{t('cvEvaluation.status')}</div>
          <div>{t('cvEvaluation.operations')}</div>
        </div>
        {jobs.length === 0 ? (
          <div style={{ padding: 24, color: '#6B7280' }}>{t('cvEvaluation.noJobs')}</div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '16px', borderBottom: '1px solid #E5E7EB', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, color: '#111827' }}>{job.title}</div>
              <div style={{ color: '#6B7280' }}>{new Date(job.createdAt).toLocaleDateString('tr-TR')}</div>
              <div style={{ color: '#111827', fontWeight: 600 }}>{job.analysisCount ?? 0}</div>
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
