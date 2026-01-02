/**
 * Likert Test Results Modal
 * Displays Likert test results for HR view
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@apollo/client/react';
import { X, CheckCircle2, BarChart2, FileText, Clock } from 'lucide-react';
import { GET_LIKERT_SESSION_BY_APPLICATION } from '../../graphql/likert';

const LikertResultsModal = ({ isOpen, onClose, applicationId, candidateName, jobTitle }) => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  
  const { data, loading, error } = useQuery(GET_LIKERT_SESSION_BY_APPLICATION, {
    variables: { applicationId },
    skip: !applicationId || !isOpen,
    fetchPolicy: 'network-only',
  });

  if (!isOpen) return null;

  const session = data?.likertSessionByApplication;
  const template = session?.template;
  const answers = session?.answers || [];
  const scaleLabels = template?.scaleLabels || ['Kesinlikle Katılmıyorum', 'Katılmıyorum', 'Kararsızım', 'Katılıyorum', 'Kesinlikle Katılıyorum'];
  const scaleType = template?.scaleType || 5;

  // Calculate average score
  const totalScore = session?.totalScore || answers.reduce((sum, a) => sum + a.score, 0);
  const avgScore = answers.length > 0 ? (totalScore / answers.length).toFixed(2) : 0;

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

  const getScoreColor = (score) => {
    if (score >= 4) return '#10B981';
    if (score >= 3) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreLabel = (score) => {
    if (score <= 0 || score > scaleLabels.length) return '-';
    return scaleLabels[score - 1];
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
        maxWidth: 800,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FileText size={24} />
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t('likertResults.title')}</h2>
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
              <div className="likert-spinner" style={{
                width: 40,
                height: 40,
                border: '3px solid #E5E7EB',
                borderTopColor: '#8B5CF6',
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
              <p style={{ color: '#6B7280' }}>{t('likertResults.notCompleted')}</p>
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
                  <CheckCircle2 size={24} style={{ color: '#10B981', marginBottom: 8 }} />
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>{isEnglish ? 'Status' : 'Durum'}</div>
                  <div style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: session.status === 'completed' ? '#10B981' : '#F59E0B',
                  }}>
                    {session.status === 'completed' ? (isEnglish ? 'Completed' : 'Tamamlandı') : session.status}
                  </div>
                </div>

                <div style={{
                  background: '#F9FAFB',
                  borderRadius: 12,
                  padding: 20,
                  textAlign: 'center',
                }}>
                  <BarChart2 size={24} style={{ color: '#8B5CF6', marginBottom: 8 }} />
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>{isEnglish ? 'Average' : 'Ortalama'}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>
                    {avgScore} / {scaleType}
                  </div>
                </div>

                <div style={{
                  background: '#F9FAFB',
                  borderRadius: 12,
                  padding: 20,
                  textAlign: 'center',
                }}>
                  <FileText size={24} style={{ color: '#3B82F6', marginBottom: 8 }} />
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
              </div>

              {/* Template & Date Info */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
                marginBottom: 24,
              }}>
                <div style={{
                  background: '#FEF3C7',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <span style={{ fontSize: 20 }}>📁</span>
                  <div>
                    <span style={{ color: '#92400E', fontWeight: 600 }}>{isEnglish ? 'Template: ' : 'Şablon: '}</span>
                    <span style={{ color: '#1F2937' }}>{template?.name || '-'}</span>
                  </div>
                </div>

                <div style={{
                  background: '#DBEAFE',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <span style={{ fontSize: 20 }}>📅</span>
                  <div>
                    <span style={{ color: '#1E40AF', fontWeight: 600 }}>{t('likertResults.completedAt')}: </span>
                    <span style={{ color: '#1F2937' }}>{formatDate(session.completedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Scale Legend */}
              <div style={{
                background: '#F9FAFB',
                borderRadius: 12,
                padding: 20,
                marginBottom: 24,
              }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#1F2937' }}>
                  {isEnglish ? 'Scale Legend' : 'Ölçek Açıklaması'}
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {scaleLabels.map((label, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'white',
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: '1px solid #E5E7EB',
                    }}>
                      <span style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: '#8B5CF6',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                      }}>
                        {index + 1}
                      </span>
                      <span style={{ fontSize: 13, color: '#4B5563' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Answers */}
              <div>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1F2937' }}>
                  {isEnglish ? 'Answers' : 'Cevaplar'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {answers.map((answer, index) => (
                    <div key={answer.id} style={{
                      background: '#F9FAFB',
                      borderRadius: 12,
                      padding: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: '#8B5CF6',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                          fontWeight: 700,
                        }}>
                          {index + 1}
                        </span>
                        <span style={{ fontSize: 14, color: '#1F2937', fontWeight: 500 }}>
                          {answer.questionText}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          background: getScoreColor(answer.score),
                          color: 'white',
                          padding: '8px 16px',
                          borderRadius: 20,
                          fontSize: 14,
                          fontWeight: 700,
                        }}>
                          {answer.score} / {scaleType}
                        </div>
                        <span style={{ fontSize: 12, color: '#6B7280', minWidth: 100, textAlign: 'right' }}>
                          {getScoreLabel(answer.score)}
                        </span>
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

export default LikertResultsModal;

