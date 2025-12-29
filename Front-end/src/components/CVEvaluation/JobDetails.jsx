import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@apollo/client/react';
import { Video, FileText, MoreVertical, Clock, BarChart2, Download, Eye } from 'lucide-react';
import { APPLICATIONS_QUERY } from '../../graphql/applications';
import CandidateDetailModal from './CandidateDetailModal';
import LikertResultsModal from './LikertResultsModal';
import InterviewResultsModal from './InterviewResultsModal';
import CandidateHistoryModal from './CandidateHistoryModal';

// Reuse data coming from parent job
const JobDetails = ({ job, onBack }) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  
  // Modal states
  const [showLikertResults, setShowLikertResults] = useState(false);
  const [showInterviewResults, setShowInterviewResults] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

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

  // Get the latest session status for display
  // Priority: Likert first (since it's typically done after interview), then Interview
  const getLatestSessionStatus = (app) => {
    // Likert takes priority if it exists and has any status
    if (app.likertSessionStatus === 'completed') {
      return { text: t('jobDetails.sessionStatus.likertCompleted'), color: '#10B981', bg: '#D1FAE5' };
    }
    if (app.likertSessionStatus === 'in_progress') {
      return { text: t('jobDetails.sessionStatus.likertInProgress'), color: '#3B82F6', bg: '#DBEAFE' };
    }
    if (app.hasLikertSession && app.likertSessionStatus === 'pending') {
      return { text: t('jobDetails.sessionStatus.likertSent'), color: '#8B5CF6', bg: '#EDE9FE' };
    }
    if (app.likertSessionStatus === 'expired') {
      return { text: t('jobDetails.sessionStatus.likertExpired'), color: '#EF4444', bg: '#FEE2E2' };
    }
    
    // Then check Interview status
    if (app.interviewSessionStatus === 'completed') {
      return { text: t('jobDetails.sessionStatus.interviewCompleted'), color: '#10B981', bg: '#D1FAE5' };
    }
    if (app.interviewSessionStatus === 'in_progress') {
      return { text: t('jobDetails.sessionStatus.interviewInProgress'), color: '#3B82F6', bg: '#DBEAFE' };
    }
    if (app.hasInterviewSession && app.interviewSessionStatus === 'pending') {
      return { text: t('jobDetails.sessionStatus.interviewSent'), color: '#8B5CF6', bg: '#EDE9FE' };
    }
    if (app.interviewSessionStatus === 'expired') {
      return { text: t('jobDetails.sessionStatus.interviewExpired'), color: '#EF4444', bg: '#FEE2E2' };
    }
    
    // Default: CV analyzed
    return { text: t('jobDetails.sessionStatus.cvAnalyzed'), color: '#6B7280', bg: '#F3F4F6' };
  };

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
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'visible' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{t('jobDetails.cvAnalyses', { count: applications.length })}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 0.6fr 1.3fr 0.4fr', padding: '12px 16px', background: '#F9FAFB', fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>
          <div>{t('jobDetails.candidate')}</div>
          <div>{t('jobDetails.analysisDate')}</div>
          <div>{t('jobDetails.compatibilityScore')}</div>
          <div></div>
          <div>{t('jobDetails.lastStatus')}</div>
          <div></div>
        </div>

        {loading ? (
          <div style={{ padding: 24 }}>{t('common.loading')}</div>
        ) : error ? (
          <div style={{ padding: 24, color: '#DC2626' }}>{t('common.error')}: {error.message}</div>
        ) : pageItems.length === 0 ? (
          <div style={{ padding: 24, color: '#6B7280' }}>{t('jobDetails.noAnalysisFound')}</div>
        ) : (
          pageItems.map((app) => (
            <div 
              key={app.id} 
              style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 0.6fr 1.3fr 0.4fr', padding: '16px', borderBottom: '1px solid #E5E7EB', alignItems: 'center' }}
              onMouseLeave={() => setOpenMenuId(null)}
            >
              <div style={{ color: '#111827', fontWeight: 600 }}>{app.candidate?.name || '—'}</div>
              <div style={{ color: '#6B7280', fontSize: 13 }}>{app.analyzedAt ? new Date(app.analyzedAt).toLocaleDateString('tr-TR') : '-'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${app.overallScore || 0}%`, height: '100%', background: getScoreColor(app.overallScore || 0) }} />
                </div>
                <span style={{ minWidth: 36, textAlign: 'right', fontWeight: 700, color: getScoreColor(app.overallScore || 0), fontSize: 14 }}>{app.overallScore || 0}%</span>
              </div>
              
              {/* Session Icons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 12 }}>
                {app.hasInterviewSession && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedApp(app);
                      setShowInterviewResults(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 28,
                      height: 28,
                      padding: 0,
                      background: app.interviewSessionStatus === 'completed' ? '#D1FAE5' : '#F3F4F6',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      color: app.interviewSessionStatus === 'completed' ? '#10B981' : '#1F2937',
                    }}
                    title={app.interviewSessionStatus === 'completed' ? t('jobDetails.sessionStatus.interviewCompleted') : t('jobDetails.sessionStatus.interviewSent')}
                  >
                    <Video size={14} />
                  </button>
                )}
                {app.hasLikertSession && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedApp(app);
                      setShowLikertResults(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 28,
                      height: 28,
                      padding: 0,
                      background: app.likertSessionStatus === 'completed' ? '#D1FAE5' : '#F3F4F6',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      color: app.likertSessionStatus === 'completed' ? '#10B981' : '#1F2937',
                    }}
                    title={app.likertSessionStatus === 'completed' ? t('jobDetails.sessionStatus.likertCompleted') : t('jobDetails.sessionStatus.likertSent')}
                  >
                    <FileText size={14} />
                  </button>
                )}
              </div>
              
              {/* Son Durum Text */}
              <div>
                {(() => {
                  const status = getLatestSessionStatus(app);
                  return (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '4px 12px',
                      background: status.bg,
                      color: status.color,
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}>
                      {status.text}
                    </span>
                  );
                })()}
              </div>
              
              {/* Actions - 3-dot Menu */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setOpenMenuId(openMenuId === app.id ? null : app.id)}
                    style={{
                      padding: 6,
                      background: openMenuId === app.id ? '#F3F4F6' : 'transparent',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      display: 'flex',
                    }}
                  >
                    <MoreVertical size={16} color="#6B7280" />
                  </button>
                  
                  {openMenuId === app.id && (
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      bottom: '100%',
                      marginBottom: 4,
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: 8,
                      boxShadow: '0 -4px 15px -3px rgba(0,0,0,0.1)',
                      zIndex: 1000,
                      minWidth: 180,
                      overflow: 'hidden',
                    }}>
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          setSelectedApp(app);
                          setShowHistory(true);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          width: '100%',
                          padding: '10px 16px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 14,
                          color: '#374151',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#F9FAFB'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        <Clock size={16} color="#6B7280" />
                        {t('jobDetails.viewHistory')}
                      </button>
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          setSelectedCandidate({
                            id: app.id,
                            applicationId: app.id,
                            candidateId: app.candidateId,
                            candidateName: app.candidate?.name,
                            score: app.overallScore || 0,
                            analysisData: app.analysisData || {},
                            candidate: app.candidate,
                          });
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          width: '100%',
                          padding: '10px 16px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 14,
                          color: '#374151',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#F9FAFB'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        <BarChart2 size={16} color="#6B7280" />
                        {t('jobDetails.viewAnalysis')}
                      </button>
                      {app.candidate?.cvFilePath && (
                        <a
                          href={app.candidate.cvFilePath}
                          download
                          onClick={() => setOpenMenuId(null)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            width: '100%',
                            padding: '10px 16px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 14,
                            color: '#374151',
                            textAlign: 'left',
                            textDecoration: 'none',
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#F9FAFB'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                          <Download size={16} color="#6B7280" />
                          {t('jobDetails.downloadCV')}
                        </a>
                      )}
                    </div>
                  )}
                </div>
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
      
      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <CandidateDetailModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          jobId={job?.id}
          application={selectedCandidate}
        />
      )}
      
      {/* Likert Results Modal */}
      {showLikertResults && selectedApp && (
        <LikertResultsModal
          isOpen={showLikertResults}
          onClose={() => {
            setShowLikertResults(false);
            setSelectedApp(null);
          }}
          applicationId={selectedApp.id}
          candidateName={selectedApp.candidate?.name}
          jobTitle={job?.title}
        />
      )}
      
      {/* Interview Results Modal */}
      {showInterviewResults && selectedApp && (
        <InterviewResultsModal
          isOpen={showInterviewResults}
          onClose={() => {
            setShowInterviewResults(false);
            setSelectedApp(null);
          }}
          applicationId={selectedApp.id}
          candidateName={selectedApp.candidate?.name}
          jobTitle={job?.title}
        />
      )}
      
      {/* Candidate History Modal */}
      {showHistory && selectedApp && (
        <CandidateHistoryModal
          isOpen={showHistory}
          onClose={() => {
            setShowHistory(false);
            setSelectedApp(null);
          }}
          applicationId={selectedApp.id}
          candidateName={selectedApp.candidate?.name}
          jobTitle={job?.title}
          applicationData={selectedApp}
          onViewLikertResults={() => {
            setShowHistory(false);
            setShowLikertResults(true);
          }}
          onViewInterviewResults={() => {
            setShowHistory(false);
            setShowInterviewResults(true);
          }}
        />
      )}
    </div>
  );
};

export default JobDetails;
