/**
 * Candidate History Modal
 * Shows timeline of all candidate activities
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@apollo/client/react';
import { X, FileText, BarChart2, Video, ListChecks, CheckCircle2, Clock, Send, Download, XCircle, FileSearch } from 'lucide-react';
import { GET_LIKERT_SESSION_BY_APPLICATION } from '../../graphql/likert';
import { GET_INTERVIEW_SESSION_BY_APPLICATION } from '../../graphql/interview';

const CandidateHistoryModal = ({ 
  isOpen, 
  onClose, 
  applicationId, 
  candidateName, 
  jobTitle,
  applicationData,
  onViewLikertResults,
  onViewInterviewResults,
}) => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  const [showRejectionNoteModal, setShowRejectionNoteModal] = useState(false);

  // Fetch Likert session
  const { data: likertData } = useQuery(GET_LIKERT_SESSION_BY_APPLICATION, {
    variables: { applicationId },
    skip: !applicationId || !isOpen,
    fetchPolicy: 'cache-first',
  });

  // Fetch Interview session
  const { data: interviewData } = useQuery(GET_INTERVIEW_SESSION_BY_APPLICATION, {
    variables: { applicationId },
    skip: !applicationId || !isOpen,
    fetchPolicy: 'cache-first',
  });

  if (!isOpen) return null;

  const likertSession = likertData?.likertSessionByApplication;
  const interviewSession = interviewData?.interviewSessionByApplication;
  const application = applicationData;

  // Build timeline events
  const events = [];

  // CV Upload event
  if (application?.createdAt) {
    events.push({
      type: 'cv_upload',
      title: t('candidateHistory.cvUploaded'),
      description: isEnglish 
        ? 'Submitted via application form.' 
        : 'Başvuru formu aracılığıyla gönderildi.',
      date: new Date(application.createdAt),
      icon: FileText,
      color: '#6B7280',
      extra: application?.candidate?.cvFilePath ? {
        fileName: application.candidate.cvFilePath.split('/').pop(),
        filePath: application.candidate.cvFilePath,
      } : null,
    });
  }

  // CV Analyzed event
  if (application?.analysisData || application?.score) {
    const score = application?.score || application?.analysisData?.overall_score || 0;
    events.push({
      type: 'cv_analyzed',
      title: t('candidateHistory.cvAnalyzed'),
      description: isEnglish 
        ? 'Pre-screening performed by automated system. Candidate skills highly match position requirements.'
        : 'Otomatik sistem tarafından ön eleme yapıldı. Adayın yetkinlikleri pozisyon gereksinimleri ile yüksek oranda örtüşüyor.',
      date: new Date(application?.updatedAt || application?.createdAt),
      icon: BarChart2,
      color: '#3B82F6',
      badge: {
        text: isEnglish ? `${Math.round(score)}% Match` : `%${Math.round(score)} Eşleşme`,
        color: score >= 70 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444',
      },
    });
  }

  // Interview invitation sent
  if (interviewSession?.invitationSentAt || interviewSession?.createdAt) {
    events.push({
      type: 'interview_sent',
      title: t('candidateHistory.interviewSent'),
      description: isEnglish 
        ? 'Interview link shared with the candidate.'
        : 'Mülakat bağlantısı aday ile paylaşıldı.',
      date: new Date(interviewSession.invitationSentAt || interviewSession.createdAt),
      icon: Video,
      color: '#8B5CF6',
    });
  }

  // Interview completed
  if (interviewSession?.status === 'completed' && interviewSession?.completedAt) {
    events.push({
      type: 'interview_completed',
      title: t('candidateHistory.interviewCompleted'),
      description: isEnglish 
        ? 'Candidate technical knowledge sufficient, cultural fit positive.'
        : 'Adayın teknik bilgisi yeterli, kültürel uyum olumlu.',
      date: new Date(interviewSession.completedAt),
      icon: CheckCircle2,
      color: '#10B981',
      badge: {
        text: isEnglish ? 'Completed' : 'Tamamlandı',
        color: '#10B981',
      },
      action: {
        label: isEnglish ? 'View Results' : 'Sonuçları Gör',
        onClick: () => onViewInterviewResults?.(),
      },
    });
  }

  // Likert test sent
  if (likertSession?.createdAt) {
    events.push({
      type: 'likert_sent',
      title: t('candidateHistory.likertSent'),
      description: isEnglish
        ? 'Likert test link shared with the candidate.'
        : 'Likert test bağlantısı aday ile paylaşıldı.',
      date: new Date(likertSession.createdAt),
      icon: Send,
      color: '#8B5CF6',
    });
  }

  // Likert test completed
  if (likertSession?.status === 'completed' && likertSession?.completedAt) {
    events.push({
      type: 'likert_completed',
      title: t('candidateHistory.likertCompleted'),
      description: isEnglish
        ? 'Candidate successfully completed the Likert test.'
        : 'Aday Likert testini başarıyla tamamladı.',
      date: new Date(likertSession.completedAt),
      icon: CheckCircle2,
      color: '#10B981',
      badge: {
        text: isEnglish ? 'Completed' : 'Tamamlandı',
        color: '#10B981',
      },
      action: {
        label: isEnglish ? 'View Results' : 'Sonuçları Gör',
        onClick: () => onViewLikertResults?.(),
      },
    });
  }

  // Rejection event
  const isRejected = application?.status?.toUpperCase() === 'REJECTED' || application?.rejectedAt;
  if (isRejected) {
    events.push({
      type: 'rejected',
      title: t('candidateHistory.rejected', 'Başvuru Reddedildi'),
      description: isEnglish
        ? 'Application has been rejected and rejection email was sent to the candidate.'
        : 'Başvuru reddedildi ve adaya red e-postası gönderildi.',
      date: application?.rejectedAt ? new Date(application.rejectedAt) : new Date(),
      icon: XCircle,
      color: '#DC2626',
      badge: {
        text: isEnglish ? 'Rejected' : 'Reddedildi',
        color: '#DC2626',
      },
      action: application?.rejectionNote ? {
        label: isEnglish ? 'View Note' : 'Notu Görüntüle',
        onClick: () => setShowRejectionNoteModal(true),
      } : null,
    });
  }

  // Sort events by date (newest first)
  events.sort((a, b) => b.date - a.date);

  const formatDate = (date) => {
    return date.toLocaleString(isEnglish ? 'en-US' : 'tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        maxWidth: 700,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1F2937' }}>
              {candidateName}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6B7280' }}>
              {isEnglish ? `${jobTitle} Application` : `${jobTitle} Başvurusu`}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 8,
              cursor: 'pointer',
              borderRadius: 8,
            }}
          >
            <X size={20} color="#6B7280" />
          </button>
        </div>

        {/* Timeline Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          <div style={{ position: 'relative' }}>
            {/* Timeline Line */}
            <div style={{
              position: 'absolute',
              left: 19,
              top: 24,
              bottom: 24,
              width: 2,
              background: '#E5E7EB',
            }} />

            {/* Events */}
            {events.map((event, index) => {
              const Icon = event.icon;
              return (
                <div key={index} style={{
                  display: 'flex',
                  gap: 16,
                  marginBottom: index === events.length - 1 ? 0 : 24,
                  position: 'relative',
                }}>
                  {/* Icon */}
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: `${event.color}15`,
                    border: `2px solid ${event.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    zIndex: 1,
                  }}>
                    <Icon size={18} color={event.color} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1F2937' }}>
                        {event.title}
                      </h4>
                      {event.badge && (
                        <span style={{
                          padding: '2px 10px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          background: `${event.badge.color}15`,
                          color: event.badge.color,
                        }}>
                          {event.badge.text}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: 13, color: '#6B7280' }}>
                      {formatDate(event.date)}
                    </p>
                    
                    {/* Description Box */}
                    <div style={{
                      background: '#F9FAFB',
                      borderRadius: 8,
                      padding: 12,
                      marginTop: 8,
                    }}>
                      <p style={{ margin: 0, fontSize: 14, color: '#4B5563', lineHeight: 1.5 }}>
                        {event.description}
                      </p>
                      
                      {/* File Download */}
                      {event.extra?.filePath && (
                        <div style={{
                          marginTop: 12,
                          padding: 12,
                          background: 'white',
                          borderRadius: 8,
                          border: '1px solid #E5E7EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              padding: '4px 8px',
                              background: '#EF4444',
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 700,
                              color: 'white',
                            }}>
                              PDF
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500, color: '#1F2937' }}>
                                {event.extra.fileName}
                              </div>
                            </div>
                          </div>
                          <a
                            href={event.extra.filePath}
                            download
                            style={{
                              padding: 8,
                              borderRadius: 6,
                              background: '#F3F4F6',
                              display: 'flex',
                              cursor: 'pointer',
                            }}
                          >
                            <Download size={16} color="#6B7280" />
                          </a>
                        </div>
                      )}

                      {/* Action Button */}
                      {event.action && (
                        <button
                          onClick={event.action.onClick}
                          style={{
                            marginTop: 12,
                            padding: '8px 16px',
                            background: event.color,
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {event.action.label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {events.length === 0 && (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <Clock size={48} style={{ color: '#D1D5DB', marginBottom: 16 }} />
                <p style={{ color: '#6B7280' }}>{t('candidateHistory.noHistory')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'white',
                color: '#374151',
                border: '1px solid #D1D5DB',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
      
      {/* Rejection Note Modal */}
      {showRejectionNoteModal && application?.rejectionNote && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            width: '90%',
            maxWidth: 500,
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'white' }}>
                <FileSearch size={20} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                  {isEnglish ? 'Rejection Note' : 'Red Notu'}
                </h3>
              </div>
              <button
                onClick={() => setShowRejectionNoteModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: 6,
                  padding: 6,
                  cursor: 'pointer',
                  display: 'flex',
                }}
              >
                <X size={18} color="white" />
              </button>
            </div>
            
            {/* Content */}
            <div style={{ padding: 20 }}>
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 8,
                padding: 16,
              }}>
                <p style={{
                  margin: 0,
                  fontSize: 14,
                  color: '#7F1D1D',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}>
                  {application.rejectionNote}
                </p>
              </div>
              <p style={{ 
                marginTop: 12, 
                fontSize: 12, 
                color: '#9CA3AF',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                🔒 {isEnglish ? 'This note is only visible to HR personnel.' : 'Bu not sadece İK personeli tarafından görüntülenebilir.'}
              </p>
            </div>
            
            {/* Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setShowRejectionNoteModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#1F2937',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t('common.close', 'Kapat')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateHistoryModal;

