/**
 * Likert Test Invite Modal
 * Creates test link only when user clicks "Send Invitation"
 * Same flow as AI Interview Invite Modal
 */
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@apollo/client/react';
import { X, ClipboardList, Copy, Check, Clock, AlertTriangle, Hash, Mail, Eye, Link2, Send } from 'lucide-react';
import { CREATE_LIKERT_SESSION, GET_LIKERT_SESSION_BY_APPLICATION } from '../graphql/likert';
import { JOB_QUERY } from '../graphql/jobs';
import { GET_LIKERT_TEMPLATES } from '../graphql/likertTemplate';
import { GET_INTERVIEW_SESSION_BY_APPLICATION } from '../graphql/interview';
import { GET_SECOND_INTERVIEW_BY_APPLICATION } from '../graphql/secondInterview';

const LikertInviteModal = ({ isOpen, onClose, candidate, application, jobId, onSuccess }) => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [sessionDetails, setSessionDetails] = useState(null);
  const [sessionStatus, setSessionStatus] = useState(null);
  const [error, setError] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Fetch job data
  const { data: jobData, loading: jobLoading } = useQuery(JOB_QUERY, {
    variables: { id: jobId },
    skip: !jobId,
    fetchPolicy: 'network-only',
  });

  // Check for existing Likert session
  const { data: existingSessionData, loading: checkingExisting } = useQuery(GET_LIKERT_SESSION_BY_APPLICATION, {
    variables: { applicationId: application?.id },
    skip: !application?.id || !isOpen,
    fetchPolicy: 'network-only',
  });

  // Check for active AI Interview session
  const { data: aiInterviewData, loading: aiInterviewLoading } = useQuery(GET_INTERVIEW_SESSION_BY_APPLICATION, {
    variables: { applicationId: application?.id },
    skip: !application?.id || !isOpen,
    fetchPolicy: 'network-only',
  });

  // Check for active Second Interview
  const { data: secondInterviewData, loading: secondInterviewLoading } = useQuery(GET_SECOND_INTERVIEW_BY_APPLICATION, {
    variables: { applicationId: application?.id },
    skip: !application?.id || !isOpen,
    fetchPolicy: 'network-only',
  });

  // Fetch email templates
  const { data: templatesData } = useQuery(GET_LIKERT_TEMPLATES, {
    fetchPolicy: 'network-only',
  });

  const [createSession] = useMutation(CREATE_LIKERT_SESSION);
  
  // Check if there's an active (not completed/expired) Likert session
  const existingSession = existingSessionData?.likertSessionByApplication;
  const hasActiveSession = existingSession && 
    existingSession.status !== 'completed' && 
    existingSession.status !== 'expired';
  
  // Check for active sessions blocking this invitation
  const activeAIInterview = aiInterviewData?.interviewSessionByApplication;
  const hasActiveAIInterview = activeAIInterview && ['pending', 'in_progress'].includes(activeAIInterview.status?.toLowerCase());
  
  const activeSecondInterview = secondInterviewData?.secondInterviewByApplication;
  const hasActiveSecondInterview = activeSecondInterview && activeSecondInterview.status?.toLowerCase() === 'invited';
  
  const isBlocked = hasActiveAIInterview || hasActiveSecondInterview;
  const blockingType = hasActiveAIInterview 
    ? (isEnglish ? 'AI Interview' : 'AI Görüşmesi') 
    : hasActiveSecondInterview 
      ? (isEnglish ? 'Face-to-Face/Online Interview' : 'Yüzyüze/Online Mülakat') 
      : null;
  
  // Auto-populate if there's an existing active session
  useEffect(() => {
    if (hasActiveSession && existingSession && !generatedLink) {
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/likert/${existingSession.token}`;
      setGeneratedLink(link);
      setSessionStatus('existing');
      setSessionDetails({
        status: existingSession.status,
        expiresAt: existingSession.expiresAt,
        templateName: existingSession.template?.name,
        questionCount: existingSession.template?.questionCount || 0,
        scaleType: existingSession.template?.scaleType || 5,
        createdAt: existingSession.createdAt,
      });
    }
  }, [hasActiveSession, existingSession, generatedLink]);

  const job = jobData?.job;
  const likertEnabled = job?.likertEnabled;
  const likertTemplate = job?.likertTemplate;
  const questionCount = likertTemplate?.questionCount || 0;
  const scaleType = likertTemplate?.scaleType || 5;
  const deadlineHours = job?.likertDeadlineHours || 72;

  const emailTemplates = templatesData?.likertEmailTemplates?.filter(t => t.isActive) || [];

  // Auto-select default template
  useEffect(() => {
    if (emailTemplates.length > 0 && !selectedTemplateId) {
      const defaultTemplate = emailTemplates.find(t => t.isDefault) || emailTemplates[0];
      setSelectedTemplateId(defaultTemplate?.id || '');
    }
  }, [emailTemplates, selectedTemplateId]);

  const selectedTemplate = useMemo(() => {
    return emailTemplates.find(t => t.id === selectedTemplateId);
  }, [emailTemplates, selectedTemplateId]);

  // Calculate expiry date
  const expiryDate = useMemo(() => {
    if (sessionDetails?.expiresAt) {
      return new Date(sessionDetails.expiresAt);
    }
    const date = new Date();
    date.setHours(date.getHours() + deadlineHours);
    return date;
  }, [deadlineHours, sessionDetails?.expiresAt]);

  // Replace variables in template
  const getPreviewText = (text) => {
    if (!text) return '';
    
    const replacements = {
      '{candidate_name}': candidate?.name || (isEnglish ? 'Candidate Name' : 'Aday Adı'),
      '{position}': job?.title || (isEnglish ? 'Position' : 'Pozisyon'),
      '{company_name}': isEnglish ? 'Company Name' : 'Şirket Adı',
      '{test_link}': generatedLink || (isEnglish ? '[Link will be generated]' : '[Link oluşturulacak]'),
      '{expiry_date}': expiryDate.toLocaleDateString(isEnglish ? 'en-US' : 'tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }) + ' - ' + expiryDate.toLocaleTimeString(isEnglish ? 'en-US' : 'tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };

    let result = text;
    Object.entries(replacements).forEach(([key, value]) => {
      result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });
    return result;
  };

  // Send invitation - creates the link
  const handleSendInvitation = async () => {
    setSending(true);
    setError('');

    try {
      const result = await createSession({
        variables: {
          input: {
            jobId,
            candidateId: candidate.id,
            applicationId: application?.id,
          },
        },
      });

      if (result.data?.createLikertSession?.success) {
        const link = result.data.createLikertSession.likertLink;
        const session = result.data.createLikertSession.session;
        const message = result.data.createLikertSession.message;
        
        setGeneratedLink(link);
        
        if (session?.status === 'completed') {
          setSessionStatus('completed');
        } else if (session?.status === 'expired') {
          setSessionStatus('expired');
        } else if (message.includes('zaten gönderildi') || message.includes('Existing') || message.includes('already')) {
          setSessionStatus('existing');
        } else {
          setSessionStatus('new');
        }
        
        setSessionDetails({
          status: session?.status,
          expiresAt: session?.expiresAt,
          templateName: likertTemplate?.name,
          questionCount,
          scaleType,
        });
        onSuccess?.();
      } else {
        setError(result.data?.createLikertSession?.message || t('common.error'));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(generatedLink);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = generatedLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert(isEnglish ? 'Copy failed. Please select and copy the link manually.' : 'Kopyalama başarısız. Lütfen linki manuel olarak seçip kopyalayın.');
    }
  };

  const getStatusLabel = (status) => {
    const labels = isEnglish 
      ? { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed', expired: 'Expired' }
      : { pending: 'Bekliyor', in_progress: 'Devam Ediyor', completed: 'Tamamlandı', expired: 'Süresi Dolmuş' };
    return labels[status?.toLowerCase()] || status;
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setGeneratedLink('');
      setSessionDetails(null);
      setSessionStatus(null);
      setError('');
      setSending(false);
      setCopied(false);
      setSelectedTemplateId('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '95%', maxWidth: '750px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'white' }}>
            <ClipboardList size={24} />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{t('likertInvite.title')}</h2>
          </div>
          <button onClick={onClose} style={{ padding: '8px', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', borderRadius: '8px' }}>
            <X size={20} color="white" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Loading */}
          {(jobLoading || checkingExisting || aiInterviewLoading || secondInterviewLoading) && (
            <div style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>
              {t('common.loading')}
            </div>
          )}

          {/* Blocking Warning - Active AI Interview or Second Interview */}
          {!jobLoading && !checkingExisting && !aiInterviewLoading && !secondInterviewLoading && isBlocked && (
            <div style={{ 
              background: '#FEE2E2', 
              border: '2px solid #DC2626',
              borderRadius: '12px', 
              padding: '20px', 
              textAlign: 'center'
            }}>
              <AlertTriangle size={48} color="#DC2626" style={{ marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 12px', color: '#991B1B', fontSize: '18px' }}>
                {t('likertInvite.cannotSend')}
              </h3>
              <p 
                style={{ margin: '0 0 16px', color: '#DC2626', fontSize: '15px' }}
                dangerouslySetInnerHTML={{ __html: t('likertInvite.hasActiveInvite', { type: blockingType }) }}
              />
              <p style={{ margin: 0, color: '#7F1D1D', fontSize: '14px' }}>
                {t('likertInvite.completeOrCancelFirst')}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: '12px 16px', background: '#FEE2E2', color: '#DC2626', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {/* Likert Not Enabled */}
          {!jobLoading && !checkingExisting && !aiInterviewLoading && !secondInterviewLoading && !isBlocked && !likertEnabled && (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <AlertTriangle size={48} color="#F59E0B" style={{ marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px', color: '#374151' }}>{t('likertInvite.notEnabled')}</h3>
              <p style={{ color: '#6B7280' }}>{t('likertInvite.configureFirst')}</p>
            </div>
          )}

          {/* Main Content */}
          {!jobLoading && !checkingExisting && !aiInterviewLoading && !secondInterviewLoading && !isBlocked && likertEnabled && (
            <>
              {/* Status Banners - Only show after link is created */}
              {generatedLink && sessionStatus === 'existing' && (
                <div style={{ 
                  background: '#FEF3C7', 
                  border: '1px solid #F59E0B',
                  borderRadius: '12px', 
                  padding: '20px', 
                  marginBottom: '20px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                    <AlertTriangle size={24} color="#D97706" style={{ flexShrink: 0 }} />
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '600', color: '#92400E' }}>
                        {t('likertInvite.existingSessionTitle')}
                      </h4>
                      <p style={{ margin: 0, fontSize: '14px', color: '#A16207' }}>
                        {t('likertInvite.existingSessionDesc', { name: candidate?.name })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Session Details */}
                  <div style={{ 
                    background: 'rgba(255,255,255,0.7)', 
                    borderRadius: '8px', 
                    padding: '12px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    fontSize: '13px',
                  }}>
                    <div>
                      <span style={{ color: '#92400E', fontWeight: '500' }}>{t('likertInvite.status')}:</span>{' '}
                      <span style={{ color: '#78350F', fontWeight: '600' }}>
                        {getStatusLabel(sessionDetails?.status)}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#92400E', fontWeight: '500' }}>{t('likertInvite.expiresAt')}:</span>{' '}
                      <span style={{ color: '#78350F', fontWeight: '600' }}>
                        {sessionDetails?.expiresAt ? new Date(sessionDetails.expiresAt).toLocaleString(isEnglish ? 'en-US' : 'tr-TR', {
                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        }) : '-'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#92400E', fontWeight: '500' }}>{t('likertInvite.testTemplate')}:</span>{' '}
                      <span style={{ color: '#78350F', fontWeight: '600' }}>{sessionDetails?.templateName || '-'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#92400E', fontWeight: '500' }}>{t('likertInvite.questionCount')}:</span>{' '}
                      <span style={{ color: '#78350F', fontWeight: '600' }}>{sessionDetails?.questionCount || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {generatedLink && sessionStatus === 'completed' && (
                <div style={{ 
                  background: '#DBEAFE', 
                  border: '1px solid #3B82F6',
                  borderRadius: '12px', 
                  padding: '16px', 
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <Check size={24} color="#1D4ED8" style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '600', color: '#1E40AF' }}>
                      {t('likertInvite.testCompleted')}
                    </h4>
                    <p style={{ margin: 0, fontSize: '14px', color: '#1E40AF' }}>
                      {t('likertInvite.testCompletedDesc', { name: candidate?.name })}
                    </p>
                  </div>
                </div>
              )}

              {generatedLink && sessionStatus === 'new' && (
                <div style={{ 
                  background: '#D1FAE5', 
                  border: '1px solid #10B981',
                  borderRadius: '12px', 
                  padding: '16px', 
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <Check size={24} color="#059669" style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '600', color: '#065F46' }}>
                      {t('likertInvite.inviteCreated')}
                    </h4>
                    <p style={{ margin: 0, fontSize: '14px', color: '#047857' }}>
                      {t('likertInvite.inviteCreatedDesc', { name: candidate?.name })}
                    </p>
                  </div>
                </div>
              )}

              {/* Generated Link Section - Only show after created */}
              {generatedLink && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                    <Link2 size={14} />
                    {t('likertInvite.testLink')}
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={generatedLink}
                      readOnly
                      style={{ flex: 1, padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', background: '#F9FAFB' }}
                    />
                    <button
                      onClick={handleCopy}
                      style={{
                        padding: '12px 20px',
                        background: copied ? '#10B981' : '#8B5CF6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: '600',
                        fontSize: '14px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? t('common.copied') : t('common.copy')}
                    </button>
                  </div>
                </div>
              )}

              {/* Two Column Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Left Column - Candidate Info */}
                <div>
                  {/* Candidate Card */}
                  <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>{t('likertInvite.candidateInfo')}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                      <div>
                        <div style={{ fontWeight: '600', color: '#111827', fontSize: '15px' }}>{candidate?.name || t('common.unknown')}</div>
                        <div style={{ fontSize: '13px', color: '#6B7280' }}>{candidate?.email || t('common.noEmail')}</div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ padding: '16px', background: '#F3E8FF', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#7C3AED', marginBottom: '4px' }}>
                        <Hash size={14} />
                        {t('likertInvite.questionCount')}
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#5B21B6' }}>{questionCount}</div>
                    </div>
                    <div style={{ padding: '16px', background: '#F3E8FF', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#7C3AED', marginBottom: '4px' }}>
                        <Clock size={14} />
                        {t('likertInvite.validity')}
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#5B21B6' }}>{deadlineHours} {t('common.hours')}</div>
                    </div>
                  </div>

                  {/* Test Template Info */}
                  {likertTemplate && (
                    <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px' }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>{t('likertInvite.likertTemplate')}</h4>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#5B21B6' }}>{likertTemplate.name}</div>
                      <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                        {scaleType} {t('likertInvite.optionScale')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Email Template & Preview */}
                <div>
                  {/* Template Selection */}
                  {emailTemplates.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                        <Mail size={14} />
                        {t('likertInvite.emailTemplate')}
                      </label>
                      <select
                        value={selectedTemplateId}
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          background: 'white',
                          cursor: 'pointer',
                        }}
                      >
                        {emailTemplates.map((tmpl) => (
                          <option key={tmpl.id} value={tmpl.id}>
                            {tmpl.name} {tmpl.isDefault ? '⭐' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Email Preview */}
                  {selectedTemplate && (
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                        <Eye size={14} />
                        {t('likertInvite.emailPreview')}
                      </label>
                      <div style={{
                        background: '#F9FAFB',
                        borderRadius: '12px',
                        border: '1px solid #E5E7EB',
                        overflow: 'hidden',
                        maxHeight: '280px',
                        overflowY: 'auto',
                      }}>
                        <div style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #E5E7EB',
                          background: 'white',
                        }}>
                          <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '2px' }}>{t('likertInvite.subject')}:</div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                            {getPreviewText(selectedTemplate.subject)}
                          </div>
                        </div>
                        <div style={{ padding: '16px' }}>
                          <div style={{ 
                            fontSize: '13px', 
                            color: '#374151',
                            whiteSpace: 'pre-wrap',
                            lineHeight: '1.6',
                          }}>
                            {getPreviewText(selectedTemplate.body)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No Template Warning */}
                  {emailTemplates.length === 0 && (
                    <div style={{ 
                      background: '#FEF3C7', 
                      borderRadius: '12px', 
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}>
                      <AlertTriangle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '600', color: '#92400E' }}>
                          {t('likertInvite.noEmailTemplate')}
                        </h4>
                        <p style={{ margin: 0, fontSize: '13px', color: '#A16207' }}>
                          {t('likertInvite.createEmailTemplate')}
                        </p>
                      </div>
                    </div>
                  )}
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
          gap: '12px',
          flexShrink: 0 
        }}>
          <button 
            onClick={onClose} 
            style={{ 
              padding: '10px 20px', 
              background: '#F3F4F6', 
              color: '#374151',
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer' 
            }}
          >
            {t('common.cancel')}
          </button>
          
          {!generatedLink && !isBlocked && likertEnabled && (
            <button 
              onClick={handleSendInvitation} 
              disabled={sending}
              style={{ 
                padding: '10px 24px', 
                background: '#8B5CF6', 
                color: 'white',
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '14px',
                fontWeight: '600',
                cursor: sending ? 'not-allowed' : 'pointer',
                opacity: sending ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Send size={16} />
              {sending ? t('common.sending') : t('likertInvite.sendInvite')}
            </button>
          )}
          
          {generatedLink && (
            <button 
              onClick={onClose}
              style={{ 
                padding: '10px 24px', 
                background: '#8B5CF6', 
                color: 'white',
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {t('common.ok')}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LikertInviteModal;
