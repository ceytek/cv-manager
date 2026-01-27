/**
 * Second Interview Feedback Modal
 * 2. Görüşme - Geri bildirim modalı
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@apollo/client/react';
import { 
  X, 
  MessageSquare, 
  Check, 
  XCircle, 
  Clock,
  UserX,
  ThumbsUp,
  ThumbsDown,
  ClipboardList,
  Calendar,
  Video,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { 
  SUBMIT_SECOND_INTERVIEW_FEEDBACK,
  CANCEL_SECOND_INTERVIEW,
  GET_SECOND_INTERVIEW_BY_APPLICATION,
  INTERVIEW_STATUS,
  INTERVIEW_OUTCOME 
} from '../graphql/secondInterview';

const SecondInterviewFeedbackModal = ({ 
  isOpen, 
  onClose, 
  application,
  onSuccess,
  onOpenRejectionModal,
  onOpenLikertModal,
}) => {
  const { t } = useTranslation();
  
  // Fetch second interview data from backend
  const { data: interviewData, loading: loadingInterview } = useQuery(GET_SECOND_INTERVIEW_BY_APPLICATION, {
    variables: { applicationId: application?.id },
    skip: !isOpen || !application?.id,
    fetchPolicy: 'network-only',
  });
  
  const secondInterview = interviewData?.secondInterviewByApplication;
  
  // Form state
  const [status, setStatus] = useState(INTERVIEW_STATUS.COMPLETED);
  const [outcome, setOutcome] = useState('');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  
  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successOutcome, setSuccessOutcome] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const [submitFeedback] = useMutation(SUBMIT_SECOND_INTERVIEW_FEEDBACK);
  const [cancelInterview] = useMutation(CANCEL_SECOND_INTERVIEW);

  const candidate = secondInterview?.application?.candidate || application?.candidate;
  const job = secondInterview?.application?.job || application?.job;

  // Status options
  const statusOptions = [
    { 
      value: INTERVIEW_STATUS.COMPLETED, 
      label: t('secondInterview.feedback.statusCompleted', 'Görüşme Tamamlandı'),
      icon: Check,
      color: '#10B981',
      bg: '#D1FAE5'
    },
    { 
      value: INTERVIEW_STATUS.NO_SHOW, 
      label: t('secondInterview.feedback.statusNoShow', 'Aday Gelmedi'),
      icon: UserX,
      color: '#F59E0B',
      bg: '#FEF3C7'
    },
  ];

  // Outcome options (only shown when status is completed)
  const outcomeOptions = [
    { 
      value: INTERVIEW_OUTCOME.PASSED, 
      label: t('secondInterview.feedback.outcomePassed', 'Başarılı - Bir Sonraki Aşamaya Geç'),
      icon: ThumbsUp,
      color: '#10B981',
      bg: '#D1FAE5',
      description: t('secondInterview.feedback.passedDesc', 'Aday teklif sürecine yönlendirilecek')
    },
    { 
      value: INTERVIEW_OUTCOME.PENDING_LIKERT, 
      label: t('secondInterview.feedback.outcomeLikert', 'Likert Teste Yönlendir'),
      icon: ClipboardList,
      color: '#3B82F6',
      bg: '#DBEAFE',
      description: t('secondInterview.feedback.likertDesc', 'Adaya Likert test daveti gönderilecek')
    },
    { 
      value: INTERVIEW_OUTCOME.REJECTED, 
      label: t('secondInterview.feedback.outcomeRejected', 'Red'),
      icon: ThumbsDown,
      color: '#EF4444',
      bg: '#FEE2E2',
      description: t('secondInterview.feedback.rejectedDesc', 'Aday süreçten elenecek')
    },
  ];

  const handleSubmit = async () => {
    setError('');
    
    // Validation
    if (status === INTERVIEW_STATUS.COMPLETED && !outcome) {
      setError(t('secondInterview.feedback.errorOutcomeRequired', 'Lütfen bir sonuç seçin'));
      return;
    }

    setSubmitting(true);

    try {
      const result = await submitFeedback({
        variables: {
          input: {
            id: secondInterview.id,
            status,
            outcome: status === INTERVIEW_STATUS.COMPLETED ? outcome : null,
            feedbackNotes: feedbackNotes || null,
          },
        },
      });

      if (result.data?.submitSecondInterviewFeedback?.success) {
        setSuccess(true);
        setSuccessOutcome(outcome); // Store outcome for success message
        onSuccess?.();
        
        // After success, open rejection modal if rejected
        // For Likert: status is already updated, user can send invite from candidate list
        if (outcome === INTERVIEW_OUTCOME.REJECTED) {
          // Close this modal and open rejection modal
          setTimeout(() => {
            onClose();
            onOpenRejectionModal?.(application);
          }, 1500);
        }
        // Likert and Passed: just show success message, no extra modal
      } else {
        setError(result.data?.submitSecondInterviewFeedback?.message || t('common.error'));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setSubmitting(true);
    setError('');

    try {
      const result = await cancelInterview({
        variables: { id: secondInterview.id },
      });

      if (result.data?.cancelSecondInterview?.success) {
        setSuccess(true);
        onSuccess?.();
      } else {
        setError(result.data?.cancelSecondInterview?.message || t('common.error'));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
      setShowCancelConfirm(false);
    }
  };

  const formatDateTime = (date, time) => {
    if (!date) return '-';
    const d = new Date(`${date}T${time || '00:00'}`);
    return d.toLocaleString('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: time ? '2-digit' : undefined,
      minute: time ? '2-digit' : undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      background: 'rgba(0,0,0,0.5)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 1000 
    }}>
      <div style={{ 
        background: 'white', 
        borderRadius: '16px', 
        width: '90%', 
        maxWidth: '560px', 
        maxHeight: '90vh', 
        overflow: 'auto' 
      }}>
        {/* Header */}
        <div style={{ 
          padding: '20px 24px', 
          background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', 
          borderRadius: '16px 16px 0 0', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'white' }}>
            <MessageSquare size={24} />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              {t('secondInterview.feedback.title', '2. Görüşme Geri Bildirimi')}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              padding: '8px', 
              background: 'rgba(255,255,255,0.2)', 
              border: 'none', 
              cursor: 'pointer', 
              borderRadius: '8px' 
            }}
          >
            <X size={20} color="white" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {loadingInterview ? (
            /* Loading State */
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="loading-spinner" style={{ width: 32, height: 32, margin: '0 auto 16px' }} />
              <p style={{ color: '#6B7280' }}>{t('common.loading', 'Yükleniyor...')}</p>
            </div>
          ) : !secondInterview ? (
            /* No Interview Found */
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                background: '#FEE2E2', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <AlertCircle size={32} color="#EF4444" />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                {t('secondInterview.feedback.notFound', 'Görüşme Bulunamadı')}
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
                {t('secondInterview.feedback.notFoundDesc', 'Bu aday için 2. görüşme daveti bulunmuyor.')}
              </p>
            </div>
          ) : success ? (
            /* Success State */
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                background: '#D1FAE5', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Check size={32} color="#10B981" />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                {t('secondInterview.feedback.successTitle', 'Geri Bildirim Kaydedildi!')}
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
                {successOutcome === INTERVIEW_OUTCOME.REJECTED 
                  ? t('secondInterview.feedback.successRejected', 'Aday reddedildi. Red mesajı göndermek için yönlendiriliyorsunuz...')
                  : successOutcome === INTERVIEW_OUTCOME.PENDING_LIKERT
                  ? t('secondInterview.feedback.successLikert', 'Aday Likert Teste yönlendirildi. Aday listesinden Likert daveti gönderebilirsiniz.')
                  : successOutcome === INTERVIEW_OUTCOME.PASSED
                  ? t('secondInterview.feedback.successPassed', 'Aday başarılı olarak işaretlendi. Teklif süreci için hazır.')
                  : t('secondInterview.feedback.successDesc', 'Görüşme sonucu başarıyla kaydedildi.')}
              </p>
            </div>
          ) : secondInterview?.status && secondInterview.status !== 'invited' ? (
            /* View-Only State for Completed/No-Show/Cancelled Interviews */
            <div>
              {/* Interview Info Card */}
              <div style={{ 
                background: '#F9FAFB', 
                borderRadius: '12px', 
                padding: '16px', 
                marginBottom: '20px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  {candidate?.cvPhotoPath ? (
                    <img 
                      src={candidate.cvPhotoPath} 
                      alt={candidate.name}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: 'white', 
                      fontWeight: '600', 
                      fontSize: '18px' 
                    }}>
                      {candidate?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: '#111827' }}>{candidate?.name}</div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>{job?.title}</div>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280' }}>
                    <Calendar size={14} />
                    <span>{formatDateTime(secondInterview?.scheduledDate, secondInterview?.scheduledTime)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280' }}>
                    {secondInterview?.interviewType === 'online' ? (
                      <>
                        <Video size={14} />
                        <span>
                          {t('secondInterview.feedback.online', 'Online')} 
                          {secondInterview?.platform && ` - ${secondInterview.platform.replace('_', ' ').toUpperCase()}`}
                        </span>
                      </>
                    ) : (
                      <>
                        <MapPin size={14} />
                        <span>{t('secondInterview.feedback.inPerson', 'Yüz Yüze')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Interview Result */}
              <div style={{ 
                background: secondInterview.status === 'completed' 
                  ? (secondInterview.outcome === 'passed' ? '#D1FAE5' : secondInterview.outcome === 'rejected' ? '#FEE2E2' : '#DBEAFE')
                  : secondInterview.status === 'no_show' ? '#FEF3C7' 
                  : '#F3F4F6',
                borderRadius: '12px', 
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '50%', 
                  background: 'white',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  {secondInterview.status === 'completed' ? (
                    secondInterview.outcome === 'passed' ? <ThumbsUp size={28} color="#10B981" /> :
                    secondInterview.outcome === 'rejected' ? <ThumbsDown size={28} color="#EF4444" /> :
                    <ClipboardList size={28} color="#3B82F6" />
                  ) : secondInterview.status === 'no_show' ? (
                    <UserX size={28} color="#F59E0B" />
                  ) : (
                    <XCircle size={28} color="#6B7280" />
                  )}
                </div>
                
                <h3 style={{ 
                  margin: '0 0 8px', 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: secondInterview.status === 'completed' 
                    ? (secondInterview.outcome === 'passed' ? '#059669' : secondInterview.outcome === 'rejected' ? '#DC2626' : '#2563EB')
                    : secondInterview.status === 'no_show' ? '#D97706' 
                    : '#4B5563'
                }}>
                  {secondInterview.status === 'completed' ? (
                    secondInterview.outcome === 'passed' ? t('secondInterview.feedback.resultPassed', 'Başarılı - Teklif Aşamasına Geçirildi') :
                    secondInterview.outcome === 'rejected' ? t('secondInterview.feedback.resultRejected', 'Red Verildi') :
                    secondInterview.outcome === 'pending_likert' ? t('secondInterview.feedback.resultLikert', 'Likert Teste Yönlendirildi') :
                    t('secondInterview.feedback.resultCompleted', 'Mülakat Tamamlandı')
                  ) : secondInterview.status === 'no_show' ? (
                    t('secondInterview.feedback.resultNoShow', 'Aday Gelmedi')
                  ) : (
                    t('secondInterview.feedback.resultCancelled', 'Mülakat İptal Edildi')
                  )}
                </h3>
                
                {secondInterview.feedbackNotes && (
                  <div style={{ 
                    marginTop: '16px', 
                    padding: '12px', 
                    background: 'white', 
                    borderRadius: '8px',
                    textAlign: 'left'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '4px' }}>
                      {t('secondInterview.feedback.notes', 'Notlar')}:
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: '#374151', whiteSpace: 'pre-wrap' }}>
                      {secondInterview.feedbackNotes}
                    </p>
                  </div>
                )}

                {secondInterview.feedbackAt && (
                  <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#6B7280' }}>
                    {t('secondInterview.feedback.feedbackDate', 'Geri bildirim tarihi')}: {new Date(secondInterview.feedbackAt).toLocaleString('tr-TR')}
                  </p>
                )}
              </div>

              {/* Close Button */}
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={onClose}
                  style={{
                    padding: '12px 32px',
                    background: '#6B7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  {t('common.close', 'Kapat')}
                </button>
              </div>
            </div>
          ) : showCancelConfirm ? (
            /* Cancel Confirmation */
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                background: '#FEE2E2', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <AlertCircle size={32} color="#EF4444" />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                {t('secondInterview.feedback.cancelConfirmTitle', 'Görüşmeyi İptal Et')}
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#6B7280' }}>
                {t('secondInterview.feedback.cancelConfirmDesc', '{{name}} için planlanan görüşmeyi iptal etmek istediğinize emin misiniz?', { name: candidate?.name })}
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={submitting}
                  style={{
                    padding: '10px 20px',
                    background: '#F3F4F6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  {t('common.back', 'Geri')}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={submitting}
                  style={{
                    padding: '10px 20px',
                    background: '#EF4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting 
                    ? t('common.cancelling', 'İptal Ediliyor...') 
                    : t('secondInterview.feedback.confirmCancel', 'Evet, İptal Et')}
                </button>
              </div>
            </div>
          ) : (
            /* Form State */
            <>
              {error && (
                <div style={{ 
                  padding: '12px', 
                  background: '#FEE2E2', 
                  color: '#DC2626', 
                  borderRadius: '8px', 
                  marginBottom: '16px', 
                  fontSize: '14px' 
                }}>
                  {error}
                </div>
              )}

              {/* Interview Info Card */}
              <div style={{ 
                background: '#F9FAFB', 
                borderRadius: '12px', 
                padding: '16px', 
                marginBottom: '20px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  {candidate?.cvPhotoPath ? (
                    <img 
                      src={candidate.cvPhotoPath} 
                      alt={candidate.name}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: 'white', 
                      fontWeight: '600', 
                      fontSize: '18px' 
                    }}>
                      {candidate?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: '#111827' }}>{candidate?.name}</div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>{job?.title}</div>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280' }}>
                    <Calendar size={14} />
                    <span>{formatDateTime(secondInterview?.scheduledDate, secondInterview?.scheduledTime)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280' }}>
                    {secondInterview?.interviewType === 'online' ? (
                      <>
                        <Video size={14} />
                        <span>
                          {t('secondInterview.feedback.online', 'Online')} 
                          {secondInterview?.platform && ` - ${secondInterview.platform.replace('_', ' ').toUpperCase()}`}
                        </span>
                      </>
                    ) : (
                      <>
                        <MapPin size={14} />
                        <span>{t('secondInterview.feedback.inPerson', 'Yüz Yüze')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '10px' 
                }}>
                  {t('secondInterview.feedback.status', 'Görüşme Durumu')}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {statusOptions.map(opt => {
                    const Icon = opt.icon;
                    const isSelected = status === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setStatus(opt.value);
                          if (opt.value !== INTERVIEW_STATUS.COMPLETED) {
                            setOutcome('');
                          }
                        }}
                        style={{
                          padding: '14px 16px',
                          border: `2px solid ${isSelected ? opt.color : '#E5E7EB'}`,
                          borderRadius: '10px',
                          background: isSelected ? opt.bg : 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'all 0.2s',
                        }}
                      >
                        <Icon size={20} color={isSelected ? opt.color : '#9CA3AF'} />
                        <span style={{ 
                          fontWeight: '600', 
                          color: isSelected ? opt.color : '#374151',
                          fontSize: '14px'
                        }}>
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Outcome Selection (only for completed status) */}
              {status === INTERVIEW_STATUS.COMPLETED && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '10px' 
                  }}>
                    {t('secondInterview.feedback.outcome', 'Sonuç')} *
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {outcomeOptions.map(opt => {
                      const Icon = opt.icon;
                      const isSelected = outcome === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setOutcome(opt.value)}
                          style={{
                            padding: '14px 16px',
                            border: `2px solid ${isSelected ? opt.color : '#E5E7EB'}`,
                            borderRadius: '10px',
                            background: isSelected ? opt.bg : 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            transition: 'all 0.2s',
                            textAlign: 'left',
                          }}
                        >
                          <Icon size={20} color={isSelected ? opt.color : '#9CA3AF'} style={{ marginTop: '2px' }} />
                          <div>
                            <span style={{ 
                              fontWeight: '600', 
                              color: isSelected ? opt.color : '#374151',
                              fontSize: '14px',
                              display: 'block'
                            }}>
                              {opt.label}
                            </span>
                            <span style={{ 
                              fontSize: '12px', 
                              color: '#6B7280',
                              marginTop: '2px',
                              display: 'block'
                            }}>
                              {opt.description}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Feedback Notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '8px' 
                }}>
                  <MessageSquare size={16} />
                  {t('secondInterview.feedback.notes', 'Notlar')}
                  <span style={{ fontWeight: '400', color: '#9CA3AF' }}>
                    ({t('common.optional', 'Opsiyonel')})
                  </span>
                </label>
                <textarea
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder={t('secondInterview.feedback.notesPlaceholder', 'Görüşme hakkında notlarınız...')}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Cancel Interview Link */}
              <div style={{ 
                borderTop: '1px solid #E5E7EB', 
                paddingTop: '16px',
                textAlign: 'center'
              }}>
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#EF4444',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <XCircle size={16} />
                  {t('secondInterview.feedback.cancelInterview', 'Görüşmeyi İptal Et')}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && !showCancelConfirm && !loadingInterview && secondInterview && (
          <div style={{ 
            padding: '16px 24px', 
            borderTop: '1px solid #E5E7EB', 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '12px' 
          }}>
            <button 
              onClick={onClose} 
              disabled={submitting}
              style={{ 
                background: '#F3F4F6', 
                color: '#374151', 
                padding: '10px 20px', 
                borderRadius: '8px', 
                border: 'none', 
                cursor: 'pointer', 
                fontWeight: '600',
                opacity: submitting ? 0.5 : 1,
              }}
            >
              {t('common.cancel', 'İptal')}
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={submitting}
              style={{ 
                background: '#8B5CF6', 
                color: 'white', 
                padding: '10px 24px', 
                borderRadius: '8px', 
                border: 'none', 
                cursor: 'pointer', 
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              <Check size={18} />
              {submitting 
                ? t('common.saving', 'Kaydediliyor...') 
                : t('secondInterview.feedback.save', 'Kaydet')}
            </button>
          </div>
        )}
        
        {/* Close button when no interview found or loading */}
        {!loadingInterview && !secondInterview && (
          <div style={{ 
            padding: '16px 24px', 
            borderTop: '1px solid #E5E7EB', 
            display: 'flex', 
            justifyContent: 'flex-end' 
          }}>
            <button 
              onClick={onClose} 
              style={{ 
                background: '#374151', 
                color: 'white', 
                padding: '10px 24px', 
                borderRadius: '8px', 
                border: 'none', 
                cursor: 'pointer', 
                fontWeight: '600' 
              }}
            >
              {t('common.close', 'Kapat')}
            </button>
          </div>
        )}

        {success && (
          <div style={{ 
            padding: '16px 24px', 
            borderTop: '1px solid #E5E7EB', 
            display: 'flex', 
            justifyContent: 'flex-end' 
          }}>
            <button 
              onClick={onClose} 
              style={{ 
                background: '#374151', 
                color: 'white', 
                padding: '10px 24px', 
                borderRadius: '8px', 
                border: 'none', 
                cursor: 'pointer', 
                fontWeight: '600' 
              }}
            >
              {t('common.close', 'Kapat')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecondInterviewFeedbackModal;
