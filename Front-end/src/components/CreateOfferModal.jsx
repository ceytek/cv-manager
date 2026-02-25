/**
 * Create Offer Modal
 * Modal for creating and sending job offers to candidates
 */
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { 
  X, FileText, Gift, Calendar, DollarSign, Send, Save, 
  Loader2, Check, AlertCircle, Eye, User, Briefcase,
  Calculator, Building2, MapPin, Phone, Mail
} from 'lucide-react';
import { 
  GET_OFFER_TEMPLATES, 
  CREATE_OFFER, 
  SEND_OFFER,
  GET_OFFER_BY_APPLICATION,
  OFFER_STATUS
} from '../graphql/offer';
import { GET_BENEFITS } from '../graphql/benefits';
import { ME_QUERY } from '../graphql/auth';
import { GET_COMPANY_ADDRESSES } from '../graphql/companyAddress';
import { API_BASE_URL } from '../config/api';

// Turkey tax calculation (simplified - 2024 rates)
const calculateNetFromGross = (grossSalary) => {
  if (!grossSalary || grossSalary <= 0) return 0;
  const sgk = grossSalary * 0.14;
  const unemployment = grossSalary * 0.01;
  const taxBase = grossSalary - sgk - unemployment;
  const incomeTax = taxBase * 0.15;
  const stampTax = grossSalary * 0.00759;
  const netSalary = grossSalary - sgk - unemployment - incomeTax - stampTax;
  return Math.round(netSalary);
};

// Benefit category icons
const CATEGORY_ICONS = {
  FINANCIAL: '💰',
  HEALTH: '🏥',
  TRANSPORTATION: '🚗',
  DEVELOPMENT: '📚',
  LIFESTYLE: '🎯',
  FOOD: '🍽️',
};

const CreateOfferModal = ({ 
  isOpen, 
  onClose, 
  candidate, 
  application, 
  jobTitle,
  companyName: propCompanyName,
  onSuccess 
}) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'tr' ? 'tr' : 'en';

  // Form state
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [salaryGross, setSalaryGross] = useState('');
  const [salaryNet, setSalaryNet] = useState('');
  const [autoCalculateNet, setAutoCalculateNet] = useState(true);
  const [currency, setCurrency] = useState('TRY');
  const [startDate, setStartDate] = useState('');
  const [validityDays, setValidityDays] = useState(7);
  const [selectedBenefitIds, setSelectedBenefitIds] = useState([]);
  const [customNotes, setCustomNotes] = useState('');
  const [introText, setIntroText] = useState('');
  const [outroText, setOutroText] = useState('');
  
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  // Fetch company info from ME_QUERY
  const { data: meData } = useQuery(ME_QUERY, { fetchPolicy: 'cache-first' });
  
  // Fetch company addresses
  const { data: addressesData } = useQuery(GET_COMPANY_ADDRESSES, {
    variables: { includeInactive: false },
    fetchPolicy: 'cache-first',
  });

  // Fetch templates
  const { data: templatesData, loading: templatesLoading } = useQuery(GET_OFFER_TEMPLATES, {
    variables: { isActive: true },
    fetchPolicy: 'network-only',
  });

  // Fetch all benefits for additional selection
  const { data: benefitsData } = useQuery(GET_BENEFITS, {
    variables: { isActive: true },
  });

  // Check existing offer
  const { data: existingOfferData, refetch: refetchExistingOffer } = useQuery(GET_OFFER_BY_APPLICATION, {
    variables: { applicationId: application?.id },
    skip: !application?.id,
    fetchPolicy: 'network-only',
  });

  // Mutations
  const [createOffer, { loading: creating }] = useMutation(CREATE_OFFER);
  const [sendOffer, { loading: sending }] = useMutation(SEND_OFFER);

  const templates = templatesData?.offerTemplates || [];
  const allBenefits = benefitsData?.benefits || [];
  const existingOffer = existingOfferData?.offerByApplication;
  
  // Load existing offer data into form
  useEffect(() => {
    const isDraft = existingOffer?.status?.toUpperCase() === 'DRAFT';
    if (existingOffer && isDraft) {
      setSalaryGross(existingOffer.salaryGross?.toString() || '');
      setSalaryNet(existingOffer.salaryNet?.toString() || '');
      setCurrency(existingOffer.currency || 'TRY');
      setStartDate(existingOffer.startDate ? existingOffer.startDate.split('T')[0] : '');
      setCustomNotes(existingOffer.customNotes || '');
      setAutoCalculateNet(false);
      if (existingOffer.templateId) {
        setSelectedTemplateId(existingOffer.templateId);
      }
    }
  }, [existingOffer]);
  
  // Company info
  const companyName = propCompanyName || meData?.me?.companyName || '';
  const companyLogo = meData?.me?.companyLogo;
  const primaryAddress = addressesData?.companyAddresses?.[0];

  // Auto-calculate net salary
  useEffect(() => {
    if (autoCalculateNet && salaryGross && currency === 'TRY') {
      const gross = parseFloat(salaryGross);
      if (!isNaN(gross)) {
        setSalaryNet(calculateNetFromGross(gross).toString());
      }
    }
  }, [salaryGross, autoCalculateNet, currency]);

  // Load template data when selected
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        setIntroText(template.introText || '');
        setOutroText(template.outroText || '');
        setValidityDays(template.defaultValidityDays || 7);
        
        // Load default benefits from template
        if (template.defaultBenefits && template.defaultBenefits.length > 0) {
          setSelectedBenefitIds(template.defaultBenefits.map(b => b.id));
        }
      }
    } else {
      // Clear template-related fields
      setIntroText('');
      setOutroText('');
      setValidityDays(7);
      setSelectedBenefitIds([]);
    }
  }, [selectedTemplateId, templates]);

  // Calculate valid until date
  const validUntilDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + validityDays);
    return date.toISOString().split('T')[0];
  }, [validityDays]);

  // Get selected benefits data
  const selectedBenefits = useMemo(() => {
    // First check template benefits, then fall back to all benefits
    const template = templates.find(t => t.id === selectedTemplateId);
    const templateBenefits = template?.defaultBenefits || [];
    
    return selectedBenefitIds.map(id => {
      // Try to find in template benefits first
      const fromTemplate = templateBenefits.find(b => b.id === id);
      if (fromTemplate) return fromTemplate;
      // Fall back to all benefits
      return allBenefits.find(b => b.id === id);
    }).filter(Boolean);
  }, [selectedBenefitIds, templates, selectedTemplateId, allBenefits]);

  // Toggle benefit
  const toggleBenefit = (benefitId) => {
    setSelectedBenefitIds(prev => {
      if (prev.includes(benefitId)) {
        return prev.filter(id => id !== benefitId);
      }
      return [...prev, benefitId];
    });
  };

  // Validation
  const validate = () => {
    const newErrors = {};
    if (!salaryGross || parseFloat(salaryGross) <= 0) {
      newErrors.salaryGross = t('createOffer.errors.salaryRequired', 'Brüt maaş zorunludur');
    }
    if (!startDate) {
      newErrors.startDate = t('createOffer.errors.startDateRequired', 'Başlangıç tarihi zorunludur');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Replace only known context placeholders for preview (candidate, position, company)
  const previewReplacePlaceholders = (text) => {
    if (!text) return '';
    const cName = candidate?.name || candidate?.candidateName || '';
    return text
      .replace(/\{\{aday_adi\}\}/g, cName)
      .replace(/\{\{candidate_name\}\}/g, cName)
      .replace(/\{\{pozisyon\}\}/g, jobTitle || '')
      .replace(/\{\{position\}\}/g, jobTitle || '')
      .replace(/\{\{sirket\}\}/g, companyName || '')
      .replace(/\{\{company\}\}/g, companyName || '');
  };

  // Replace placeholders in text
  const replacePlaceholders = (text) => {
    if (!text) return '';
    const candidateName = candidate?.name || candidate?.candidateName || '';
    return text
      .replace(/\{\{aday_adi\}\}/g, candidateName)
      .replace(/\{\{candidate_name\}\}/g, candidateName)
      .replace(/\{\{pozisyon\}\}/g, jobTitle || '')
      .replace(/\{\{position\}\}/g, jobTitle || '')
      .replace(/\{\{sirket\}\}/g, companyName || '')
      .replace(/\{\{company\}\}/g, companyName || '')
      .replace(/\{\{baslangic_tarihi\}\}/g, startDate ? new Date(startDate).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US') : '')
      .replace(/\{\{start_date\}\}/g, startDate ? new Date(startDate).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US') : '')
      .replace(/\{\{brut_maas\}\}/g, salaryGross ? `${parseInt(salaryGross).toLocaleString()} ${currency}` : '')
      .replace(/\{\{gross_salary\}\}/g, salaryGross ? `${parseInt(salaryGross).toLocaleString()} ${currency}` : '')
      .replace(/\{\{net_maas\}\}/g, salaryNet ? `${parseInt(salaryNet).toLocaleString()} ${currency}` : '')
      .replace(/\{\{net_salary\}\}/g, salaryNet ? `${parseInt(salaryNet).toLocaleString()} ${currency}` : '')
      .replace(/\{\{son_kabul_tarihi\}\}/g, new Date(validUntilDate).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US'))
      .replace(/\{\{valid_until\}\}/g, new Date(validUntilDate).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US'));
  };

  // Handle save/send
  const handleSubmit = async (sendImmediately = false) => {
    if (!validate()) return;
    
    setErrors({});

    const benefitsData = selectedBenefits.map(b => ({
      id: b.id,
      name: b.name,
      value: b.value,
      valuePeriod: b.valuePeriod,
      isVariable: b.isVariable,
      category: b.category,
      icon: b.icon,
    }));

    try {
      let offerId = null;
      
      // Check if we have an existing DRAFT offer to send directly
      const isDraft = existingOffer?.status?.toUpperCase() === 'DRAFT';
      if (existingOffer && isDraft && sendImmediately) {
        // Just send the existing draft
        offerId = existingOffer.id;
        console.log('Using existing DRAFT offer:', offerId);
      } else if (!existingOffer) {
        // Create new offer
        const { data: createData } = await createOffer({
          variables: {
            input: {
              applicationId: application.id,
              templateId: selectedTemplateId || null,
              salaryGross: parseFloat(salaryGross),
              salaryNet: salaryNet ? parseFloat(salaryNet) : null,
              currency,
              startDate: startDate ? new Date(startDate).toISOString() : null,
              validUntil: new Date(validUntilDate).toISOString(),
              introText: replacePlaceholders(introText),
              outroText: replacePlaceholders(outroText),
              customNotes: customNotes || null,
              benefits: benefitsData.length > 0 ? benefitsData : null,
            },
          },
        });

        if (!createData.createOffer.success) {
          setErrors({ submit: createData.createOffer.message });
          return;
        }
        offerId = createData.createOffer.offer.id;
        
        if (!sendImmediately) {
          // Draft saved - refresh and show success
          await refetchExistingOffer();
          setErrors({ success: t('createOffer.draftSaved', 'Taslak kaydedildi! Gönder butonuna basarak teklifi gönderebilirsiniz.') });
          return;
        }
      } else if (existingOffer && !sendImmediately) {
        // Already has draft, show message
        setErrors({ success: t('createOffer.draftExists', 'Taslak zaten mevcut. Gönder butonuna basarak teklifi gönderebilirsiniz.') });
        return;
      }

      // Send the offer
      if (sendImmediately && offerId) {
        console.log('Sending offer with ID:', offerId);
        const { data: sendData } = await sendOffer({ variables: { id: offerId } });
        console.log('Send response:', sendData);
        
        if (!sendData?.sendOffer?.success) {
          setErrors({ submit: sendData?.sendOffer?.message || 'Teklif gönderilemedi' });
          return;
        }
        
        // Show success alert
        alert(t('createOffer.sentSuccess', 'Teklif başarıyla gönderildi! ✅'));
        
        // Call onSuccess with 'sent' action - this will close modals and switch to Offer tab
        // Do NOT call onClose() here as onSuccess handles all the cleanup
        onSuccess?.('sent');
      }
    } catch (error) {
      console.error('Offer submit error:', error);
      setErrors({ submit: error.message });
    }
  };

  if (!isOpen) return null;

  const loading = creating || sending;
  const candidateName = candidate?.name || candidate?.candidateName || t('createOffer.candidate', 'Aday');

  // Group benefits by category for display
  const benefitsByCategory = allBenefits.reduce((acc, benefit) => {
    const cat = benefit.category || 'OTHER';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(benefit);
    return acc;
  }, {});

  const categoryNames = {
    FINANCIAL: t('benefits.categories.financial', 'Finansal'),
    HEALTH: t('benefits.categories.health', 'Sağlık'),
    TRANSPORTATION: t('benefits.categories.transportation', 'Ulaşım'),
    DEVELOPMENT: t('benefits.categories.development', 'Gelişim'),
    LIFESTYLE: t('benefits.categories.lifestyle', 'Yaşam'),
    FOOD: t('benefits.categories.food', 'Yemek'),
  };

  // Company info for preview
  const companyInfo = {
    name: companyName,
    logo: companyLogo,
    address: primaryAddress?.fullAddress || '',
    city: primaryAddress?.city || '',
    district: primaryAddress?.district || '',
    phone: meData?.me?.phone || primaryAddress?.phone || '',
    email: meData?.me?.email || '',
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: 20,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 20,
        maxWidth: 900,
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FileText size={24} />
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                {t('createOffer.title', 'Teklif Oluştur')}
              </h2>
              <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
                {candidateName} - {jobTitle}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            padding: 8, border: 'none', background: 'rgba(255,255,255,0.2)',
            borderRadius: 8, cursor: 'pointer', color: 'white', display: 'flex',
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Existing Offer Warning */}
        {existingOffer && (
          <div style={{
            padding: '12px 24px', background: '#FEF3C7', borderBottom: '1px solid #F59E0B',
            display: 'flex', alignItems: 'center', gap: 10, color: '#92400E', fontSize: 14,
          }}>
            <AlertCircle size={18} />
            {t('createOffer.existingOffer', 'Bu aday için zaten bir teklif mevcut.')} 
            ({OFFER_STATUS[existingOffer.status]?.label[lang] || existingOffer.status})
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {errors.success && (
            <div style={{
              padding: 12, background: '#D1FAE5', border: '1px solid #10B981',
              borderRadius: 8, color: '#065F46', fontSize: 14, marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Check size={18} />
              {errors.success}
            </div>
          )}
          {errors.submit && (
            <div style={{
              padding: 12, background: '#FEF2F2', border: '1px solid #FEE2E2',
              borderRadius: 8, color: '#DC2626', fontSize: 14, marginBottom: 20,
            }}>
              {errors.submit}
            </div>
          )}

          {/* Candidate & Job Info */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
            padding: 16, background: '#F9FAFB', borderRadius: 12, marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <User size={18} color="#6B7280" />
              <div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{t('createOffer.candidate', 'Aday')}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{candidateName}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Briefcase size={18} color="#6B7280" />
              <div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{t('createOffer.position', 'Pozisyon')}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{jobTitle}</div>
              </div>
            </div>
          </div>

          {/* Template Selection */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
              {t('createOffer.selectTemplate', 'Şablon Seçin')}
              {templates.length === 0 && (
                <span style={{ fontSize: 12, fontWeight: 400, color: '#EF4444', marginLeft: 8 }}>
                  ({t('createOffer.noTemplatesAvailable', 'Şablon bulunamadı - önce şablon oluşturun')})
                </span>
              )}
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              disabled={templates.length === 0}
              style={{
                width: '100%', padding: '12px 14px', border: '1px solid #E5E7EB',
                borderRadius: 10, fontSize: 14, outline: 'none', background: 'white',
                opacity: templates.length === 0 ? 0.5 : 1,
              }}
            >
              <option value="">{t('createOffer.noTemplate', '-- Şablon seçin --')}</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} 
                  {template.defaultBenefits?.length > 0 && ` (${template.defaultBenefits.length} yan hak)`}
                </option>
              ))}
            </select>

            {/* Template Preview */}
            {selectedTemplateId && (() => {
              const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
              if (!selectedTemplate) return null;
              return (
                <div style={{
                  marginTop: 12,
                  border: '1px solid #D1FAE5',
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: '#F0FDF4',
                }}>
                  {/* Preview Header */}
                  <div style={{
                    padding: '10px 16px',
                    background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                    borderBottom: '1px solid #A7F3D0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Eye size={15} color="#059669" />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}>
                        {t('createOffer.templatePreview', 'Şablon Önizleme')}
                      </span>
                    </div>
                    <span style={{
                      padding: '2px 8px',
                      background: '#A7F3D0',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#065F46',
                    }}>
                      {selectedTemplate.name}
                    </span>
                  </div>

                  {/* Preview Content */}
                  <div style={{ padding: 16 }}>
                    {/* Intro Text */}
                    {selectedTemplate.introText && (
                      <div style={{ marginBottom: selectedTemplate.outroText ? 14 : 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#059669', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {t('createOffer.introSection', 'Giriş Metni')}
                        </div>
                        <div style={{
                          padding: 12,
                          background: 'white',
                          borderRadius: 8,
                          border: '1px solid #D1FAE5',
                          fontSize: 13,
                          lineHeight: 1.6,
                          color: '#374151',
                          whiteSpace: 'pre-wrap',
                        }}>
                          {previewReplacePlaceholders(selectedTemplate.introText)}
                        </div>
                      </div>
                    )}

                    {/* Outro Text */}
                    {selectedTemplate.outroText && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#059669', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {t('createOffer.outroSection', 'Kapanış Metni')}
                        </div>
                        <div style={{
                          padding: 12,
                          background: 'white',
                          borderRadius: 8,
                          border: '1px solid #D1FAE5',
                          fontSize: 13,
                          lineHeight: 1.6,
                          color: '#374151',
                          whiteSpace: 'pre-wrap',
                        }}>
                          {previewReplacePlaceholders(selectedTemplate.outroText)}
                        </div>
                      </div>
                    )}

                    {/* Template Info */}
                    <div style={{
                      display: 'flex',
                      gap: 16,
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: '1px solid #D1FAE5',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}>
                        <Calendar size={13} color="#059669" />
                        <span>{t('createOffer.validity', 'Geçerlilik')}: <strong>{selectedTemplate.defaultValidityDays} {t('common.days', 'gün')}</strong></span>
                      </div>
                      {selectedTemplate.defaultBenefits?.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}>
                          <Gift size={13} color="#059669" />
                          <span>{selectedTemplate.defaultBenefits.length} {t('createOffer.benefitsIncluded', 'yan hak dahil')}</span>
                        </div>
                      )}
                    </div>

                    {/* No content message */}
                    {!selectedTemplate.introText && !selectedTemplate.outroText && (
                      <div style={{
                        padding: 16,
                        textAlign: 'center',
                        color: '#6B7280',
                        fontSize: 13,
                      }}>
                        {t('createOffer.templateNoContent', 'Bu şablonda metin içeriği bulunmuyor.')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Salary Section */}
          <div style={{
            padding: 20, background: '#F0FDF4', border: '1px solid #BBF7D0',
            borderRadius: 12, marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <DollarSign size={18} color="#16A34A" />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#166534' }}>
                {t('createOffer.salary', 'Maaş Bilgileri')}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#374151', marginBottom: 6 }}>
                  {t('createOffer.salaryGross', 'Brüt Maaş')} *
                </label>
                <input
                  type="number"
                  value={salaryGross}
                  onChange={(e) => setSalaryGross(e.target.value)}
                  placeholder="0"
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: `1px solid ${errors.salaryGross ? '#EF4444' : '#D1D5DB'}`,
                    borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box',
                  }}
                />
                {errors.salaryGross && (
                  <div style={{ color: '#EF4444', fontSize: 11, marginTop: 4 }}>{errors.salaryGross}</div>
                )}
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151', marginBottom: 6 }}>
                  {t('createOffer.salaryNet', 'Net Maaş')}
                  {autoCalculateNet && currency === 'TRY' && (
                    <span style={{ fontSize: 10, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calculator size={12} /> {t('createOffer.autoCalculated', 'Otomatik')}
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={salaryNet}
                  onChange={(e) => { setSalaryNet(e.target.value); setAutoCalculateNet(false); }}
                  placeholder="0"
                  style={{
                    width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB',
                    borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box',
                    background: autoCalculateNet ? '#F9FAFB' : 'white',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#374151', marginBottom: 6 }}>
                  {t('createOffer.currency', 'Para Birimi')}
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB',
                    borderRadius: 8, fontSize: 14, outline: 'none', background: 'white',
                  }}
                >
                  <option value="TRY">TRY (₺)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dates Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                <Calendar size={16} /> {t('createOffer.startDate', 'İşe Başlangıç Tarihi')} *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%', padding: '10px 12px',
                  border: `1px solid ${errors.startDate ? '#EF4444' : '#E5E7EB'}`,
                  borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
              />
              {errors.startDate && (
                <div style={{ color: '#EF4444', fontSize: 11, marginTop: 4 }}>{errors.startDate}</div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                {t('createOffer.validityDays', 'Geçerlilik Süresi')}
              </label>
              <select
                value={validityDays}
                onChange={(e) => setValidityDays(parseInt(e.target.value))}
                style={{
                  width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB',
                  borderRadius: 8, fontSize: 14, outline: 'none', background: 'white',
                }}
              >
                {[3, 7, 14, 21, 30].map(d => (
                  <option key={d} value={d}>{d} {t('common.days', 'gün')}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                {t('createOffer.validUntil', 'Son Kabul Tarihi')}
              </label>
              <div style={{
                padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8,
                fontSize: 14, background: '#F9FAFB', color: '#6B7280',
              }}>
                {new Date(validUntilDate).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          {allBenefits.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ 
                display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, 
                fontWeight: 600, color: '#374151', marginBottom: 12 
              }}>
                <Gift size={16} color="#8B5CF6" />
                {t('createOffer.benefits', 'Yan Haklar')}
                <span style={{ fontSize: 12, fontWeight: 400, color: '#6B7280' }}>
                  ({selectedBenefitIds.length} {t('common.selected', 'seçili')})
                </span>
              </label>

              <div style={{
                border: '1px solid #E5E7EB', borderRadius: 10, maxHeight: 180, overflow: 'auto',
              }}>
                {Object.entries(benefitsByCategory).map(([category, categoryBenefits]) => (
                  <div key={category}>
                    <div style={{
                      padding: '6px 12px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB',
                      fontSize: 11, fontWeight: 600, color: '#6B7280',
                      display: 'flex', alignItems: 'center', gap: 6, position: 'sticky', top: 0,
                    }}>
                      <span>{CATEGORY_ICONS[category] || '📦'}</span>
                      <span>{categoryNames[category] || category}</span>
                    </div>
                    {categoryBenefits.map(benefit => {
                      const isSelected = selectedBenefitIds.includes(benefit.id);
                      return (
                        <div
                          key={benefit.id}
                          onClick={() => toggleBenefit(benefit.id)}
                          style={{
                            padding: '8px 12px', borderBottom: '1px solid #F3F4F6',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                            background: isSelected ? '#F0FDF4' : 'white', fontSize: 13,
                          }}
                        >
                          <div style={{
                            width: 18, height: 18, borderRadius: 4,
                            border: `2px solid ${isSelected ? '#10B981' : '#D1D5DB'}`,
                            background: isSelected ? '#10B981' : 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            {isSelected && <Check size={12} color="white" />}
                          </div>
                          <span>{benefit.icon || CATEGORY_ICONS[benefit.category]}</span>
                          <span style={{ flex: 1 }}>{benefit.name}</span>
                          {benefit.value && (
                            <span style={{ color: '#6B7280', fontSize: 12 }}>
                              {benefit.value.toLocaleString()} ₺
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Notes */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
              {t('createOffer.notes', 'Ek Notlar')} ({t('common.optional', 'İsteğe bağlı')})
            </label>
            <textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder={t('createOffer.notesPlaceholder', 'Adaya özel notlarınız...')}
              rows={2}
              style={{
                width: '100%', padding: '12px 14px', border: '1px solid #E5E7EB',
                borderRadius: 10, fontSize: 14, outline: 'none', resize: 'vertical',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #E5E7EB',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB',
        }}>
          <button onClick={() => setShowPreview(true)} style={{
            padding: '10px 20px', border: '1px solid #E5E7EB', background: 'white',
            borderRadius: 8, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Eye size={16} /> {t('createOffer.preview', 'Önizle')}
          </button>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{
              padding: '10px 20px', border: '1px solid #E5E7EB', background: 'white',
              borderRadius: 8, fontSize: 14, cursor: 'pointer',
            }}>
              {t('common.cancel', 'İptal')}
            </button>
            <button onClick={() => handleSubmit(false)} disabled={loading} style={{
              padding: '10px 20px', border: '1px solid #6B7280', background: '#F3F4F6',
              borderRadius: 8, fontSize: 14, fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Save size={16} /> {t('createOffer.saveDraft', 'Taslak Kaydet')}
            </button>
            <button onClick={() => handleSubmit(true)} disabled={loading} style={{
              padding: '10px 20px', border: 'none',
              background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white', borderRadius: 8, fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            }}>
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
              {t('createOffer.send', 'Gönder')}
            </button>
          </div>
        </div>

        {/* A4 Preview Modal */}
        {showPreview && (
          <OfferPreviewA4
            candidateName={candidateName}
            jobTitle={jobTitle}
            companyInfo={companyInfo}
            introText={replacePlaceholders(introText)}
            outroText={replacePlaceholders(outroText)}
            salaryGross={salaryGross}
            salaryNet={salaryNet}
            currency={currency}
            startDate={startDate}
            validUntilDate={validUntilDate}
            benefits={selectedBenefits}
            customNotes={customNotes}
            lang={lang}
            onClose={() => setShowPreview(false)}
            t={t}
          />
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>,
    document.body
  );
};

// A4 Preview Component - Full Page
const OfferPreviewA4 = ({
  candidateName, jobTitle, companyInfo, introText, outroText,
  salaryGross, salaryNet, currency, startDate, validUntilDate,
  benefits, customNotes, lang, onClose, t
}) => {
  const currencySymbols = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' };
  const formatDate = (date) => new Date(date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  
  const formatCurrency = (value) => {
    if (!value) return '-';
    return `${parseInt(value).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} ${currencySymbols[currency] || currency}`;
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(30, 41, 59, 0.95)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1200,
    }}>
      <div style={{
        width: '100%', maxWidth: 900, height: '100%',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Preview Header */}
        <div style={{
          padding: '12px 24px', background: '#1F2937', color: 'white',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} />
            {t('createOffer.previewTitle', 'Teklif Önizleme')} - A4 Format
          </span>
          <button onClick={onClose} style={{
            padding: 8, border: 'none', background: 'rgba(255,255,255,0.1)',
            borderRadius: 6, cursor: 'pointer', color: 'white', display: 'flex',
          }}>
            <X size={20} />
          </button>
        </div>

        {/* A4 Document Container - Scrollable */}
        <div style={{ 
          flex: 1, overflow: 'auto', padding: '30px 0', 
          display: 'flex', justifyContent: 'center',
          background: '#374151',
        }}>
          <div style={{
            width: 794, // A4 width at 96 DPI
            minHeight: 1123, // A4 height at 96 DPI
            background: 'white',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            position: 'relative',
          }}>
            {/* Page Content */}
            <div style={{ padding: '60px 70px', minHeight: 1003 }}>
              {/* Company Header */}
              <div style={{ 
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                marginBottom: 40, paddingBottom: 24, borderBottom: '2px solid #10B981',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {companyInfo.logo ? (
                    <img 
                      src={`${API_BASE_URL}${companyInfo.logo.replace('/app', '')}`}
                      alt={companyInfo.name}
                      style={{ height: 60, maxWidth: 180, objectFit: 'contain' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ 
                      width: 60, height: 60, 
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      borderRadius: 12, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Building2 size={30} color="white" />
                    </div>
                  )}
                  <div>
                    <h1 style={{ 
                      fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 4px',
                      fontFamily: 'Georgia, serif',
                    }}>
                      {companyInfo.name || 'Şirket Adı'}
                    </h1>
                    <p style={{ fontSize: 12, color: '#6B7280', margin: 0, fontFamily: 'Arial, sans-serif' }}>
                      {t('createOffer.officialOffer', 'Resmi İş Teklifi')}
                    </p>
                  </div>
                </div>
                
                {/* Company Contact */}
                <div style={{ textAlign: 'right', fontSize: 11, color: '#6B7280', lineHeight: 1.6 }}>
                  {companyInfo.address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                      <MapPin size={12} />
                      <span>{companyInfo.address}</span>
                    </div>
                  )}
                  {(companyInfo.city || companyInfo.district) && (
                    <div>{[companyInfo.district, companyInfo.city].filter(Boolean).join(', ')}</div>
                  )}
                  {companyInfo.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 4 }}>
                      <Phone size={12} />
                      <span>{companyInfo.phone}</span>
                    </div>
                  )}
                  {companyInfo.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                      <Mail size={12} />
                      <span>{companyInfo.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Date & Reference */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
                <div style={{ fontSize: 12, color: '#6B7280' }}>
                  <div>{t('createOffer.date', 'Tarih')}: <strong>{formatDate(new Date())}</strong></div>
                </div>
                <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>
                  {t('createOffer.validUntil', 'Son Kabul')}: {formatDate(validUntilDate)}
                </div>
              </div>

              {/* Candidate Info */}
              <div style={{ marginBottom: 30 }}>
                <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>{t('createOffer.to', 'Sayın')},</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#10B981 ' }}>{candidateName}</div>
              </div>

              {/* Position Box */}
              <div style={{
                background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)', 
                padding: 20, borderRadius: 12, marginBottom: 30,
                borderLeft: '4px solid #10B981',
              }}>
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>
                  {t('createOffer.positionTitle', 'Teklif Edilen Pozisyon')}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#166534' }}>{jobTitle}</div>
              </div>

              {/* Intro Text */}
              {introText && (
                <div style={{ 
                  marginBottom: 30, fontSize: 13, color: '#374151', 
                  lineHeight: 1.8, textAlign: 'justify', whiteSpace: 'pre-wrap',
                  fontFamily: 'Georgia, serif',
                }}>
                  {introText}
                </div>
              )}

              {/* Salary Details Table */}
              <div style={{ marginBottom: 30 }}>
                <h3 style={{ 
                  fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16,
                  paddingBottom: 10, borderBottom: '2px solid #E5E7EB',
                  fontFamily: 'Arial, sans-serif',
                }}>
                  💰 {t('createOffer.salaryDetails', 'Maaş Detayları')}
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <tbody>
                    <tr style={{ background: '#F9FAFB' }}>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #E5E7EB', fontWeight: 500 }}>
                        {t('createOffer.salaryGross', 'Brüt Maaş')}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #E5E7EB', textAlign: 'right', fontWeight: 700, fontSize: 16, color: '#10B981' }}>
                        {formatCurrency(salaryGross)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #E5E7EB', fontWeight: 500 }}>
                        {t('createOffer.salaryNet', 'Net Maaş')}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #E5E7EB', textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(salaryNet)}
                      </td>
                    </tr>
                    <tr style={{ background: '#F9FAFB' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 500 }}>
                        {t('createOffer.startDate', 'İşe Başlangıç Tarihi')}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600 }}>
                        {startDate ? formatDate(startDate) : '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Benefits */}
              {benefits && benefits.length > 0 && (
                <div style={{ marginBottom: 30 }}>
                  <h3 style={{ 
                    fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16,
                    paddingBottom: 10, borderBottom: '2px solid #E5E7EB',
                    fontFamily: 'Arial, sans-serif',
                  }}>
                    🎁 {t('createOffer.benefits', 'Yan Haklar')}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {benefits.map((b, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 16px', background: '#F9FAFB', borderRadius: 8,
                        border: '1px solid #E5E7EB',
                      }}>
                        <span style={{ fontSize: 18 }}>{b.icon || '✓'}</span>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{b.name}</span>
                        {b.value && (
                          <span style={{ color: '#6B7280', fontSize: 12, fontWeight: 600 }}>
                            {b.value.toLocaleString()} ₺
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Notes */}
              {customNotes && (
                <div style={{ 
                  marginBottom: 30, padding: 20, 
                  background: '#FEF3C7', borderRadius: 12,
                  borderLeft: '4px solid #F59E0B',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 10 }}>
                    📝 {t('createOffer.specialNotes', 'Özel Notlar')}
                  </div>
                  <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {customNotes}
                  </div>
                </div>
              )}

              {/* Outro Text */}
              {outroText && (
                <div style={{ 
                  marginBottom: 40, fontSize: 13, color: '#374151', 
                  lineHeight: 1.8, textAlign: 'justify', whiteSpace: 'pre-wrap',
                  fontFamily: 'Georgia, serif',
                }}>
                  {outroText}
                </div>
              )}

              {/* Signature Area */}
              <div style={{ marginTop: 60, paddingTop: 30 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ width: '45%' }}>
                    <div style={{ borderTop: '2px solid #1F2937', width: '100%', marginBottom: 10 }}></div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                      {t('createOffer.employerSignature', 'İşveren İmzası')}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{companyInfo.name}</div>
                  </div>
                  <div style={{ width: '45%' }}>
                    <div style={{ borderTop: '2px solid #1F2937', width: '100%', marginBottom: 10 }}></div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                      {t('createOffer.candidateSignature', 'Aday İmzası')}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{candidateName}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Page Footer */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '16px 70px', borderTop: '1px solid #E5E7EB',
              textAlign: 'center', fontSize: 10, color: '#9CA3AF',
              background: '#FAFAFA',
            }}>
              {t('createOffer.confidential', 'Bu belge gizlidir ve sadece alıcıya özeldir.')}
              <span style={{ margin: '0 16px' }}>|</span>
              {companyInfo.name} © {new Date().getFullYear()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOfferModal;
