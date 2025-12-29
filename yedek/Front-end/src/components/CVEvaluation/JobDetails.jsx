import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@apollo/client/react';
import { APPLICATIONS_QUERY } from '../../graphql/applications';
import CandidateDetailModal from './CandidateDetailModal';

// Reuse data coming from parent job
const JobDetails = ({ job, onBack }) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const { data, loading, error } = useQuery(APPLICATIONS_QUERY, {
    variables: { jobId: job?.id },
    skip: !job?.id,
    fetchPolicy: 'cache-and-network',
  });

  const applications = data?.applications || [];
  const departmentName = job?.department?.name || '-';
  const totalPages = Math.max(1, Math.ceil(applications.length / pageSize));
  const pageItems = useMemo(() => applications.slice((page - 1) * pageSize, page * pageSize), [applications, page]);

  const badge = (label, bg, color) => (
    <span style={{ background: bg, color, padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{label}</span>
  );

  const statusBadge = (s) => {
    const v = (s || '').toLowerCase();
    if (v === 'analyzed' || v === 'accepted') return badge(t('jobDetails.statusEvaluated'), '#D1FAE5', '#065F46');
    if (v === 'rejected') return badge(t('jobDetails.statusRejected'), '#FEE2E2', '#991B1B');
    if (v === 'reviewed') return badge(t('jobDetails.statusReviewed'), '#DBEAFE', '#1E3A8A');
    return badge(t('jobDetails.statusPending'), '#FEF3C7', '#92400E');
  };

  const getScoreColor = (n) => (n >= 80 ? '#10B981' : n >= 60 ? '#F59E0B' : '#EF4444');

  return (
    <div style={{ padding: 24 }}>
      <button onClick={onBack} style={{ padding: '8px 16px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', fontSize: 14, marginBottom: 16 }}>{t('jobDetails.backToJobs')}</button>

      {/* Job header */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, marginBottom: 8 }}>{job?.title}</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, color: '#374151', fontSize: 14, marginBottom: 12 }}>
          <div>
            <div style={{ color: '#6B7280', fontSize: 12 }}>{t('jobDetails.location')}</div>
            <div>{job?.location || '-'}</div>
          </div>
          <div>
            <div style={{ color: '#6B7280', fontSize: 12 }}>{t('jobDetails.employmentType')}</div>
            <div>{job?.employmentType || '-'}</div>
          </div>
          <div>
            <div style={{ color: '#6B7280', fontSize: 12 }}>{t('jobDetails.department')}</div>
            <div>{departmentName}</div>
          </div>
        </div>
        <div style={{ color: '#111827', fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>
          <div style={{ color: '#6B7280', fontSize: 12, marginBottom: 6 }}>{t('jobDetails.jobDescription')}</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{job?.descriptionPlain || job?.description || '-'}</div>
        </div>
        {Array.isArray(job?.keywords) && job.keywords.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ color: '#6B7280', fontSize: 12, marginBottom: 6 }}>{t('jobDetails.keywords')}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {job.keywords.map((k, i) => (
                <span key={i} style={{ background: '#EFF6FF', color: '#1E40AF', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{k}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Applications list */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{t('jobDetails.cvAnalyses', { count: applications.length })}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '12px 16px', background: '#F9FAFB', fontSize: 12, fontWeight: 700, color: '#6B7280' }}>
          <div>{t('jobDetails.candidate')}</div>
          <div>{t('jobDetails.analysisDate')}</div>
          <div>{t('jobDetails.compatibilityScore')}</div>
          <div>{t('jobDetails.status')}</div>
          <div>{t('jobDetails.actions')}</div>
        </div>

        {loading ? (
          <div style={{ padding: 24 }}>{t('common.loading')}</div>
        ) : error ? (
          <div style={{ padding: 24, color: '#DC2626' }}>{t('common.error')}: {error.message}</div>
        ) : pageItems.length === 0 ? (
          <div style={{ padding: 24, color: '#6B7280' }}>{t('jobDetails.noAnalysisFound')}</div>
        ) : (
          pageItems.map((app) => (
            <div key={app.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '16px', borderBottom: '1px solid #E5E7EB', alignItems: 'center' }}>
              <div style={{ color: '#111827', fontWeight: 600 }}>{app.candidate?.name || '—'}</div>
              <div style={{ color: '#6B7280' }}>{app.analyzedAt ? new Date(app.analyzedAt).toLocaleDateString('tr-TR') : '-'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${app.overallScore || 0}%`, height: '100%', background: getScoreColor(app.overallScore || 0) }} />
                </div>
                <span style={{ minWidth: 40, textAlign: 'right', fontWeight: 700, color: getScoreColor(app.overallScore || 0) }}>{app.overallScore || 0}%</span>
              </div>
              <div>{statusBadge(app.status)}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setSelectedCandidate({
                    id: app.id,
                    applicationId: app.id,
                    candidateId: app.candidateId,
                    candidateName: app.candidate?.name,
                    score: app.overallScore || 0,
                    analysisData: app.analysisData || {},
                    candidate: app.candidate,
                  })}
                  style={{ padding: '6px 10px', border: 'none', background: 'transparent', color: '#2563EB', fontWeight: 600, cursor: 'pointer' }}
                >
                  {t('jobDetails.viewAnalysis')}
                </button>
                <button style={{ padding: '6px 10px', border: 'none', background: 'transparent', color: '#2563EB', fontWeight: 600, cursor: 'pointer' }}>{t('jobDetails.viewCV')}</button>
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {applications.length > pageSize && (
          <div style={{ padding: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 6, background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>{t('jobDetails.previous')}</button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} style={{ padding: '8px 12px', border: page === i + 1 ? 'none' : '1px solid #E5E7EB', borderRadius: 6, background: page === i + 1 ? '#3B82F6' : 'white', color: page === i + 1 ? 'white' : '#374151', cursor: 'pointer', fontWeight: page === i + 1 ? 700 : 400 }}>{i + 1}</button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 6, background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>{t('jobDetails.next')}</button>
          </div>
        )}
      </div>
      {selectedCandidate && (
        <CandidateDetailModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          jobId={job?.id}
          application={selectedCandidate}
        />
      )}
    </div>
  );
};

export default JobDetails;