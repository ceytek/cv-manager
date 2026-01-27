/**
 * Likert Test Invite Modal
 * Creates test link only when user clicks "Send Invitation"
 * Same flow as AI Interview Invite Modal
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@apollo/client/react';
import { X, ClipboardList, Copy, Check, Clock, AlertTriangle, Hash, Mail, Eye, Link2, Send } from 'lucide-react';
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
  const [sessionStatus, setSessionStatus] = useState(null);
  const [error, setError] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Fetch job data
  const { data: jobData, loading: jobLoading } = useQuery(JOB_QUERY, {
    variables: { id: jobId },
    skip: !jobId,
    fetchPolicy: 'network-only',
  });

  // Fetch email templates
  const { data: templatesData } = useQuery(GET_LIKERT_TEMPLATES, {
    fetchPolicy: 'network-only',
  });

  const [createSession] = useMutation(CREATE_LIKERT_SESSION);

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
      '{candidate_name}': candidate?.name || 'Aday Adı',
      '{position}': job?.title || 'Pozisyon',
      '{company_name}': 'Şirket Adı',
      '{test_link}': generatedLink || '[Link oluşturulacak]',
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

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '95%', maxWidth: '750px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'white' }}>
            <ClipboardList size={24} />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Likert Test Daveti</h2>
          </div>
          <button onClick={onClose} style={{ padding: '8px', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', borderRadius: '8px' }}>
            <X size={20} color="white" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Loading */}
          {jobLoading && (
            <div style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>
              Yükleniyor...
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: '12px 16px', background: '#FEE2E2', color: '#DC2626', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {/* Likert Not Enabled */}
          {!jobLoading && !likertEnabled && (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <AlertTriangle size={48} color="#F59E0B" style={{ marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px', color: '#374151' }}>Likert Test Aktif Değil</h3>
              <p style={{ color: '#6B7280' }}>Bu iş ilanı için önce Likert test ayarlarını yapılandırmanız gerekiyor.</p>
            </div>
          )}

          {/* Main Content */}
          {!jobLoading && likertEnabled && (
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
                      Bu adayın tamamlanmamış bir testi var
                    </h4>
                    <p style={{ margin: 0, fontSize: '14px', color: '#A16207' }}>
                      {candidate?.name} için daha önce Likert test daveti gönderilmiş. Mevcut linki kullanabilirsiniz.
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
                      Test Tamamlandı
                    </h4>
                    <p style={{ margin: 0, fontSize: '14px', color: '#1E40AF' }}>
                      {candidate?.name} Likert testini zaten tamamlamış.
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
                      Davet Başarıyla Oluşturuldu!
                    </h4>
                    <p style={{ margin: 0, fontSize: '14px', color: '#047857' }}>
                      {candidate?.name} için Likert test linki hazır. Linki kopyalayıp adaya gönderebilirsiniz.
                    </p>
                  </div>
                </div>
              )}

              {/* Generated Link Section - Only show after created */}
              {generatedLink && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                    <Link2 size={14} />
                    Likert Test Linki
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
                      {copied ? 'Kopyalandı!' : 'Kopyala'}
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
                    <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Aday Bilgileri</h4>
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
                        <div style={{ fontWeight: '600', color: '#111827', fontSize: '15px' }}>{candidate?.name || 'Bilinmiyor'}</div>
                        <div style={{ fontSize: '13px', color: '#6B7280' }}>{candidate?.email || 'E-posta yok'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ padding: '16px', background: '#F3E8FF', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#7C3AED', marginBottom: '4px' }}>
                        <Hash size={14} />
                        Soru Sayısı
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#5B21B6' }}>{questionCount}</div>
                    </div>
                    <div style={{ padding: '16px', background: '#F3E8FF', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#7C3AED', marginBottom: '4px' }}>
                        <Clock size={14} />
                        Geçerlilik
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#5B21B6' }}>{deadlineHours} saat</div>
                    </div>
                  </div>

                  {/* Test Template Info */}
                  {likertTemplate && (
                    <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px' }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Likert Test Şablonu</h4>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#5B21B6' }}>{likertTemplate.name}</div>
                      <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                        {scaleType} seçenekli ölçek
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
                        E-POSTA ŞABLONU
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
                        E-POSTA ÖNİZLEMESİ
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
                          <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '2px' }}>Konu:</div>
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
                          E-posta Şablonu Yok
                        </h4>
                        <p style={{ margin: 0, fontSize: '13px', color: '#A16207' }}>
                          Interview Mesaj → Likert Test menüsünden e-posta şablonu oluşturabilirsiniz.
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
            Vazgeç
          </button>
          
          {!generatedLink && likertEnabled && (
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
              {sending ? 'Oluşturuluyor...' : 'Daveti Gönder'}
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
              Tamam
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LikertInviteModal;
