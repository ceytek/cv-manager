/**
 * Send Rejection Message Modal
 * Allows HR to select a rejection template, preview the message, add a note, and "send" it
 */
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { X, Mail, Check, AlertTriangle, FileText, Send, Copy, Eye } from 'lucide-react';
import { GET_REJECTION_TEMPLATES } from '../graphql/rejectionTemplates';
import { REJECT_APPLICATION } from '../graphql/cvs';
import { ME_QUERY } from '../graphql/auth';
import { API_BASE_URL } from '../config/api';

const SendRejectionModal = ({ isOpen, onClose, candidate, application, jobId, jobTitle, onSuccess }) => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [rejectionNote, setRejectionNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch rejection templates
  const { data: templatesData, loading: templatesLoading } = useQuery(GET_REJECTION_TEMPLATES, {
    fetchPolicy: 'network-only',
  });

  // Fetch current user for company info
  const { data: meData } = useQuery(ME_QUERY);
  const currentUser = meData?.me;

  const templates = templatesData?.rejectionTemplates?.filter(t => t.isActive) || [];
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Reject application mutation
  const [rejectApplication] = useMutation(REJECT_APPLICATION);

  // Get candidate info for variable replacement
  const candidateInfo = useMemo(() => {
    const cand = candidate || {};
    const name = cand.name || '';
    const nameParts = name.split(' ');
    const logoUrl = currentUser?.companyLogo 
      ? (currentUser.companyLogo.startsWith('http') 
          ? currentUser.companyLogo 
          : `${API_BASE_URL}${currentUser.companyLogo}`)
      : '';
    return {
      ad: nameParts[0] || '',
      soyad: nameParts.slice(1).join(' ') || '',
      telefon: cand.phone || '',
      ilan_adi: jobTitle || '',
      email: cand.email || '',
      sirket_adi: currentUser?.companyName || '',
      sirket_logo: logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-height: 50px;">` : '',
    };
  }, [candidate, jobTitle, currentUser]);

  // Replace variables in text
  const replaceVariables = (text) => {
    if (!text) return '';
    let result = text;
    Object.entries(candidateInfo).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
    return result;
  };

  // Preview content
  const previewSubject = selectedTemplate ? replaceVariables(selectedTemplate.subject) : '';
  const previewBody = selectedTemplate ? replaceVariables(selectedTemplate.body) : '';

  // Handle send
  const handleSend = async () => {
    if (!selectedTemplateId || !application?.id) {
      alert(t('rejectionModal.pleaseSelectTemplate', 'Lütfen bir şablon seçin'));
      return;
    }

    setSending(true);
    try {
      await rejectApplication({
        variables: {
          applicationId: application.id,
          rejectionNote: rejectionNote.trim() || null,
          templateId: selectedTemplateId,
        },
      });
      setSent(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      alert((isEnglish ? 'Error: ' : 'Hata: ') + err.message);
    } finally {
      setSending(false);
    }
  };

  // Copy to clipboard with fallback for HTTP
  const copyToClipboard = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        width: '90%',
        maxWidth: 600,
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'white' }}>
            <Mail size={24} />
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
              {t('rejection.title', 'Red Mesajı Gönder')}
            </h2>
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
          {sent ? (
            // Success State
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: '#D1FAE5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <Check size={40} color="#059669" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>
                {t('rejection.sent', 'Red Mesajı Gönderildi')}
              </h3>
              <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>
                {isEnglish 
                  ? `Rejection message was sent to ${candidateInfo.ad} ${candidateInfo.soyad} and status has been updated.`
                  : `${candidateInfo.ad} ${candidateInfo.soyad} adayına red mesajı iletildi ve durum güncellendi.`
                }
              </p>
              <button
                onClick={onClose}
                style={{
                  padding: '12px 32px',
                  background: '#1F2937',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t('common.close', 'Kapat')}
              </button>
            </div>
          ) : (
            <>
              {/* Candidate Info */}
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 8,
                padding: 16,
                marginBottom: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <AlertTriangle size={16} color="#DC2626" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#991B1B' }}>
                    {candidateInfo.ad} {candidateInfo.soyad}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: '#7F1D1D', margin: 0 }}>
                  {t('rejectionModal.warningMessage', 'Bu adaya red mesajı gönderilecek ve başvuru durumu "Reddedildi" olarak güncellenecek.')}
                </p>
              </div>

              {/* Template Selection */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  <FileText size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  {t('rejection.selectTemplate', 'Şablon Seçin')} *
                </label>
                
                {templatesLoading ? (
                  <p style={{ color: '#6B7280', fontSize: 14 }}>{t('common.loading', 'Yükleniyor...')}</p>
                ) : templates.length === 0 ? (
                  <div style={{
                    background: '#FEF3C7',
                    border: '1px solid #FCD34D',
                    borderRadius: 8,
                    padding: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <AlertTriangle size={20} color="#D97706" />
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#92400E', margin: 0 }}>
                        {t('rejectionModal.noTemplatesFound', 'Red mesajı şablonu bulunamadı')}
                      </p>
                      <p style={{ fontSize: 13, color: '#B45309', margin: '4px 0 0' }}>
                        {t('rejectionModal.createTemplateHint', 'Lütfen önce Şablonlar → Red Mesajları menüsünden bir şablon oluşturun.')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #D1D5DB',
                      borderRadius: 8,
                      fontSize: 14,
                      background: 'white',
                    }}
                  >
                    <option value="">{t('rejectionModal.selectTemplatePlaceholder', '-- Şablon seçin --')}</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.language})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Preview */}
              {selectedTemplate && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}>
                    <label style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
                      <Eye size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                      {t('rejection.preview', 'Mesaj Önizleme')}
                    </label>
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      style={{
                        background: '#F3F4F6',
                        border: 'none',
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 12,
                        color: '#6B7280',
                        cursor: 'pointer',
                      }}
                    >
                      {showPreview ? t('common.hide', 'Gizle') : t('common.show', 'Göster')}
                    </button>
                  </div>

                  {showPreview && (
                    <div style={{
                      background: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      borderRadius: 8,
                      overflow: 'hidden',
                    }}>
                      {/* Email Header */}
                      <div style={{ 
                        padding: '12px 16px',
                        borderBottom: '1px solid #E5E7EB',
                        background: 'white',
                      }}>
                        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>{t('rejectionModal.emailTo', 'Kime')}:</div>
                        <div style={{ fontSize: 14, color: '#1F2937' }}>{candidateInfo.email}</div>
                      </div>
                      <div style={{ 
                        padding: '12px 16px',
                        borderBottom: '1px solid #E5E7EB',
                        background: 'white',
                      }}>
                        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>{t('rejectionModal.emailSubject', 'Konu')}:</div>
                        <div style={{ fontSize: 14, color: '#1F2937', fontWeight: 500 }}>{previewSubject}</div>
                      </div>
                      {/* Email Body */}
                      <div style={{ padding: 16 }}>
                        <div 
                          style={{
                            fontSize: 14,
                            color: '#374151',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                          }}
                          dangerouslySetInnerHTML={{ __html: previewBody.replace(/\n/g, '<br/>') }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Rejection Note (Internal) */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  📝 {t('rejection.internalNote', 'Dahili Not')} <span style={{ color: '#9CA3AF', fontWeight: 400 }}>({t('rejectionModal.onlyYouWillSee', 'Sadece siz göreceksiniz')})</span>
                </label>
                <textarea
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder={t('rejectionModal.notePlaceholder', 'Red sebebi, görüşme notları veya ileride referans için not ekleyebilirsiniz...')}
                  style={{
                    width: '100%',
                    minHeight: 100,
                    padding: '12px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: 8,
                    fontSize: 14,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Info */}
              <div style={{
                background: '#FEF3C7',
                borderRadius: 8,
                padding: 12,
                fontSize: 13,
                color: '#92400E',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
              }}>
                <span>💡</span>
                <span>
                  {t('rejection.info', 'Bu mesaj adayın e-posta adresine gönderilecektir. Gönderim sonrası adayın durumu "Reddedildi" olarak işaretlenecek ve geçmişe kaydedilecektir.')}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!sent && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: '#F3F4F6',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {t('common.cancel', 'İptal')}
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !selectedTemplateId || templates.length === 0}
              style={{
                padding: '10px 24px',
                background: sending || !selectedTemplateId ? '#9CA3AF' : '#DC2626',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: sending || !selectedTemplateId ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Send size={16} />
              {sending ? t('rejectionModal.sending', 'Gönderiliyor...') : t('rejection.sendButton', 'Red Mesajı Gönder')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SendRejectionModal;
