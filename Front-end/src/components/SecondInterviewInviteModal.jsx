/**
 * Second Interview Invite Modal
 * 2. Görüşme - Manuel HR görüşmesi davet modalı
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@apollo/client/react';
import { 
  X, 
  Video, 
  MapPin, 
  Calendar, 
  Clock, 
  MessageSquare, 
  Link as LinkIcon,
  Check,
  Users,
  Copy
} from 'lucide-react';
import { 
  SEND_SECOND_INTERVIEW_INVITE,
  CHECK_ACTIVE_INTERVIEW,
  INTERVIEW_TYPES,
  INTERVIEW_PLATFORMS 
} from '../graphql/secondInterview';
import { GET_SECOND_INTERVIEW_TEMPLATES } from '../graphql/secondInterviewTemplate';
import { GET_COMPANY_ADDRESSES } from '../graphql/companyAddress';
import { ME_QUERY } from '../graphql/auth';
import { GET_INTERVIEW_SESSION_BY_APPLICATION } from '../graphql/interview';
import { GET_LIKERT_SESSION_BY_APPLICATION } from '../graphql/likert';
import { AlertTriangle } from 'lucide-react';

const SecondInterviewInviteModal = ({ 
  isOpen, 
  onClose, 
  candidate, 
  application,
  jobTitle, // Pozisyon adı
  existingInterview = null, // Mevcut 2. görüşme varsa
  onSuccess 
}) => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  
  // Form state
  const [interviewType, setInterviewType] = useState(INTERVIEW_TYPES.ONLINE);
  const [platform, setPlatform] = useState(INTERVIEW_PLATFORMS.ZOOM);
  const [meetingLink, setMeetingLink] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [candidateMessage, setCandidateMessage] = useState('');
  
  // Template state
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
  // UI state
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [inviteDetails, setInviteDetails] = useState(null);
  const [copied, setCopied] = useState(false);
  const [alreadyExists, setAlreadyExists] = useState(false);

  const [sendInvite] = useMutation(SEND_SECOND_INTERVIEW_INVITE);
  
  // Fetch templates based on interview type
  const { data: templatesData } = useQuery(GET_SECOND_INTERVIEW_TEMPLATES, {
    variables: { templateType: interviewType === INTERVIEW_TYPES.ONLINE ? 'ONLINE' : 'IN_PERSON' },
    skip: !isOpen,
  });
  
  // Fetch company addresses for in-person interviews
  const { data: addressesData } = useQuery(GET_COMPANY_ADDRESSES, {
    skip: !isOpen || interviewType !== INTERVIEW_TYPES.IN_PERSON,
  });
  
  // Fetch current user for company info
  const { data: meData } = useQuery(ME_QUERY, { skip: !isOpen });
  const currentUser = meData?.me;
  
  const templates = templatesData?.secondInterviewTemplates?.filter(t => t.isActive) || [];
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const companyAddresses = addressesData?.companyAddresses || [];
  const selectedAddress = companyAddresses.find(a => a.id === selectedAddressId);
  
  // Backend'den aktif mülakat kontrolü yap
  const { data: activeData, loading: checkingActive } = useQuery(CHECK_ACTIVE_INTERVIEW, {
    variables: { applicationId: application?.id },
    skip: !isOpen || !application?.id,
    fetchPolicy: 'network-only', // Her zaman backend'den kontrol et
  });

  // Check for active AI Interview session
  const { data: aiInterviewData, loading: aiInterviewLoading } = useQuery(GET_INTERVIEW_SESSION_BY_APPLICATION, {
    variables: { applicationId: application?.id },
    skip: !application?.id || !isOpen,
    fetchPolicy: 'network-only',
  });

  // Check for active Likert session
  const { data: likertData, loading: likertLoading } = useQuery(GET_LIKERT_SESSION_BY_APPLICATION, {
    variables: { applicationId: application?.id },
    skip: !application?.id || !isOpen,
    fetchPolicy: 'network-only',
  });
  
  // Backend'den gelen aktif mülakat (tarihi gelmemiş veya tamamlanmamış)
  const activeInterviewFromBackend = activeData?.checkActiveInterview;
  
  // Aktif mülakat var mı? (prop olarak veya backend'den)
  const hasActiveInterview = !!existingInterview || !!activeInterviewFromBackend;
  
  // Check for blocking sessions (AI Interview or Likert)
  const activeAIInterview = aiInterviewData?.interviewSessionByApplication;
  const hasActiveAIInterview = activeAIInterview && ['pending', 'in_progress'].includes(activeAIInterview.status?.toLowerCase());
  
  const activeLikert = likertData?.likertSessionByApplication;
  const hasActiveLikert = activeLikert && ['pending', 'in_progress'].includes(activeLikert.status?.toLowerCase());
  
  const isBlockedByOther = hasActiveAIInterview || hasActiveLikert;
  const blockingType = hasActiveAIInterview ? 'AI Görüşmesi' : hasActiveLikert ? 'Likert Test' : null;
  
  // Modal açıldığında kontrol yap
  useEffect(() => {
    if (isOpen && activeInterviewFromBackend && !existingInterview) {
      setAlreadyExists(true);
    }
  }, [isOpen, activeInterviewFromBackend, existingInterview]);
  
  // Eğer aktif mülakat varsa view mode'da göster (yeni oluşturmaya izin verme)
  const isViewMode = hasActiveInterview || alreadyExists;
  
  // Aktif interview verisi (prop'tan veya backend'den)
  const activeInterview = existingInterview || activeInterviewFromBackend;

  // Platform options with icons and labels
  const platformOptions = [
    { value: INTERVIEW_PLATFORMS.ZOOM, label: 'Zoom', icon: '📹' },
    { value: INTERVIEW_PLATFORMS.TEAMS, label: 'Microsoft Teams', icon: '💼' },
    { value: INTERVIEW_PLATFORMS.GOOGLE_MEET, label: 'Google Meet', icon: '🎥' },
  ];
  
  // Reset template when interview type changes
  useEffect(() => {
    setSelectedTemplateId('');
    setSelectedAddressId('');
    setLocationAddress('');
  }, [interviewType]);
  
  // Auto-fill address when selected
  useEffect(() => {
    if (selectedAddress) {
      const fullAddress = `${selectedAddress.address}${selectedAddress.city ? ', ' + selectedAddress.city : ''}`;
      setLocationAddress(fullAddress);
    }
  }, [selectedAddress]);
  
  // Set default template if available
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      const defaultTemplate = templates.find(t => t.isDefault);
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
      }
    }
  }, [templates, selectedTemplateId]);
  
  // Get platform label
  const getPlatformLabel = () => {
    const opt = platformOptions.find(p => p.value === platform);
    return opt ? opt.label : platform;
  };
  
  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return isEnglish ? '[Date]' : '[Tarih]';
    const date = new Date(dateStr);
    return date.toLocaleDateString(isEnglish ? 'en-US' : 'tr-TR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Replace template variables with actual values
  const replaceVariables = (text) => {
    if (!text) return '';
    let result = text;
    
    const variables = {
      candidate_name: candidate?.name || (isEnglish ? '[Candidate Name]' : '[Aday Adı]'),
      position: jobTitle || application?.job?.title || (isEnglish ? '[Position]' : '[Pozisyon]'),
      company_name: currentUser?.companyName || (isEnglish ? '[Company]' : '[Şirket]'),
      date: formatDate(scheduledDate),
      time: scheduledTime || (isEnglish ? '[Time]' : '[Saat]'),
      platform: getPlatformLabel(),
      meeting_link: meetingLink || 'https://...',
      address_name: selectedAddress?.name || (isEnglish ? '[Address Name]' : '[Adres Adı]'),
      address_detail: locationAddress || (isEnglish ? '[Address]' : '[Adres]'),
      google_maps_link: selectedAddress?.googleMapsLink || 'https://maps.google.com/...',
    };
    
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
    
    return result;
  };
  
  // Preview content
  const previewSubject = selectedTemplate ? replaceVariables(selectedTemplate.subject) : '';
  const previewBody = selectedTemplate ? replaceVariables(selectedTemplate.body) : '';

  const handleSubmit = async () => {
    setError('');
    
    // Validation
    if (!scheduledDate || !scheduledTime) {
      setError(t('secondInterview.invite.errorDateRequired', 'Tarih ve saat zorunludur'));
      return;
    }
    
    if (interviewType === INTERVIEW_TYPES.ONLINE && !meetingLink) {
      setError(t('secondInterview.invite.errorLinkRequired', 'Toplantı linki zorunludur'));
      return;
    }
    
    if (interviewType === INTERVIEW_TYPES.IN_PERSON && !locationAddress) {
      setError(t('secondInterview.invite.errorAddressRequired', 'Adres zorunludur'));
      return;
    }

    setSending(true);

    try {
      const result = await sendInvite({
        variables: {
          input: {
            applicationId: application.id,
            interviewType,
            platform: interviewType === INTERVIEW_TYPES.ONLINE ? platform : null,
            meetingLink: interviewType === INTERVIEW_TYPES.ONLINE ? meetingLink : null,
            locationAddress: interviewType === INTERVIEW_TYPES.IN_PERSON ? locationAddress : null,
            scheduledDate,
            scheduledTime,
            candidateMessage: candidateMessage || null,
          },
        },
      });

      if (result.data?.sendSecondInterviewInvite?.success) {
        setSuccess(true);
        setInviteDetails(result.data.sendSecondInterviewInvite.secondInterview);
        onSuccess?.();
      } else {
        const errorMsg = result.data?.sendSecondInterviewInvite?.message || '';
        // "already exists" hatası gelirse view mode'a geç
        if (errorMsg.toLowerCase().includes('already exists')) {
          setAlreadyExists(true);
          setError('');
        } else {
          setError(errorMsg || t('common.error'));
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleCopyLink = async () => {
    const link = meetingLink || locationAddress;
    if (!link) return;
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = link;
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

  const formatDateTime = (date, time) => {
    if (!date || !time) return '-';
    const d = new Date(`${date}T${time}`);
    return d.toLocaleString('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
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
            <Users size={24} />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              {t('secondInterview.invite.title', 'Yüzyüze/Online Mülakat Daveti')}
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
          {/* Loading state */}
          {(checkingActive || aiInterviewLoading || likertLoading) && (
            <div style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>
              Kontrol ediliyor...
            </div>
          )}
          
          {/* Blocking Warning - Active AI Interview or Likert */}
          {!checkingActive && !aiInterviewLoading && !likertLoading && isBlockedByOther && (
            <div style={{ 
              background: '#FEE2E2', 
              border: '2px solid #DC2626',
              borderRadius: '12px', 
              padding: '20px', 
              textAlign: 'center'
            }}>
              <AlertTriangle size={48} color="#DC2626" style={{ marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 12px', color: '#991B1B', fontSize: '18px' }}>
                Yüzyüze/Online Mülakat Daveti Gönderilemez
              </h3>
              <p style={{ margin: '0 0 16px', color: '#DC2626', fontSize: '15px' }}>
                Bu adayın aktif bitirilmemiş <strong>{blockingType}</strong> daveti vardır.
              </p>
              <p style={{ margin: 0, color: '#7F1D1D', fontSize: '14px' }}>
                Yeni davet göndermeden önce mevcut daveti tamamlayın veya iptal edin.
              </p>
            </div>
          )}
          
          {!checkingActive && !aiInterviewLoading && !likertLoading && !isBlockedByOther && (
            isViewMode ? (
            /* View Existing Interview */
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '16px',
                background: '#F0FDF4',
                borderRadius: 12,
                marginBottom: 20,
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: candidate?.cv_photo_path ? `url(${candidate.cv_photo_path}) center/cover` : '#8B5CF6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 18,
                  fontWeight: 600,
                }}>
                  {!candidate?.cv_photo_path && (candidate?.name?.charAt(0)?.toUpperCase() || 'A')}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{candidate?.name || 'Aday'}</div>
                  <div style={{ color: '#6B7280', fontSize: 13 }}>{candidate?.email}</div>
                </div>
              </div>

              {checkingActive ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div className="loading-spinner" style={{ width: 32, height: 32, margin: '0 auto 16px' }} />
                  <p style={{ color: '#6B7280' }}>{t('common.loading', 'Kontrol ediliyor...')}</p>
                </div>
              ) : activeInterview ? (
                <>
                  <div style={{ background: '#F3F4F6', borderRadius: 12, padding: 20, marginBottom: 16 }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 600, color: '#374151' }}>
                      {t('secondInterview.invite.details', 'Görüşme Detayları')}
                    </h4>
                    
                    <div style={{ display: 'grid', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {activeInterview.interviewType === 'online' ? <Video size={18} color="#8B5CF6" /> : <MapPin size={18} color="#8B5CF6" />}
                        <span style={{ fontWeight: 500 }}>
                          {activeInterview.interviewType === 'online' 
                            ? t('secondInterview.invite.online', 'Online') 
                            : t('secondInterview.invite.inPerson', 'Yüz Yüze')}
                          {activeInterview.platform && ` - ${activeInterview.platform.replace('_', ' ').toUpperCase()}`}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Calendar size={18} color="#8B5CF6" />
                        <span>{activeInterview.scheduledDate} - {activeInterview.scheduledTime}</span>
                      </div>

                      {activeInterview.meetingLink && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <LinkIcon size={18} color="#8B5CF6" />
                          <a href={activeInterview.meetingLink} target="_blank" rel="noopener noreferrer" 
                             style={{ color: '#8B5CF6', wordBreak: 'break-all' }}>
                            {activeInterview.meetingLink}
                          </a>
                        </div>
                      )}

                      {activeInterview.locationAddress && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <MapPin size={18} color="#8B5CF6" style={{ flexShrink: 0, marginTop: 2 }} />
                          <span>{activeInterview.locationAddress}</span>
                        </div>
                      )}

                      {activeInterview.candidateMessage && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 8, paddingTop: 12, borderTop: '1px solid #E5E7EB' }}>
                          <MessageSquare size={18} color="#6B7280" style={{ flexShrink: 0, marginTop: 2 }} />
                          <span style={{ color: '#6B7280', fontSize: 14 }}>{activeInterview.candidateMessage}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ 
                    background: '#EDE9FE', 
                    borderRadius: 8, 
                    padding: '12px 16px', 
                    fontSize: 13, 
                    color: '#6D28D9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 16
                  }}>
                    <Check size={16} />
                    {t('secondInterview.invite.infoBox', 'Bu bilgileri adaya e-posta, WhatsApp veya SMS ile gönderebilirsiniz.')}
                  </div>
                </>
              ) : (
                <div style={{ 
                  background: '#FEF3C7', 
                  borderRadius: 12, 
                  padding: 24, 
                  marginBottom: 16,
                  textAlign: 'center'
                }}>
                  <Users size={40} color="#D97706" style={{ marginBottom: 16 }} />
                  <p style={{ margin: 0, color: '#92400E', fontWeight: 600, fontSize: 16 }}>
                    {t('secondInterview.invite.activeInterviewWarning', 'Bu adayın tarihi gelmemiş veya tamamlanmamış aktif bir mülakatı var')}
                  </p>
                </div>
              )}

              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#8B5CF6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t('common.close', 'Kapat')}
              </button>
            </>
          ) : success ? (
            /* Success State */
            <>
              <div style={{ 
                background: '#D1FAE5', 
                borderRadius: '12px', 
                padding: '16px', 
                marginBottom: '20px' 
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  color: '#059669', 
                  marginBottom: '4px' 
                }}>
                  <Check size={18} />
                  <span style={{ fontWeight: '600' }}>
                    {t('secondInterview.invite.success', 'Davet Oluşturuldu!')}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: '#065F46' }}>
                  {t('secondInterview.invite.successDesc', '{{name}} için 2. görüşme daveti hazır.', { name: candidate?.name })}
                </p>
              </div>

              {/* Invite Summary */}
              <div style={{ 
                background: '#F9FAFB', 
                borderRadius: '12px', 
                padding: '16px', 
                marginBottom: '20px' 
              }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  {t('secondInterview.invite.details', 'Görüşme Detayları')}
                </h4>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#6B7280' }}>{t('secondInterview.invite.type', 'Tür')}</span>
                    <span style={{ color: '#374151', fontWeight: '500' }}>
                      {inviteDetails?.interviewType === 'online' 
                        ? t('secondInterview.invite.online', 'Online') 
                        : t('secondInterview.invite.inPerson', 'Yüz Yüze')}
                    </span>
                  </div>
                  {inviteDetails?.interviewType === 'online' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ color: '#6B7280' }}>{t('secondInterview.invite.platform', 'Platform')}</span>
                      <span style={{ color: '#374151', fontWeight: '500' }}>
                        {platformOptions.find(p => p.value === inviteDetails?.platform)?.label || inviteDetails?.platform}
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#6B7280' }}>{t('secondInterview.invite.dateTime', 'Tarih/Saat')}</span>
                    <span style={{ color: '#374151', fontWeight: '500' }}>
                      {formatDateTime(inviteDetails?.scheduledDate, inviteDetails?.scheduledTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Link/Address to copy */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#6B7280', 
                  marginBottom: '8px' 
                }}>
                  {inviteDetails?.interviewType === 'online' ? '🔗' : '📍'} 
                  {inviteDetails?.interviewType === 'online' 
                    ? t('secondInterview.invite.meetingLink', 'TOPLANTI LİNKİ')
                    : t('secondInterview.invite.address', 'ADRES')}
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={inviteDetails?.meetingLink || inviteDetails?.locationAddress || ''}
                    readOnly
                    style={{ 
                      flex: 1, 
                      padding: '12px', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px', 
                      fontSize: '13px', 
                      background: '#F9FAFB' 
                    }}
                  />
                  <button
                    onClick={handleCopyLink}
                    style={{
                      padding: '12px 16px',
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
                    {copied ? t('common.copied', 'Kopyalandı!') : t('common.copy', 'Kopyala')}
                  </button>
                </div>
              </div>

              {/* Info */}
              <div style={{ 
                background: '#FEF3C7', 
                borderRadius: '12px', 
                padding: '16px', 
                fontSize: '14px', 
                color: '#92400E' 
              }}>
                💡 {t('secondInterview.invite.infoBox', 'Bu bilgileri adaya e-posta, WhatsApp veya SMS ile gönderebilirsiniz.')}
              </div>
            </>
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

              {/* Candidate Info */}
              <div style={{ 
                background: '#F9FAFB', 
                borderRadius: '12px', 
                padding: '16px', 
                marginBottom: '20px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {candidate?.cvPhotoPath ? (
                    <img 
                      src={candidate.cvPhotoPath} 
                      alt={candidate.name}
                      style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '50%', 
                        objectFit: 'cover' 
                      }}
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
                  <div>
                    <div style={{ fontWeight: '600', color: '#111827' }}>
                      {candidate?.name || t('common.unknown', 'Bilinmiyor')}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>
                      {candidate?.email || t('common.noEmail', 'E-posta yok')}
                    </div>
                    {candidate?.phone && (
                      <div style={{ fontSize: '13px', color: '#6B7280' }}>
                        {candidate.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Interview Type Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '8px' 
                }}>
                  {t('secondInterview.invite.interviewType', 'Görüşme Türü')}
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setInterviewType(INTERVIEW_TYPES.ONLINE)}
                    style={{
                      flex: 1,
                      padding: '16px',
                      border: `2px solid ${interviewType === INTERVIEW_TYPES.ONLINE ? '#8B5CF6' : '#E5E7EB'}`,
                      borderRadius: '12px',
                      background: interviewType === INTERVIEW_TYPES.ONLINE ? '#F3E8FF' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Video size={24} color={interviewType === INTERVIEW_TYPES.ONLINE ? '#8B5CF6' : '#6B7280'} />
                    <span style={{ 
                      fontWeight: '600', 
                      color: interviewType === INTERVIEW_TYPES.ONLINE ? '#8B5CF6' : '#374151' 
                    }}>
                      {t('secondInterview.invite.online', 'Online')}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterviewType(INTERVIEW_TYPES.IN_PERSON)}
                    style={{
                      flex: 1,
                      padding: '16px',
                      border: `2px solid ${interviewType === INTERVIEW_TYPES.IN_PERSON ? '#8B5CF6' : '#E5E7EB'}`,
                      borderRadius: '12px',
                      background: interviewType === INTERVIEW_TYPES.IN_PERSON ? '#F3E8FF' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <MapPin size={24} color={interviewType === INTERVIEW_TYPES.IN_PERSON ? '#8B5CF6' : '#6B7280'} />
                    <span style={{ 
                      fontWeight: '600', 
                      color: interviewType === INTERVIEW_TYPES.IN_PERSON ? '#8B5CF6' : '#374151' 
                    }}>
                      {t('secondInterview.invite.inPerson', 'Yüz Yüze')}
                    </span>
                  </button>
                </div>
              </div>

              {/* Template Selection */}
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
                  📝 {t('secondInterview.invite.selectTemplate', 'Şablon Seçin')} *
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
                  }}
                >
                  <option value="">{t('secondInterview.invite.chooseTemplate', '-- Şablon seçin --')}</option>
                  {templates.map(tmpl => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.name} ({tmpl.language}) {tmpl.isDefault ? '⭐' : ''}
                    </option>
                  ))}
                </select>
                {templates.length === 0 && (
                  <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6, fontStyle: 'italic' }}>
                    {interviewType === INTERVIEW_TYPES.ONLINE 
                      ? t('secondInterview.invite.noOnlineTemplates', 'Online şablon bulunamadı. Interview Mesaj → 2. Interview\'dan ekleyebilirsiniz.')
                      : t('secondInterview.invite.noInPersonTemplates', 'Yüz yüze şablon bulunamadı. Interview Mesaj → 2. Interview\'dan ekleyebilirsiniz.')
                    }
                  </p>
                )}
              </div>

              {/* Platform Selection (Online only) */}
              {interviewType === INTERVIEW_TYPES.ONLINE && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '8px' 
                  }}>
                    {t('secondInterview.invite.platform', 'Platform')}
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {platformOptions.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPlatform(opt.value)}
                        style={{
                          flex: 1,
                          padding: '12px 8px',
                          border: `2px solid ${platform === opt.value ? '#8B5CF6' : '#E5E7EB'}`,
                          borderRadius: '8px',
                          background: platform === opt.value ? '#F3E8FF' : 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s',
                        }}
                      >
                        <span style={{ fontSize: '20px' }}>{opt.icon}</span>
                        <span style={{ 
                          fontSize: '12px', 
                          fontWeight: '500', 
                          color: platform === opt.value ? '#8B5CF6' : '#6B7280' 
                        }}>
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Meeting Link (Online) */}
              {interviewType === INTERVIEW_TYPES.ONLINE && (
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
                    <LinkIcon size={16} />
                    {t('secondInterview.invite.meetingLink', 'Toplantı Linki')} *
                  </label>
                  <input
                    type="url"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://zoom.us/j/..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  />
                </div>
              )}

              {/* Location Address (In Person) */}
              {interviewType === INTERVIEW_TYPES.IN_PERSON && (
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
                    <MapPin size={16} />
                    {t('secondInterview.invite.selectAddress', 'Adres Seçin')} *
                  </label>
                  <select
                    value={selectedAddressId}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      marginBottom: '12px',
                    }}
                  >
                    <option value="">{t('secondInterview.invite.chooseAddress', '-- Adres seçin --')}</option>
                    {companyAddresses.map(addr => (
                      <option key={addr.id} value={addr.id}>
                        {addr.name} - {addr.city || addr.address.substring(0, 30)}...
                      </option>
                    ))}
                  </select>
                  
                  {selectedAddress && (
                    <div style={{
                      background: '#F5F3FF',
                      border: '1px solid #DDD6FE',
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 13,
                    }}>
                      <div style={{ fontWeight: 600, color: '#5B21B6', marginBottom: 4 }}>
                        📍 {selectedAddress.name}
                      </div>
                      <div style={{ color: '#6B7280' }}>
                        {selectedAddress.address}
                        {selectedAddress.city && `, ${selectedAddress.city}`}
                      </div>
                      {selectedAddress.googleMapsLink && (
                        <a 
                          href={selectedAddress.googleMapsLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ fontSize: 12, color: '#7C3AED', marginTop: 4, display: 'inline-block' }}
                        >
                          🗺️ {t('secondInterview.invite.viewOnMap', 'Haritada Görüntüle')}
                        </a>
                      )}
                    </div>
                  )}
                  
                  {companyAddresses.length === 0 && (
                    <p style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
                      {t('secondInterview.invite.noAddresses', 'Henüz adres tanımlı değil. Ayarlar → Şirket Adresleri\'nden ekleyebilirsiniz.')}
                    </p>
                  )}
                </div>
              )}

              {/* Date & Time */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '8px' 
                  }}>
                    <Calendar size={16} />
                    {t('secondInterview.invite.date', 'Tarih')} *
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={getMinDate()}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '8px' 
                  }}>
                    <Clock size={16} />
                    {t('secondInterview.invite.time', 'Saat')} *
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>

              {/* Template Preview */}
              {selectedTemplate && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '8px' 
                  }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#374151', 
                    }}>
                      👁️ {t('secondInterview.invite.messagePreview', 'Mesaj Önizleme')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#7C3AED',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      {showPreview ? t('common.hide', 'Gizle') : t('common.show', 'Göster')}
                    </button>
                  </div>
                  
                  {showPreview && (
                    <div style={{
                      background: '#FAFAFA',
                      border: '1px solid #E5E7EB',
                      borderRadius: 8,
                      padding: 16,
                    }}>
                      <div style={{ marginBottom: 12 }}>
                        <span style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase' }}>
                          {t('secondInterview.invite.to', 'Kime')}:
                        </span>
                        <div style={{ fontSize: 14, color: '#374151' }}>
                          {candidate?.email || '-'}
                        </div>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <span style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase' }}>
                          {t('secondInterview.invite.subject', 'Konu')}:
                        </span>
                        <div style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
                          {previewSubject}
                        </div>
                      </div>
                      <div style={{
                        borderLeft: '3px solid #8B5CF6',
                        paddingLeft: 12,
                        whiteSpace: 'pre-wrap',
                        fontSize: 13,
                        color: '#374151',
                        lineHeight: 1.6,
                      }}>
                        {previewBody}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Candidate Message (Optional) */}
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
                  {t('secondInterview.invite.extraMessage', 'Ek Mesaj')} 
                  <span style={{ fontWeight: '400', color: '#9CA3AF' }}>
                    ({t('common.optional', 'İsteğe bağlı')})
                  </span>
                </label>
                <textarea
                  value={candidateMessage}
                  onChange={(e) => setCandidateMessage(e.target.value)}
                  placeholder={t('secondInterview.invite.messagePlaceholder', 'Adaya iletmek istediğiniz ek bilgiler...')}
                  rows={2}
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
            </>
          )
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '16px 24px', 
          borderTop: '1px solid #E5E7EB', 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '12px' 
        }}>
          {success ? (
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
          ) : (
            <>
              <button 
                onClick={onClose} 
                disabled={sending}
                style={{ 
                  background: '#F3F4F6', 
                  color: '#374151', 
                  padding: '10px 20px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontWeight: '600',
                  opacity: sending ? 0.5 : 1,
                }}
              >
                {t('common.cancel', 'İptal')}
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={sending}
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
                  opacity: sending ? 0.7 : 1,
                }}
              >
                <Users size={18} />
                {sending 
                  ? t('secondInterview.invite.sending', 'Gönderiliyor...') 
                  : t('secondInterview.invite.send', 'Davet Oluştur')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecondInterviewInviteModal;
