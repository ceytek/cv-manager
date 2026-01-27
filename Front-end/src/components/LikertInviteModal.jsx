/**
 * Likert Test Invite Modal
 * Send Likert test invitation to a candidate
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@apollo/client/react';
import { X, ListChecks, Copy, Check, Clock, HelpCircle, Hash, Mail, Eye, EyeOff } from 'lucide-react';
import { CREATE_LIKERT_SESSION } from '../graphql/likert';
import { JOB_QUERY } from '../graphql/jobs';
import { GET_LIKERT_TEMPLATES } from '../graphql/likertTemplate';

const LikertInviteModal = ({ isOpen, onClose, candidate, application, jobId, onSuccess }) => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [sessionDetails, setSessionDetails] = useState(null);
  const [sessionStatus, setSessionStatus] = useState(null); // 'new', 'existing', 'completed', 'expired'
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  
  // Template state
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Fetch fresh job data
  const { data: jobData, loading: jobLoading, error: jobError } = useQuery(JOB_QUERY, {
    variables: { id: jobId },
    skip: !jobId,
    fetchPolicy: 'network-only',
  });
  
  // Fetch email templates
  const { data: templatesData } = useQuery(GET_LIKERT_TEMPLATES, {
    skip: !isOpen,
  });

  const [createSession] = useMutation(CREATE_LIKERT_SESSION);

  const job = jobData?.job;
  const likertEnabled = job?.likertEnabled;
  const likertTemplate = job?.likertTemplate;
  const questionCount = likertTemplate?.questionCount || 0;
  const scaleType = likertTemplate?.scaleType || 5;
  const deadlineHours = job?.likertDeadlineHours || 72;
  
  // Email templates
  const emailTemplates = templatesData?.likertTemplates?.filter(t => t.isActive) || [];
  const selectedEmailTemplate = emailTemplates.find(t => t.id === selectedTemplateId);
  
  // Set default template if available
  useEffect(() => {
    if (emailTemplates.length > 0 && !selectedTemplateId) {
      const defaultTemplate = emailTemplates.find(t => t.isDefault);
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
      } else if (emailTemplates.length === 1) {
        setSelectedTemplateId(emailTemplates[0].id);
      }
    }
  }, [emailTemplates, selectedTemplateId]);
  
  // Replace variables in template
  const replaceVariables = (content) => {
    if (!content) return '';
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + deadlineHours);
    
    return content
      .replace(/{candidate_name}/g, candidate?.name || (isEnglish ? 'Candidate Name' : 'Aday Adı'))
      .replace(/{position}/g, job?.title || (isEnglish ? 'Position' : 'Pozisyon'))
      .replace(/{company_name}/g, job?.companyName || (isEnglish ? 'Company' : 'Şirket'))
      .replace(/{test_link}/g, 'https://hrsmart.app/likert/...')
      .replace(/{expiry_date}/g, expiryDate.toLocaleDateString(isEnglish ? 'en-US' : 'tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }));
  };
  
  // Preview content
  const previewSubject = selectedEmailTemplate ? replaceVariables(selectedEmailTemplate.subject) : '';
  const previewBody = selectedEmailTemplate ? replaceVariables(selectedEmailTemplate.body) : '';

  const handleSend = async () => {
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
        setStatusMessage(message);
        
        // Determine session status based on backend message and session status
        if (session?.status === 'completed') {
          setSessionStatus('completed');
        } else if (session?.status === 'expired') {
          setSessionStatus('expired');
        } else if (message.includes('zaten gönderildi') || message.includes('Existing')) {
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
        setError(result.data?.createLikertSession?.message || 'Hata oluştu');
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
        // Fallback for HTTP connections
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
      console.error('Copy failed:', err);
    }
  };

  if (!isOpen) return null;

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

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'white' }}>
            <ListChecks size={24} />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{t('likertInvite.title', 'Likert Test Invitation')}</h2>
          </div>
          <button onClick={onClose} style={{ padding: '8px', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', borderRadius: '8px' }}>
            <X size={20} color="white" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {jobLoading ? (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <p>{t('common.loading', 'Loading...')}</p>
            </div>
          ) : jobError ? (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <p style={{ color: '#DC2626' }}>{t('common.error', 'Error')}: {jobError.message}</p>
            </div>
          ) : !likertEnabled ? (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <HelpCircle size={48} style={{ color: '#9CA3AF', marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '600', color: '#374151' }}>{t('likertInvite.notEnabled', 'Likert Test Not Active')}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>{t('likertInvite.configureFirst', 'You need to configure Likert test settings for this job first.')}</p>
              <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#9CA3AF' }}>Job ID: {jobId}</p>
            </div>
          ) : generatedLink ? (
            <>
              {/* Status Banner */}
              {sessionStatus === 'completed' ? (
                <div style={{ background: '#DBEAFE', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1D4ED8', marginBottom: '4px' }}>
                    <Check size={18} />
                    <span style={{ fontWeight: '600' }}>{t('likertInvite.testCompleted', 'Likert Test Completed')}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#1E40AF' }}>
                    {t('likertInvite.testCompletedDesc', 'Likert test has already been completed for {{name}}.', { name: candidate?.name })}
                  </p>
                </div>
              ) : sessionStatus === 'expired' ? (
                <div style={{ background: '#FEF3C7', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#B45309', marginBottom: '4px' }}>
                    <Clock size={18} />
                    <span style={{ fontWeight: '600' }}>{t('likertInvite.testExpired', 'Test Expired')}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#92400E' }}>
                    {t('likertInvite.testExpiredDesc', 'Likert test invitation has expired for {{name}}.', { name: candidate?.name })}
                  </p>
                </div>
              ) : sessionStatus === 'existing' ? (
                <div style={{ background: '#FEF3C7', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#B45309', marginBottom: '4px' }}>
                    <Check size={18} />
                    <span style={{ fontWeight: '600' }}>{t('likertInvite.existingInvite', 'Existing Invitation Found')}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#92400E' }}>
                    {t('likertInvite.existingInviteDesc', 'A Likert test invitation has already been sent to {{name}}. You can use the link below.', { name: candidate?.name })}
                  </p>
                </div>
              ) : (
                <div style={{ background: '#D1FAE5', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', marginBottom: '4px' }}>
                    <Check size={18} />
                    <span style={{ fontWeight: '600' }}>{t('likertInvite.inviteCreated', 'Likert Test Invitation Created')}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#065F46' }}>
                    {t('likertInvite.inviteCreatedDesc', 'Likert test link is ready for {{name}}.', { name: candidate?.name })}
                  </p>
                </div>
              )}

              {/* Link */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px' }}>
                  🔗 TEST LINK
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
                      transition: 'background 0.2s',
                    }}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? t('likertInvite.copied', 'Copied!') : t('likertInvite.copy', 'Copy')}
                  </button>
                </div>
              </div>

              {/* Session Details */}
              <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>{t('likertInvite.inviteDetails', 'Invitation Details')}</h4>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#6B7280' }}>{t('likertInvite.status', 'Status')}</span>
                    <span style={{ 
                      color: sessionDetails?.status === 'completed' ? '#059669' : 
                             sessionDetails?.status === 'expired' ? '#DC2626' :
                             sessionDetails?.status === 'in_progress' ? '#8B5CF6' : '#F59E0B', 
                      fontWeight: '600' 
                    }}>
                      {sessionDetails?.status === 'completed' ? t('likertInvite.statusCompleted', 'Completed') : 
                       sessionDetails?.status === 'expired' ? t('likertInvite.statusExpired', 'Expired') :
                       sessionDetails?.status === 'in_progress' ? t('likertInvite.statusInProgress', 'In Progress') : t('likertInvite.statusPending', 'Pending')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> {t('likertInvite.expiresAt', 'Expires At')}
                    </span>
                    <span style={{ color: '#374151' }}>{formatDate(sessionDetails?.expiresAt)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#6B7280' }}>{t('likertInvite.testTemplate', 'Test Template')}</span>
                    <span style={{ color: '#374151' }}>{sessionDetails?.templateName || '-'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#6B7280' }}>{t('likertInvite.questionCount', 'Question Count')}</span>
                    <span style={{ color: '#374151' }}>{sessionDetails?.questionCount || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#6B7280' }}>{t('likertTemplates.scaleType')}</span>
                    <span style={{ color: '#374151' }}>{sessionDetails?.scaleType || 5}</span>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div style={{ background: '#FEF3C7', borderRadius: '12px', padding: '16px', fontSize: '14px', color: '#92400E' }}>
                💡 {t('likertInvite.infoBox', 'You can send this link to the candidate via email, WhatsApp or SMS. The link can be used only once.')}
              </div>
            </>
          ) : (
            <>
              {error && <div style={{ padding: '12px', background: '#FEE2E2', color: '#DC2626', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

              {/* Candidate Info */}
              <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>{t('likertInvite.candidateInfo', 'Candidate Information')}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600', fontSize: '18px' }}>
                    {candidate?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#111827' }}>{candidate?.name || t('likertInvite.unknown', 'Unknown')}</div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>{candidate?.email || t('likertInvite.noEmail', 'No email')}</div>
                  </div>
                </div>
              </div>

              {/* Test Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ padding: '16px', background: '#F3E8FF', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#7C3AED', marginBottom: '4px' }}>
                    <Hash size={14} />
                    {t('likertInvite.questionCount', 'Question Count')}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#5B21B6' }}>{questionCount}</div>
                </div>
                <div style={{ padding: '16px', background: '#F3E8FF', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#7C3AED', marginBottom: '4px' }}>
                    <Clock size={14} />
                    {t('likertInvite.validityPeriod', 'Validity Period')}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#5B21B6' }}>{deadlineHours} {t('likertInvite.hours', 'hours')}</div>
                </div>
              </div>

              {/* Test Template Info */}
              {likertTemplate && (
                <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>{t('likertInvite.testTemplate', 'Test Template')}</h4>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#5B21B6' }}>{likertTemplate.name}</div>
                  {likertTemplate.description && (
                    <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#6B7280' }}>{likertTemplate.description}</p>
                  )}
                </div>
              )}
              
              {/* Email Template Selection */}
              {emailTemplates.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    <Mail size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                    {t('likertInvite.emailTemplate', 'E-posta Şablonu')}
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
                    <option value="">{t('likertInvite.selectTemplate', '-- Şablon Seçin --')}</option>
                    {emailTemplates.map((tmpl) => (
                      <option key={tmpl.id} value={tmpl.id}>
                        {tmpl.name} {tmpl.isDefault ? '⭐' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Email Preview */}
              {selectedEmailTemplate && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      {t('likertInvite.emailPreview', 'E-posta Önizlemesi')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        background: 'transparent',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#6B7280',
                        cursor: 'pointer',
                      }}
                    >
                      {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showPreview ? t('common.hide', 'Gizle') : t('common.show', 'Göster')}
                    </button>
                  </div>
                  
                  {showPreview && (
                    <div style={{
                      background: '#F9FAFB',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #E5E7EB',
                        background: 'white',
                      }}>
                        <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                          {t('common.subject', 'Konu')}:
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                          {previewSubject}
                        </div>
                      </div>
                      <div style={{ padding: '16px' }}>
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#374151',
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.6',
                        }}>
                          {previewBody}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!generatedLink && likertEnabled && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button onClick={onClose} className="btn btn-secondary" disabled={sending}>{t('common.cancel')}</button>
            <button onClick={handleSend} className="btn btn-primary" disabled={sending} style={{ background: '#8B5CF6', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ListChecks size={18} />
              {sending ? t('likertInvite.creating', 'Creating...') : t('likertInvite.createInvite', 'Create Invitation')}
            </button>
          </div>
        )}

        {generatedLink && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onClose} className="btn" style={{ background: '#374151', color: 'white', padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>{t('common.close', 'Close')}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LikertInviteModal;


