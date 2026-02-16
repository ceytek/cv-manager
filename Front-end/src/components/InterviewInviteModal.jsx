/**
 * AI Interview Invite Modal
 * Creates interview link only when user clicks "Send Invitation"
 * Cancel button closes modal without creating anything
 */
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@apollo/client/react';
import { X, Sparkles, Copy, Check, Clock, AlertTriangle, Hash, Mail, Eye, ChevronDown, Link2, Send } from 'lucide-react';
import { CREATE_INTERVIEW_SESSION } from '../graphql/interview';
import { JOB_QUERY } from '../graphql/jobs';
import { GET_AI_INTERVIEW_EMAIL_TEMPLATES } from '../graphql/aiInterviewTemplate';
import { GET_LIKERT_SESSION_BY_APPLICATION } from '../graphql/likert';
import { GET_SECOND_INTERVIEW_BY_APPLICATION } from '../graphql/secondInterview';

const InterviewInviteModal = ({ isOpen, onClose, candidate, application, jobId, onSuccess }) => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [sessionDetails, setSessionDetails] = useState(null);
  const [sessionStatus, setSessionStatus] = useState(null);
  const [error, setError] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  // Fetch job data
  const { data: jobData, loading: jobLoading } = useQuery(JOB_QUERY, {
    variables: { id: jobId },
    skip: !jobId,
    fetchPolicy: 'network-only',
  });

  // Check for active Likert session
  const { data: likertData, loading: likertLoading } = useQuery(GET_LIKERT_SESSION_BY_APPLICATION, {
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
  const { data: templatesData } = useQuery(GET_AI_INTERVIEW_EMAIL_TEMPLATES, {
    variables: { activeOnly: true },
    fetchPolicy: 'network-only',
  });

  const [createSession] = useMutation(CREATE_INTERVIEW_SESSION);
  
  // Check for active sessions blocking this invitation
  const activeLikert = likertData?.likertSessionByApplication;
  const hasActiveLikert = activeLikert && ['pending', 'in_progress'].includes(activeLikert.status?.toLowerCase());
  
  const activeSecondInterview = secondInterviewData?.secondInterviewByApplication;
  const hasActiveSecondInterview = activeSecondInterview && activeSecondInterview.status?.toLowerCase() === 'invited';
  
  const isBlocked = hasActiveLikert || hasActiveSecondInterview;
  const blockingType = hasActiveLikert ? 'Likert Test' : hasActiveSecondInterview ? 'Yüzyüze/Online Mülakat' : null;

  const job = jobData?.job;
  const interviewEnabled = job?.interviewEnabled;
  const interviewTemplate = job?.interviewTemplate;
  const questionCount = interviewTemplate?.questionCount || 0;
  const language = interviewTemplate?.language || 'tr';
  const deadlineHours = job?.interviewDeadlineHours || 48;

  const emailTemplates = templatesData?.aiInterviewEmailTemplates?.templates || [];

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
      '{candidate_name}': candidate?.name || 'Aday Adı',
      '{position}': job?.title || 'Pozisyon',
      '{company_name}': 'Şirket Adı',
      '{interview_link}': generatedLink || '[Link oluşturulacak]',
      '{expiry_date}': expiryDate.toLocaleDateString(isEnglish ? 'en-US' : 'tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }),
      '{expiry_time}': expiryDate.toLocaleTimeString(isEnglish ? 'en-US' : 'tr-TR', { hour: '2-digit', minute: '2-digit' }),
      '{duration}': `${Math.round(questionCount * 2)} ${isEnglish ? 'minutes' : 'dakika'}`,
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

      if (result.data?.createInterviewSession?.success) {
        const link = result.data.createInterviewSession.interviewLink;
        const session = result.data.createInterviewSession.session;
        const message = result.data.createInterviewSession.message;
        
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
          templateName: interviewTemplate?.name,
          questionCount,
          language,
        });
        onSuccess?.();
      } else {
        setError(result.data?.createInterviewSession?.message || 'Hata oluştu');
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
      alert('Kopyalama başarısız. Lütfen linki manuel olarak seçip kopyalayın.');
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleString(isEnglish ? 'en-US' : 'tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getLanguageLabel = (lang) => {
    const labels = isEnglish 
      ? { tr: 'Turkish', en: 'English' }
      : { tr: 'Türkçe', en: 'İngilizce' };
    return labels[lang] || lang;
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
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '95%', maxWidth: '750px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'white' }}>
            <Sparkles size={24} />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{t('interviewInvite.title')}</h2>
          </div>
          <button onClick={onClose} style={{ padding: '8px', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', borderRadius: '8px' }}>
            <X size={20} color="white" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Loading */}
          {(jobLoading || likertLoading || secondInterviewLoading) && (
            <div style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>
              {t('common.loading')}
            </div>
          )}

          {/* Blocking Warning - Active Likert or Second Interview */}
          {!jobLoading && !likertLoading && !secondInterviewLoading && isBlocked && (
            <div style={{ 
              background: '#FEE2E2', 
              border: '2px solid #DC2626',
              borderRadius: '12px', 
              padding: '20px', 
              textAlign: 'center'
            }}>
              <AlertTriangle size={48} color="#DC2626" style={{ marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 12px', color: '#991B1B', fontSize: '18px' }}>
                {t('interviewInvite.cannotSend')}
              </h3>
              <p 
                style={{ margin: '0 0 16px', color: '#DC2626', fontSize: '15px' }}
                dangerouslySetInnerHTML={{ __html: t('interviewInvite.hasActiveInvite', { type: blockingType }) }}
              />
              <p style={{ margin: 0, color: '#7F1D1D', fontSize: '14px' }}>
                {t('interviewInvite.completeOrCancelFirst')}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: '12px 16px', background: '#FEE2E2', color: '#DC2626', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {/* Interview Not Enabled */}
          {!jobLoading && !likertLoading && !secondInterviewLoading && !isBlocked && !interviewEnabled && (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <AlertTriangle size={48} color="#F59E0B" style={{ marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px', color: '#374151' }}>{t('interviewInvite.notEnabled')}</h3>
              <p style={{ color: '#6B7280' }}>{t('interviewInvite.configureFirst')}</p>
            </div>
          )}

          {/* Main Content */}
          {!jobLoading && !likertLoading && !secondInterviewLoading && !isBlocked && interviewEnabled && (
            <>
              {/* Status Banners - Only show after link is created */}
              {generatedLink && sessionStatus === 'existing' && (
                <div style={{ 
                  background: '#FEF3C7', 
                  border: '1px solid #F59E0B',
                  borderRadius: '12px', 
                  padding: '16px', 
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <AlertTriangle size={24} color="#D97706" style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '600', color: '#92400E' }}>
                      {t('interviewInvite.existingSessionTitle')}
                    </h4>
                    <p style={{ margin: 0, fontSize: '14px', color: '#A16207' }}>
                      {t('interviewInvite.existingSessionDesc', { name: candidate?.name })}
                    </p>
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
                      {t('interviewInvite.interviewCompleted')}
                    </h4>
                    <p style={{ margin: 0, fontSize: '14px', color: '#1E40AF' }}>
                      {t('interviewInvite.alreadyCompleted', { name: candidate?.name })}
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
                      {t('interviewInvite.inviteCreated')}
                    </h4>
                    <p style={{ margin: 0, fontSize: '14px', color: '#047857' }}>
                      {t('interviewInvite.linkReady', { name: candidate?.name })}
                    </p>
                  </div>
                </div>
              )}

              {/* Generated Link Section - Only show after created */}
              {generatedLink && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                    <Link2 size={14} />
                    {t('interviewInvite.interviewLink')}
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
                        background: copied ? '#10B981' : '#3B82F6',
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
                {/* Left Column - Candidate & Interview Info */}
                <div>
                  {/* Candidate Info */}
                  <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      {t('interviewInvite.candidateInfo')}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600', fontSize: '18px' }}>
                        {candidate?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#111827' }}>{candidate?.name || t('common.unknown')}</div>
                        <div style={{ fontSize: '13px', color: '#6B7280' }}>{candidate?.email || t('common.noEmail')}</div>
                      </div>
                    </div>
                  </div>

                  {/* Interview Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ padding: '14px', background: '#EFF6FF', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#3B82F6', marginBottom: '4px' }}>
                        <Hash size={14} />
                        {t('interviewInvite.questionCount')}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#1E40AF' }}>{questionCount}</div>
                    </div>
                    <div style={{ padding: '14px', background: '#EFF6FF', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#3B82F6', marginBottom: '4px' }}>
                        <Clock size={14} />
                        {t('interviewInvite.validity')}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#1E40AF' }}>{deadlineHours} {t('common.hours')}</div>
                    </div>
                  </div>

                  {/* Interview Template */}
                  {interviewTemplate && (
                    <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px' }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                        {t('interviewInvite.interviewTemplate')}
                      </h4>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1E40AF' }}>{interviewTemplate.name}</div>
                      <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                        {t('common.language')}: {getLanguageLabel(interviewTemplate.language)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Email Template */}
                <div>
                  {/* Email Template Selection */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                      <Mail size={14} />
                      {t('interviewInvite.emailTemplate')}
                    </label>
                    
                    {emailTemplates.length === 0 ? (
                      <div style={{ padding: '12px', background: '#FEF3C7', borderRadius: '8px', fontSize: '13px', color: '#92400E' }}>
                        {t('interviewInvite.noEmailTemplate')}
                      </div>
                    ) : (
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #D1D5DB',
                            borderRadius: '8px',
                            background: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          <span style={{ color: selectedTemplate ? '#111827' : '#9CA3AF' }}>
                            {selectedTemplate?.name || t('interviewInvite.selectTemplate')}
                          </span>
                          <ChevronDown size={16} color="#6B7280" />
                        </button>
                        
                        {showTemplateDropdown && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: 'white',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            zIndex: 100,
                            maxHeight: '150px',
                            overflowY: 'auto',
                            marginTop: '4px',
                          }}>
                            {emailTemplates.map((template) => (
                              <button
                                key={template.id}
                                onClick={() => {
                                  setSelectedTemplateId(template.id);
                                  setShowTemplateDropdown(false);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  border: 'none',
                                  background: selectedTemplateId === template.id ? '#EFF6FF' : 'white',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  fontSize: '14px',
                                }}
                              >
                                {template.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Email Preview */}
                  {selectedTemplate && (
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                        <Eye size={14} />
                        {t('interviewInvite.emailPreview')}
                      </label>
                      <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden', maxHeight: '250px', overflowY: 'auto' }}>
                        <div style={{ padding: '10px 14px', background: '#F3F4F6', borderBottom: '1px solid #E5E7EB' }}>
                          <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>{t('interviewInvite.subject')}:</div>
                          <div style={{ fontSize: '13px', fontWeight: '500', color: '#1F2937' }}>
                            {getPreviewText(selectedTemplate.subject)}
                          </div>
                        </div>
                        <div style={{ padding: '14px', fontSize: '12px', color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                          {getPreviewText(selectedTemplate.body)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Box - Show after link created */}
              {generatedLink && (
                <div style={{ background: '#FEF3C7', borderRadius: '12px', padding: '14px', fontSize: '14px', color: '#92400E', marginTop: '20px' }}>
                  💡 {t('interviewInvite.linkInfo')}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexShrink: 0 }}>
          {!generatedLink && !isBlocked && interviewEnabled ? (
            <>
              <button 
                onClick={onClose}
                style={{ 
                  padding: '12px 24px', 
                  background: '#F3F4F6', 
                  color: '#374151',
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontWeight: '500',
                  fontSize: '14px',
                }}
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={handleSendInvitation}
                disabled={sending}
                style={{ 
                  padding: '12px 24px', 
                  background: sending ? '#9CA3AF' : '#3B82F6', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: sending ? 'not-allowed' : 'pointer', 
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Send size={18} />
                {sending ? t('common.sending') : t('interviewInvite.sendInvite')}
              </button>
            </>
          ) : (
            <button 
              onClick={onClose}
              style={{ 
                padding: '12px 24px', 
                background: '#374151', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              {t('common.close')}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default InterviewInviteModal;
