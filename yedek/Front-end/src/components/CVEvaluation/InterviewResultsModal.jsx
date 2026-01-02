/**
 * Interview Results Modal
 * Displays interview results and answers for HR view
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@apollo/client/react';
import { X, CheckCircle2, Video, Clock, MessageSquare } from 'lucide-react';
import { GET_INTERVIEW_SESSION_BY_APPLICATION } from '../../graphql/interview';

const InterviewResultsModal = ({ isOpen, onClose, applicationId, candidateName, jobTitle }) => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  
  const { data, loading, error } = useQuery(GET_INTERVIEW_SESSION_BY_APPLICATION, {
    variables: { applicationId },
    skip: !applicationId || !isOpen,
    fetchPolicy: 'network-only',
  });

  if (!isOpen) return null;

  const session = data?.interviewSessionByApplication;
  const template = session?.template;
  const answers = session?.answers || [];

  // Calculate duration
  const duration = session?.startedAt && session?.completedAt
    ? Math.round((new Date(session.completedAt) - new Date(session.startedAt)) / 60000)
    : null;

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString(isEnglish ? 'en-US' : 'tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#3B82F6';
      case 'expired': return '#EF4444';
      default: return '#F59E0B';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return isEnglish ? 'Completed' : 'Tamamlandı';
      case 'in_progress': return isEnglish ? 'In Progress' : 'Devam Ediyor';
      case 'expired': return isEnglish ? 'Expired' : 'Süresi Doldu';
      case 'pending': return isEnglish ? 'Pending' : 'Beklemede';
      default: return status;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: 20,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        width: '90%',
        maxWidth: 900,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Video size={24} />
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t('interviewResults.title')}</h2>
              <p style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>
                {candidateName} - {jobTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 8,
              padding: 8,
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <X size={20} color="white" />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <div style={{
                width: 40,
                height: 40,
                border: '3px solid #E5E7EB',
                borderTopColor: '#3B82F6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px',
              }} />
              <p style={{ color: '#6B7280' }}>{t('common.loading')}</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <p style={{ color: '#EF4444' }}>{t('common.error')}: {error.message}</p>
            </div>
          ) : !session ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <p style={{ color: '#6B7280' }}>{t('interviewResults.notCompleted')}</p>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 16,
                marginBottom: 24,
              }}>
                <div style={{
                  background: '#F9FAFB',
                  borderRadius: 12,
                  padding: 20,
                  textAlign: 'center',
                }}>
                  <CheckCircle2 size={24} style={{ color: getStatusColor(session.status), marginBottom: 8 }} />
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>{isEnglish ? 'Status' : 'Durum'}</div>
                  <div style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: getStatusColor(session.status),
                  }}>
                    {getStatusLabel(session.status)}
                  </div>
                </div>

                <div style={{
                  background: '#F9FAFB',
                  borderRadius: 12,
                  padding: 20,
                  textAlign: 'center',
                }}>
                  <MessageSquare size={24} style={{ color: '#3B82F6', marginBottom: 8 }} />
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>{isEnglish ? 'Questions' : 'Sorular'}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>
                    {answers.length}
                  </div>
                </div>

                <div style={{
                  background: '#F9FAFB',
                  borderRadius: 12,
                  padding: 20,
                  textAlign: 'center',
                }}>
                  <Clock size={24} style={{ color: '#F59E0B', marginBottom: 8 }} />
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>{isEnglish ? 'Duration' : 'Süre'}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>
                    {duration ? `${duration} ${isEnglish ? 'min' : 'dk'}` : '-'}
                  </div>
                </div>

                <div style={{
                  background: '#F9FAFB',
                  borderRadius: 12,
                  padding: 20,
                  textAlign: 'center',
                }}>
                  <Video size={24} style={{ color: '#8B5CF6', marginBottom: 8 }} />
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>{isEnglish ? 'Language' : 'Dil'}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>
                    {template?.language === 'en' ? 'English' : 'Türkçe'}
                  </div>
                </div>
              </div>

              {/* Template & Date Info */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
                marginBottom: 24,
              }}>
                <div style={{
                  background: '#EFF6FF',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <span style={{ fontSize: 20 }}>📁</span>
                  <div>
                    <span style={{ color: '#1E40AF', fontWeight: 600 }}>{isEnglish ? 'Template: ' : 'Şablon: '}</span>
                    <span style={{ color: '#1F2937' }}>{template?.name || '-'}</span>
                  </div>
                </div>

                <div style={{
                  background: '#D1FAE5',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <span style={{ fontSize: 20 }}>📅</span>
                  <div>
                    <span style={{ color: '#065F46', fontWeight: 600 }}>{t('interviewResults.completedAt')}: </span>
                    <span style={{ color: '#1F2937' }}>{formatDate(session.completedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div style={{
                background: '#F9FAFB',
                borderRadius: 12,
                padding: 20,
                marginBottom: 24,
              }}>
                <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#1F2937' }}>
                  {isEnglish ? 'Timeline' : 'Zaman Çizelgesi'}
                </h4>
                <div style={{ display: 'flex', gap: 24 }}>
                  {session.invitationSentAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }} />
                      <span style={{ fontSize: 13, color: '#6B7280' }}>{isEnglish ? 'Invitation Sent' : 'Davet Gönderildi'}: {formatDate(session.invitationSentAt)}</span>
                    </div>
                  )}
                  {session.startedAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
                      <span style={{ fontSize: 13, color: '#6B7280' }}>{isEnglish ? 'Started' : 'Başladı'}: {formatDate(session.startedAt)}</span>
                    </div>
                  )}
                  {session.completedAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                      <span style={{ fontSize: 13, color: '#6B7280' }}>{isEnglish ? 'Completed' : 'Tamamlandı'}: {formatDate(session.completedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Answers */}
              <div>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1F2937' }}>
                  {isEnglish ? 'Interview Answers' : 'Mülakat Cevapları'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {answers.map((answer, index) => (
                    <div key={answer.id} style={{
                      background: '#F9FAFB',
                      borderRadius: 12,
                      overflow: 'hidden',
                    }}>
                      {/* Question Header */}
                      <div style={{
                        background: '#EFF6FF',
                        padding: '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        borderBottom: '1px solid #DBEAFE',
                      }}>
                        <span style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: '#3B82F6',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                        }}>
                          {index + 1}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#1E40AF' }}>
                          {answer.questionText}
                        </span>
                      </div>
                      
                      {/* Answer Content */}
                      <div style={{ padding: 20 }}>
                        <p style={{
                          margin: 0,
                          fontSize: 14,
                          color: '#374151',
                          lineHeight: 1.7,
                          whiteSpace: 'pre-wrap',
                        }}>
                          {answer.answerText || <em style={{ color: '#9CA3AF' }}>{t('interviewResults.noAnswer')}</em>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              background: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t('common.close')}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default InterviewResultsModal;

