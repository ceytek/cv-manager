import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@apollo/client/react';
import { Video, FileText, Clock, BarChart2, Download, Eye, MapPin, Briefcase, Building2, List, LayoutGrid } from 'lucide-react';
import { APPLICATIONS_QUERY } from '../../graphql/applications';
import CandidateDetailModal from './CandidateDetailModal';
import LikertResultsModal from './LikertResultsModal';
import InterviewResultsModal from './InterviewResultsModal';
import CandidateHistoryModal from './CandidateHistoryModal';
import JobPreviewModal from '../JobForm/JobPreviewModal';

// Reuse data coming from parent job
const JobDetails = ({ job, onBack, departments }) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const pageSize = viewMode === 'list' ? 10 : 8; // 8 cards per page (4x2 grid)
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  
  // Modal states
  const [showLikertResults, setShowLikertResults] = useState(false);
  const [showInterviewResults, setShowInterviewResults] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showJobDetail, setShowJobDetail] = useState(false);

  const { data, loading, error, refetch } = useQuery(APPLICATIONS_QUERY, {
    variables: { jobId: job?.id },
    skip: !job?.id,
    fetchPolicy: 'cache-and-network',
  });

  const applications = data?.applications || [];
  const departmentName = job?.department?.name || '-';
  const totalPages = Math.max(1, Math.ceil(applications.length / pageSize));
  const pageItems = useMemo(() => applications.slice((page - 1) * pageSize, page * pageSize), [applications, page, pageSize]);

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
    // Check rejection first (highest priority)
    if (app.status?.toUpperCase() === 'REJECTED' || app.rejectedAt) {
      return { text: t('jobDetails.sessionStatus.rejected', 'Reddedildi'), color: '#DC2626', bg: '#FEE2E2' };
    }
    
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

      {/* Job header - Simplified */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, marginBottom: 12 }}>{job?.title}</h1>
          <button 
            onClick={() => setShowJobDetail(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6, 
              padding: '8px 16px', 
              background: '#3B82F6', 
              color: 'white', 
              border: 'none', 
              borderRadius: 8, 
              cursor: 'pointer', 
              fontSize: 14,
              fontWeight: 500 
            }}
          >
            <Eye size={16} />
            {t('jobDetails.viewDetail')}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 24, color: '#374151', fontSize: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={16} color="#6B7280" />
            <span>{job?.location || '-'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Briefcase size={16} color="#6B7280" />
            <span>{job?.employmentType || '-'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building2 size={16} color="#6B7280" />
            <span>{departmentName}</span>
          </div>
        </div>
      </div>

      {/* Applications list */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'visible' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{t('jobDetails.cvAnalyses', { count: applications.length })}</div>
          
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 8, padding: 4 }}>
            <button
              onClick={() => { setViewMode('list'); setPage(1); }}
              style={{
                padding: '6px 12px',
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
              {t('jobDetails.listView', 'Liste')}
            </button>
            <button
              onClick={() => { setViewMode('grid'); setPage(1); }}
              style={{
                padding: '6px 12px',
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
              {t('jobDetails.gridView', 'Kart')}
            </button>
          </div>
        </div>
        
        {/* Table Header - Only for List View */}
        {viewMode === 'list' && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '2.5fr 1fr 1.4fr 0.5fr 1.3fr 120px', 
            padding: '14px 24px', 
            borderBottom: '1px solid #E5E7EB',
            fontSize: 12, 
            fontWeight: 500, 
            color: '#6B7280',
          }}>
            <div>{t('jobDetails.candidate')}</div>
            <div>{t('jobDetails.analysisDate')}</div>
            <div>{t('jobDetails.compatibilityScore')}</div>
            <div></div>
            <div>{t('jobDetails.lastStatus')}</div>
            <div></div>
          </div>
        )}

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>{t('common.loading')}</div>
        ) : error ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#DC2626' }}>{t('common.error')}: {error.message}</div>
        ) : pageItems.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>{t('jobDetails.noAnalysisFound')}</div>
        ) : viewMode === 'grid' ? (
          /* ============ GRID VIEW ============ */
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: 20, 
            padding: 24,
          }}>
            {pageItems.map((app, index) => {
              const candidateName = app.candidate?.name || '—';
              const initials = candidateName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              const avatarColors = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444'];
              const avatarColor = avatarColors[index % avatarColors.length];
              const status = getLatestSessionStatus(app);
              const score = app.overallScore || 0;
              
              return (
                <div 
                  key={app.id}
                  style={{
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: 16,
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3B82F6';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: avatarColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 20,
                    marginBottom: 16,
                  }}>
                    {initials}
                  </div>
                  
                  {/* Name */}
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: 15, 
                    color: '#111827',
                    marginBottom: 4,
                    textAlign: 'center',
                  }}>
                    {candidateName}
                  </div>
                  
                  {/* Email */}
                  <div style={{ 
                    fontSize: 12, 
                    color: '#9CA3AF',
                    marginBottom: 12,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {app.candidate?.email || '-'}
                  </div>
                  
                  {/* Status Badge */}
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    background: 'white',
                    border: `1px solid ${status.color}`,
                    color: status.color,
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 500,
                    marginBottom: 20,
                  }}>
                    {status.text}
                  </span>
                  
                  {/* Score Section */}
                  <div style={{ width: '100%', marginBottom: 20 }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: 8,
                    }}>
                      <span style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {t('jobDetails.compatibility', 'UYUMLULUK')}
                      </span>
                      <span style={{ 
                        fontSize: 16, 
                        fontWeight: 700, 
                        color: getScoreColor(score),
                      }}>
                        {score}%
                      </span>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: 6, 
                      background: '#E5E7EB', 
                      borderRadius: 3, 
                      overflow: 'hidden',
                    }}>
                      <div style={{ 
                        width: `${score}%`, 
                        height: '100%', 
                        background: getScoreColor(score), 
                        borderRadius: 3,
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: 16,
                    paddingTop: 16,
                    borderTop: '1px solid #F3F4F6',
                    width: '100%',
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedApp(app);
                        setShowHistory(true);
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 8,
                        borderRadius: 8,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Clock size={18} color="#6B7280" />
                      <span style={{ fontSize: 10, color: '#6B7280' }}>{t('jobDetails.timeline', 'Timeline')}</span>
                    </button>
                    
                    {app.candidate?.cvFilePath && (
                      <a
                        href={app.candidate.cvFilePath}
                        download
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 8,
                          borderRadius: 8,
                          transition: 'background 0.15s',
                          textDecoration: 'none',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <FileText size={18} color="#6B7280" />
                        <span style={{ fontSize: 10, color: '#6B7280' }}>CV</span>
                      </a>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
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
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 8,
                        borderRadius: 8,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <BarChart2 size={18} color="#6B7280" />
                      <span style={{ fontSize: 10, color: '#6B7280' }}>{t('jobDetails.analysis', 'Analiz')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ============ LIST VIEW ============ */
          pageItems.map((app, index) => {
            const candidateName = app.candidate?.name || '—';
            const initials = candidateName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            const avatarColors = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444'];
            const avatarColor = avatarColors[index % avatarColors.length];
            
            return (
              <div 
                key={app.id} 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '2.5fr 1fr 1.4fr 0.5fr 1.3fr 120px', 
                  padding: '16px 24px', 
                  borderBottom: '1px solid #F3F4F6', 
                  alignItems: 'center',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#FAFAFA'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                {/* Candidate with Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                    {initials}
                  </div>
                  <div>
                    <div style={{ color: '#111827', fontWeight: 600, fontSize: 14 }}>{candidateName}</div>
                    {app.candidate?.email && (
                      <div style={{ color: '#6B7280', fontSize: 12 }}>{app.candidate.email}</div>
                    )}
                  </div>
                </div>
                
                {/* Analysis Date */}
                <div style={{ color: '#6B7280', fontSize: 14 }}>
                  {app.analyzedAt ? new Date(app.analyzedAt).toLocaleDateString('tr-TR') : '-'}
                </div>
                
                {/* Score */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden', maxWidth: 100 }}>
                    <div style={{ width: `${app.overallScore || 0}%`, height: '100%', background: getScoreColor(app.overallScore || 0), borderRadius: 3 }} />
                  </div>
                  <span style={{ minWidth: 40, fontWeight: 600, color: getScoreColor(app.overallScore || 0), fontSize: 14 }}>
                    {app.overallScore || 0}%
                  </span>
                </div>
                
                {/* Session Icons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
                        width: 30,
                        height: 30,
                        padding: 0,
                        background: app.interviewSessionStatus === 'completed' ? '#D1FAE5' : '#F3F4F6',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        color: app.interviewSessionStatus === 'completed' ? '#10B981' : '#6B7280',
                        transition: 'all 0.15s',
                      }}
                      title={app.interviewSessionStatus === 'completed' ? t('jobDetails.sessionStatus.interviewCompleted') : t('jobDetails.sessionStatus.interviewSent')}
                    >
                      <Video size={15} />
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
                        width: 30,
                        height: 30,
                        padding: 0,
                        background: app.likertSessionStatus === 'completed' ? '#D1FAE5' : '#F3F4F6',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        color: app.likertSessionStatus === 'completed' ? '#10B981' : '#6B7280',
                        transition: 'all 0.15s',
                      }}
                      title={app.likertSessionStatus === 'completed' ? t('jobDetails.sessionStatus.likertCompleted') : t('jobDetails.sessionStatus.likertSent')}
                    >
                      <FileText size={15} />
                    </button>
                  )}
                </div>
                
                {/* Status Badge with Dot */}
                <div>
                  {(() => {
                    const status = getLatestSessionStatus(app);
                    return (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        background: 'white',
                        border: `1px solid ${status.color}20`,
                        color: status.color,
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                      }}>
                        <span style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: status.color,
                        }} />
                        {status.text}
                      </span>
                    );
                  })()}
                </div>
                
                {/* Actions - Icon Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {/* View History */}
                  <button
                    onClick={() => {
                      setSelectedApp(app);
                      setShowHistory(true);
                    }}
                    title={t('jobDetails.viewHistory')}
                    style={{
                      padding: 8,
                      background: 'transparent',
                      border: '1px solid #E5E7EB',
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F3F4F6';
                      e.currentTarget.style.borderColor = '#9CA3AF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = '#E5E7EB';
                    }}
                  >
                    <Clock size={16} color="#6B7280" />
                  </button>
                  
                  {/* View Analysis */}
                  <button
                    onClick={() => {
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
                    title={t('jobDetails.viewAnalysis')}
                    style={{
                      padding: 8,
                      background: 'transparent',
                      border: '1px solid #E5E7EB',
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#EEF2FF';
                      e.currentTarget.style.borderColor = '#818CF8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = '#E5E7EB';
                    }}
                  >
                    <BarChart2 size={16} color="#6366F1" />
                  </button>
                  
                  {/* Download CV */}
                  {app.candidate?.cvFilePath ? (
                    <a
                      href={app.candidate.cvFilePath}
                      download
                      title={t('jobDetails.downloadCV')}
                      style={{
                        padding: 8,
                        background: 'transparent',
                        border: '1px solid #E5E7EB',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#ECFDF5';
                        e.currentTarget.style.borderColor = '#34D399';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = '#E5E7EB';
                      }}
                    >
                      <Download size={16} color="#10B981" />
                    </a>
                  ) : (
                    <div
                      title={t('jobDetails.noCVAvailable', 'CV not available')}
                      style={{
                        padding: 8,
                        background: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.5,
                        cursor: 'not-allowed',
                      }}
                    >
                      <Download size={16} color="#9CA3AF" />
                    </div>
                  )}
              </div>
            </div>
            );
          })
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
          jobTitle={job?.title}
          application={selectedCandidate}
          onRefetch={refetch}
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
      
      {/* Job Detail Modal */}
      {showJobDetail && (
        <JobPreviewModal
          isOpen={showJobDetail}
          onClose={() => setShowJobDetail(false)}
          jobData={{
            title: job?.title,
            departmentId: job?.department?.id,
            location: job?.location,
            remoteType: job?.remoteType,
            employmentType: job?.employmentType,
            experienceLevel: job?.experienceLevel,
            salaryMin: job?.salaryMin,
            salaryMax: job?.salaryMax,
            salaryCurrency: job?.salaryCurrency || 'TRY',
            description: job?.description,
            keywords: job?.keywords || [],
          }}
          departments={departments || []}
          viewOnly={true}
        />
      )}
    </div>
  );
};

export default JobDetails;
