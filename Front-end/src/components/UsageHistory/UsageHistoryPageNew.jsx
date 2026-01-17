/**
 * Usage History Page Component - Period-based credit tracking
 * Shows billing periods with aggregated stats and detailed activity logs
 */
import React, { useState, useEffect } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { History, ChevronRight, CheckCircle, Target, Upload as UploadIcon, Calendar as CalendarIcon, Video, Sparkles, Eye } from 'lucide-react';
import { SUBSCRIPTION_STATUS_QUERY } from '../../graphql/multiTenancy';
import { GET_USAGE_HISTORY, GET_USAGE_SESSION_DETAIL, GET_USAGE_PERIODS } from '../../graphql/usageHistory';
import UsageSessionDetailModal from './UsageSessionDetailModal';
import InterviewResultsModal from '../CVEvaluation/InterviewResultsModal';
import { generateBillingPeriods, getCurrentPeriod, formatDate, generateLastMonths } from '../../utils/periodCalculator';

const UsageHistoryPageNew = () => {
  const { t } = useTranslation();
  const [periods, setPeriods] = useState([]); // periods shown for selectedYear
  const [allPeriods, setAllPeriods] = useState([]); // all periods with usage
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [activeTab, setActiveTab] = useState('cv_analyses');
  const [showInterviewResultsModal, setShowInterviewResultsModal] = useState(false);
  const [selectedInterviewData, setSelectedInterviewData] = useState(null);

  // Lazy query for session details
  const [fetchSessionDetail, { data: sessionDetailData, loading: sessionDetailLoading }] = useLazyQuery(GET_USAGE_SESSION_DETAIL);

  // Fetch subscription (still used for unlimited flag)
  const { data: subscriptionData } = useQuery(SUBSCRIPTION_STATUS_QUERY, { fetchPolicy: 'network-only' });

  // Fetch periods that actually have usage
  const { data: periodsData } = useQuery(GET_USAGE_PERIODS, { fetchPolicy: 'network-only' });

  // Fetch usage data for CV uploads
  const { data: uploadsData } = useQuery(GET_USAGE_HISTORY, {
    variables: {
      resourceType: 'cv_upload',
      periodStart: selectedPeriod?.start,
      periodEnd: selectedPeriod?.end,
    },
    skip: !selectedPeriod,
    fetchPolicy: 'network-only',
  });

  // Fetch usage data for AI analyses
  const { data: analysesData } = useQuery(GET_USAGE_HISTORY, {
    variables: {
      resourceType: 'ai_analysis',
      periodStart: selectedPeriod?.start,
      periodEnd: selectedPeriod?.end,
    },
    skip: !selectedPeriod,
    fetchPolicy: 'network-only',
  });

  // Fetch usage data for Interview Completed
  const { data: interviewCompletedData } = useQuery(GET_USAGE_HISTORY, {
    variables: {
      resourceType: 'interview_completed',
      periodStart: selectedPeriod?.start,
      periodEnd: selectedPeriod?.end,
    },
    skip: !selectedPeriod,
    fetchPolicy: 'network-only',
  });

  // Fetch usage data for Interview AI Analysis
  const { data: interviewAIAnalysisData } = useQuery(GET_USAGE_HISTORY, {
    variables: {
      resourceType: 'interview_ai_analysis',
      periodStart: selectedPeriod?.start,
      periodEnd: selectedPeriod?.end,
    },
    skip: !selectedPeriod,
    fetchPolicy: 'network-only',
  });

  // Calculate periods: prefer server-aggregated list; fallback to subscription-based months
  useEffect(() => {
    // Unlimited flag from subscription
    if (subscriptionData?.subscriptionStatus) {
      const sub = subscriptionData.subscriptionStatus;
      const plan = sub.plan;
      const unlimited = plan?.cv_limit === null || plan?.cv_limit === -1;
      setIsUnlimited(unlimited);
    }

    const serverPeriods = periodsData?.getUsagePeriods || [];
    if (serverPeriods.length > 0) {
      // Map to local period shape and keep their aggregated stats
      const mapped = serverPeriods.map((p) => ({
        label: p.label,
        start: p.periodStart,
        end: p.periodEnd,
        stats: {
          total: p.totalCredits,
          cvUploads: p.cvUploads,
          cvAnalysis: p.cvAnalyses,
          interviewCompleted: p.interviewCompleted || 0,
          interviewAIAnalysis: p.interviewAIAnalysis || 0,
        }
      }));

      // Build years list (desc)
      const ys = Array.from(new Set(mapped.map((p) => new Date(p.start).getFullYear()))).sort((a, b) => b - a);

      // Prefer current year if present
      const nowY = new Date().getFullYear();
      const preferredYear = ys.includes(nowY) ? nowY : ys[0];

      const filtered = mapped.filter((p) => new Date(p.start).getFullYear() === preferredYear);

      setAllPeriods(mapped);
      setYears(ys);
      setSelectedYear(preferredYear);
      setPeriods(filtered);
      setSelectedPeriod(filtered[0]);
      return;
    }

    // Fallback: show only current month (no usage overall)
    const fallback = generateLastMonths(1);
    const nowY = new Date().getFullYear();
    setAllPeriods([]);
    setYears([nowY]);
    setSelectedYear(nowY);
    setPeriods(fallback);
    setSelectedPeriod(getCurrentPeriod(fallback) || fallback[0]);
  }, [subscriptionData, periodsData]);

  // When the user changes year, filter periods accordingly and pick the first
  useEffect(() => {
    if (!selectedYear) return;
    if (allPeriods.length === 0) return;
    const filtered = allPeriods.filter((p) => new Date(p.start).getFullYear() === selectedYear);
    setPeriods(filtered);
    setSelectedPeriod(filtered[0] || null);
  }, [selectedYear, allPeriods]);

  // Calculate stats for each period (prefer server-provided aggregates on the item)
  const getPeriodStats = (period) => {
    if (period?.stats) return { ...period.stats };
    if (period.start !== selectedPeriod?.start) return { cvAnalysis: 0, cvUploads: 0, total: 0 };
    const uploads = uploadsData?.getUsageHistory || [];
    const analyses = analysesData?.getUsageHistory || [];
    const cvUploads = uploads.reduce((sum, item) => sum + item.count, 0);
    const cvAnalysis = analyses.reduce((sum, item) => sum + item.count, 0);
    return { cvUploads, cvAnalysis, total: cvUploads + cvAnalysis };
  };

  const currentPeriodStats = selectedPeriod ? getPeriodStats(selectedPeriod) : { cvAnalysis: 0, cvUploads: 0, total: 0 };
  
  const uploads = uploadsData?.getUsageHistory || [];
  const analyses = analysesData?.getUsageHistory || [];
  const interviewCompleted = interviewCompletedData?.getUsageHistory || [];
  const interviewAIAnalysis = interviewAIAnalysisData?.getUsageHistory || [];
  
  // Get current activities based on active tab
  const getCurrentActivities = () => {
    switch (activeTab) {
      case 'cv_analyses': return analyses;
      case 'cv_uploads': return uploads;
      case 'interview_completed': return interviewCompleted;
      case 'interview_ai_analysis': return interviewAIAnalysis;
      default: return analyses;
    }
  };
  const currentActivities = getCurrentActivities();
  
  // Tab configurations
  const tabs = [
    { id: 'cv_analyses', label: t('usageHistoryPage.cvAnalyses', 'CV Analyses'), icon: Target, color: '#6B21A8', bg: '#EDE9FE' },
    { id: 'cv_uploads', label: t('usageHistoryPage.cvUploads', 'CV Uploads'), icon: UploadIcon, color: '#1E40AF', bg: '#DBEAFE' },
    { id: 'interview_completed', label: t('usageHistoryPage.interviewCompleted', 'Interview Completed'), icon: Video, color: '#047857', bg: '#D1FAE5' },
    { id: 'interview_ai_analysis', label: t('usageHistoryPage.interviewAIAnalysis', 'Interview AI Analysis'), icon: Sparkles, color: '#B45309', bg: '#FEF3C7' },
  ];
  
  const activeTabConfig = tabs.find(t => t.id === activeTab) || tabs[0];

  // Handle session detail
  const handleViewDetail = async (item) => {
    setSelectedSession(item);
    await fetchSessionDetail({ variables: { batchNumber: item.batchNumber } });
  };

  const sessionWithDetail = selectedSession && sessionDetailData?.getUsageSessionDetail
    ? { ...selectedSession, ...sessionDetailData.getUsageSessionDetail }
    : selectedSession;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto', background: '#F9FAFB', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#1F2937',
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <History size={32} color="#3B82F6" />
          {t('usageHistoryPage.title', 'Usage Tracking')}
        </h1>
        <p style={{ fontSize: 16, color: '#6B7280' }}>
          {t('usageHistoryPage.subtitle', 'Review your credit usage by period.')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
        {/* Left: Period List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', margin: 0 }}>
            {t('usageHistoryPage.periodList', 'Usage Period List')}
          </h2>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
            {t('usageHistoryPage.subtitle', 'Review your credit usage by period.')}
          </p>

          {/* Year Selector (always visible) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#6B7280' }}>{t('usageHistoryPage.year', 'Year')}</span>
            <select
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #E5E7EB',
                background: 'white',
                color: '#1F2937',
                fontWeight: 600
              }}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Period Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {periods.map((period, index) => {
              const stats = getPeriodStats(period);
              const isSelected = selectedPeriod?.start === period.start;
              const isCurrent = (() => {
                const now = new Date();
                const y = now.getFullYear();
                const m = String(now.getMonth() + 1).padStart(2, '0');
                const d = String(now.getDate()).padStart(2, '0');
                const today = `${y}-${m}-${d}`;
                return today >= period.start && today <= period.end;
              })();

              return (
                <button
                  key={period.start}
                  onClick={() => setSelectedPeriod(period)}
                  style={{
                    background: 'white',
                    border: isSelected ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                    borderRadius: 12,
                    padding: 16,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  {isCurrent && (
                    <div style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      padding: '4px 10px',
                      background: '#3B82F6',
                      color: 'white',
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 6
                    }}>
                      {t('usageHistoryPage.current', 'Current')}
                    </div>
                  )}

                  <div style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#1F2937',
                    marginBottom: 12
                  }}>
                    {period.label}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                    <div style={{ 
                      padding: '8px 12px', 
                      background: '#3B82F6', 
                      borderRadius: 8,
                      color: 'white'
                    }}>
                      <div style={{ fontSize: 10, opacity: 0.9 }}>{t('usageHistoryPage.totalCredits', 'Total')}</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{stats.total}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6B21A8' }}></div>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>{t('usageHistoryPage.cvAnalysisShort', 'CV Analysis')}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1F2937' }}>{stats.cvAnalysis}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1E40AF' }}></div>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>{t('usageHistoryPage.cvUploadShort', 'CV Upload')}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1F2937' }}>{stats.cvUploads}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#047857' }}></div>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>{t('usageHistoryPage.interviewShort', 'Interview')}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1F2937' }}>{stats.interviewCompleted}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#B45309' }}></div>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>{t('usageHistoryPage.aiAnalysisShort', 'AI Analysis')}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1F2937' }}>{stats.interviewAIAnalysis}</span>
                    </div>
                  </div>

                  <ChevronRight
                    size={20}
                    color="#9CA3AF"
                    style={{
                      position: 'absolute',
                      right: 16,
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Activity Log */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          {selectedPeriod ? (
            <>
              {/* Activity Header */}
              <div style={{ padding: 24, borderBottom: '1px solid #E5E7EB' }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', margin: 0, marginBottom: 8 }}>
                  {t('usageHistoryPage.activityLog', 'Activity Log')}: {selectedPeriod.label}
                </h2>
                <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
                  {t('usageHistoryPage.trackUsage', 'Track your usage for the selected period.')}
                </p>

                {/* Tabs */}
                <div style={{
                  display: 'flex',
                  gap: 4,
                  marginTop: 16,
                  borderBottom: '1px solid #E5E7EB',
                  flexWrap: 'wrap'
                }}>
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: '10px 16px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === tab.id ? `2px solid ${tab.color}` : '2px solid transparent',
                        color: activeTab === tab.id ? tab.color : '#6B7280',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <tab.icon size={14} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Table */}
              <div style={{ padding: 24 }}>
                {currentActivities.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>
                    <CalendarIcon size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
                      {t('usageHistoryPage.noRecordsInPeriod', 'No records found in this period')}
                    </p>
                    <p style={{ fontSize: 14 }}>
                      {t(`usageHistoryPage.noRecords_${activeTab}`, `No ${activeTabConfig.label} records`)}
                    </p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>{t('usageHistoryPage.status', 'STATUS')}</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>{t('usageHistoryPage.analysisDetails', 'ANALYSIS DETAILS')}</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>{t('usageHistoryPage.dateTime', 'DATE & TIME')}</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
                          {t('usageHistoryPage.count', 'COUNT')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentActivities.map((activity, index) => {
                        const candidateName = activity.metadata?.candidate_name || '-';
                        const sessionId = activity.metadata?.session_id;
                        
                        return (
                          <tr
                            key={activity.id}
                            style={{
                              borderBottom: index < currentActivities.length - 1 ? '1px solid #F3F4F6' : 'none',
                              cursor: 'pointer',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            onClick={() => handleViewDetail(activity)}
                          >
                            <td style={{ padding: '16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <CheckCircle size={16} color="#10B981" />
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>{t('usageHistoryPage.completed', 'Completed')}</div>
                                  <div style={{ fontSize: 12, color: '#6B7280' }}>{t('usageHistoryPage.batch', 'Batch')} #{activity.batchNumber}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div style={{ fontSize: 13, color: '#1F2937' }}>
                                {(activeTab === 'interview_completed' || activeTab === 'interview_ai_analysis') && candidateName !== '-' ? (
                                  <>
                                    <span style={{ fontWeight: 600, color: '#1F2937' }}>{candidateName}</span>
                                    <span style={{ color: '#6B7280' }}> - </span>
                                  </>
                                ) : null}
                                {activeTab === 'cv_analyses' && t('usageHistoryPage.descCvAnalysis', 'AI-powered job matching analysis')}
                                {activeTab === 'cv_uploads' && t('usageHistoryPage.descCvUpload', 'CV upload to system')}
                                {activeTab === 'interview_completed' && t('usageHistoryPage.descInterviewCompleted', 'Completed interview')}
                                {activeTab === 'interview_ai_analysis' && t('usageHistoryPage.descInterviewAI', 'AI analysis performed')}
                              </div>
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div style={{ fontSize: 13, color: '#6B7280' }}>
                                {formatDate(activity.createdAt)}
                              </div>
                            </td>
                            <td style={{ padding: '16px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                                {/* View AI Analysis Button for interview_ai_analysis */}
                                {activeTab === 'interview_ai_analysis' && activity.metadata?.application_id && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedInterviewData({
                                        applicationId: activity.metadata.application_id,
                                        candidateName: candidateName,
                                      });
                                      setShowInterviewResultsModal(true);
                                    }}
                                    title={t('usageHistoryPage.viewAnalysis', 'View Analysis')}
                                    style={{
                                      padding: '6px 10px',
                                      background: '#EEF2FF',
                                      border: '1px solid #C7D2FE',
                                      borderRadius: 6,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      fontSize: 12,
                                      color: '#4F46E5',
                                      fontWeight: 500,
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = '#E0E7FF';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = '#EEF2FF';
                                    }}
                                  >
                                    <Eye size={14} />
                                    {t('usageHistoryPage.viewAnalysis', 'View')}
                                  </button>
                                )}
                                <div style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '6px 12px',
                                  background: activeTabConfig.bg,
                                  color: activeTabConfig.color,
                                  borderRadius: 8,
                                  fontSize: 14,
                                  fontWeight: 600
                                }}>
                                  <activeTabConfig.icon size={14} />
                                  {activity.count}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {currentActivities.length > 0 && (
                  <div style={{
                    marginTop: 16,
                    fontSize: 12,
                    color: '#9CA3AF',
                    textAlign: 'center'
                  }}>
                    {t('usageHistoryPage.showingResults', 'Showing 1 to {{count}} of {{total}} results', { count: currentActivities.length, total: currentActivities.length })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF' }}>
              <CalendarIcon size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>{t('usageHistoryPage.selectPeriod', 'Select a period')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {sessionWithDetail && (
        <UsageSessionDetailModal
          session={sessionWithDetail}
          onClose={() => setSelectedSession(null)}
          loading={sessionDetailLoading}
        />
      )}

      {/* Interview Results Modal for AI Analysis */}
      {showInterviewResultsModal && selectedInterviewData && (
        <InterviewResultsModal
          isOpen={showInterviewResultsModal}
          applicationId={selectedInterviewData.applicationId}
          candidateName={selectedInterviewData.candidateName}
          onClose={() => {
            setShowInterviewResultsModal(false);
            setSelectedInterviewData(null);
          }}
        />
      )}
    </div>
  );
};

export default UsageHistoryPageNew;
