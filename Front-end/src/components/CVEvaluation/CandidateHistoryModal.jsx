/**
 * Candidate History Modal
 * Shows timeline of all candidate activities from application_history table
 */
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@apollo/client/react';
import { X, FileText, BarChart2, Video, ListChecks, CheckCircle2, Clock, Send, Download, XCircle, FileSearch, Upload, Play, UserCheck, UserX, MessageSquare, Search, Loader2, Sparkles, Bot, Users } from 'lucide-react';
import { GET_APPLICATION_HISTORY } from '../../graphql/history';
import { API_BASE_URL } from '../../config/api';

// Icon mapping for action types
const ICON_MAP = {
  'upload': Upload,
  'search': Search,
  'send': Send,
  'play': Play,
  'check-circle': CheckCircle2,
  'video': Video,
  'x-circle': XCircle,
  'user-check': UserCheck,
  'user-x': UserX,
  'users': Users,
  'message-square': MessageSquare,
  'file-text': FileText,
  'bar-chart-2': BarChart2,
  'sparkles': Sparkles,
  'bot': Bot,
};

// Fallback icon
const getIcon = (iconName) => ICON_MAP[iconName] || FileText;

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
  const [selectedNote, setSelectedNote] = useState(null);

  // Fetch history from new API
  const { data: historyData, loading: historyLoading } = useQuery(GET_APPLICATION_HISTORY, {
    variables: { applicationId },
    skip: !applicationId || !isOpen,
    fetchPolicy: 'network-only',
  });

  if (!isOpen) return null;

  const application = applicationData;
  const historyEntries = historyData?.applicationHistory?.entries || [];

  // Build timeline events from history entries
  const events = useMemo(() => {
    return historyEntries.map((entry) => {
      const actionType = entry.actionType || {};
      const IconComponent = getIcon(actionType.icon);
      const actionCode = actionType.code || '';
      
      // Determine badge based on action type
      let badge = null;
      if (actionCode === 'cv_analyzed' && entry.actionData?.score) {
        const score = entry.actionData.score;
        badge = {
          text: isEnglish ? `${Math.round(score)}% Match` : `%${Math.round(score)} Eşleşme`,
          color: score >= 70 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444',
        };
      } else if (['likert_completed', 'interview_completed'].includes(actionCode)) {
        badge = {
          text: isEnglish ? 'Completed' : 'Tamamlandı',
          color: '#10B981',
        };
      } else if (actionCode === 'second_interview_completed') {
        // Badge based on outcome
        const outcome = entry.actionData?.outcome;
        if (outcome === 'passed') {
          badge = {
            text: isEnglish ? 'Passed' : 'Başarılı',
            color: '#10B981',
          };
        } else if (outcome === 'rejected') {
          badge = {
            text: isEnglish ? 'Rejected' : 'Reddedildi',
            color: '#DC2626',
          };
        } else if (outcome === 'pending_likert') {
          badge = {
            text: isEnglish ? 'Likert Test' : 'Likert Test',
            color: '#3B82F6',
          };
        } else {
          badge = {
            text: isEnglish ? 'Completed' : 'Tamamlandı',
            color: '#10B981',
          };
        }
      } else if (actionCode === 'rejected') {
        badge = {
          text: isEnglish ? 'Rejected' : 'Reddedildi',
          color: '#DC2626',
        };
      }

      // Determine action button
      let action = null;
      if (actionCode === 'likert_completed' && onViewLikertResults) {
        action = {
          label: isEnglish ? 'View Results' : 'Sonuçları Gör',
          onClick: () => onViewLikertResults(),
        };
      } else if (actionCode === 'interview_completed' && onViewInterviewResults) {
        action = {
          label: isEnglish ? 'View Results' : 'Sonuçları Gör',
          onClick: () => onViewInterviewResults(),
        };
      } else if (actionCode === 'rejected' && entry.note) {
        action = {
          label: isEnglish ? 'View Note' : 'Notu Görüntüle',
          onClick: () => {
            setSelectedNote(entry.note);
            setShowRejectionNoteModal(true);
          },
        };
      }

      // Description based on action type
      let description = '';
      if (entry.performedByName) {
        description = isEnglish 
          ? `Performed by ${entry.performedByName}`
          : `${entry.performedByName} tarafından gerçekleştirildi`;
      } else {
        // System or candidate action
        const descriptions = {
          'cv_uploaded': isEnglish ? 'CV was uploaded to the system.' : 'CV sisteme yüklendi.',
          'cv_analyzed': isEnglish ? 'CV was analyzed by AI system.' : 'CV yapay zeka tarafından analiz edildi.',
          'likert_sent': isEnglish ? 'Likert test link was shared with the candidate.' : 'Likert test bağlantısı aday ile paylaşıldı.',
          'likert_started': isEnglish ? 'Candidate started the Likert test.' : 'Aday Likert testine başladı.',
          'likert_completed': isEnglish ? 'Candidate completed the Likert test.' : 'Aday Likert testini tamamladı.',
          'interview_sent': isEnglish ? 'AI Interview link was shared with the candidate.' : 'AI Görüşme bağlantısı aday ile paylaşıldı.',
          'interview_started': isEnglish ? 'Candidate started the AI Interview.' : 'Aday AI Görüşmeye başladı.',
          'interview_completed': isEnglish ? 'Candidate completed the AI Interview.' : 'Aday AI Görüşmeyi tamamladı.',
          'second_interview_sent': isEnglish ? 'Face-to-face/Online interview invitation was sent.' : 'Yüzyüze/Online görüşme daveti gönderildi.',
          'second_interview_completed': isEnglish ? 'Face-to-face/Online interview was completed.' : 'Yüzyüze/Online görüşme tamamlandı.',
          'second_interview_no_show': isEnglish ? 'Candidate did not attend the interview.' : 'Aday görüşmeye gelmedi.',
          'second_interview_cancelled': isEnglish ? 'Face-to-face/Online interview was cancelled.' : 'Yüzyüze/Online görüşme iptal edildi.',
          'rejected': isEnglish ? 'Application has been rejected.' : 'Başvuru reddedildi.',
          'hired': isEnglish ? 'Candidate has been hired!' : 'Aday işe alındı!',
          'note_added': isEnglish ? 'A note was added.' : 'Not eklendi.',
        };
        description = descriptions[actionCode] || '';
        
        // Add outcome text for second interview completed
        if (actionCode === 'second_interview_completed' && entry.actionData?.outcome_text) {
          description += ` → ${entry.actionData.outcome_text}`;
        }
      }

      // Add interview number to title for second interview actions
      let title = isEnglish ? actionType.nameEn : actionType.nameTr;
      if (['second_interview_sent', 'second_interview_completed', 'second_interview_no_show', 'second_interview_cancelled'].includes(actionCode)) {
        const interviewNumber = entry.actionData?.interview_number;
        if (interviewNumber) {
          title = `${interviewNumber}. ${title}`;
        }
      }

      return {
        id: entry.id,
        type: actionCode,
        title,
        description,
        date: new Date(entry.createdAt),
        icon: IconComponent,
        color: actionType.color ? 
          (actionType.color.startsWith('#') ? actionType.color : getColorHex(actionType.color)) : 
          '#6B7280',
        badge,
        action,
        note: entry.note,
        actionData: entry.actionData,
      };
    });
  }, [historyEntries, isEnglish, onViewLikertResults, onViewInterviewResults]);

  // Color name to hex mapping
  function getColorHex(colorName) {
    const colors = {
      'blue': '#3B82F6',
      'purple': '#8B5CF6',
      'orange': '#F59E0B',
      'green': '#10B981',
      'red': '#DC2626',
      'gray': '#6B7280',
    };
    return colors[colorName] || '#6B7280';
  }

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
          {historyLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
              <Loader2 size={32} style={{ color: '#3B82F6', animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
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
                            href={`${API_BASE_URL}${event.extra.filePath?.replace('/app', '') || ''}`}
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
          )}
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
      {showRejectionNoteModal && selectedNote && (
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
                onClick={() => { setShowRejectionNoteModal(false); setSelectedNote(null); }}
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
                  {selectedNote}
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
                onClick={() => { setShowRejectionNoteModal(false); setSelectedNote(null); }}
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

