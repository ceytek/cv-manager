import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { X, FileText, Info, Save, Loader2, Gift, Check } from 'lucide-react';
import { CREATE_OFFER_TEMPLATE, UPDATE_OFFER_TEMPLATE, OFFER_TEMPLATE_PLACEHOLDERS } from '../graphql/offer';
import { GET_BENEFITS } from '../graphql/benefits';

// Benefit category icons
const CATEGORY_ICONS = {
  FINANCIAL: '💰',
  HEALTH: '🏥',
  TRANSPORTATION: '🚗',
  DEVELOPMENT: '📚',
  LIFESTYLE: '🎯',
  FOOD: '🍽️',
};

const AddEditOfferTemplateModal = ({ template, onClose, onSuccess }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'tr' ? 'tr' : 'en';
  const isEditing = !!template;

  const [formData, setFormData] = useState({
    name: '',
    introText: '',
    outroText: '',
    defaultValidityDays: 7,
    isActive: true,
  });

  const [selectedBenefits, setSelectedBenefits] = useState([]);
  const [errors, setErrors] = useState({});

  // Fetch benefits
  const { data: benefitsData, loading: benefitsLoading } = useQuery(GET_BENEFITS, {
    variables: { isActive: true },
  });

  const benefits = benefitsData?.benefits || [];

  // Load template data if editing
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        introText: template.introText || '',
        outroText: template.outroText || '',
        defaultValidityDays: template.defaultValidityDays || 7,
        isActive: template.isActive !== false,
      });
      
      // Load selected benefits
      if (template.defaultBenefits) {
        setSelectedBenefits(template.defaultBenefits.map(b => b.id));
      }
    }
  }, [template]);

  // Mutations
  const [createTemplate, { loading: creating }] = useMutation(CREATE_OFFER_TEMPLATE);
  const [updateTemplate, { loading: updating }] = useMutation(UPDATE_OFFER_TEMPLATE);

  const loading = creating || updating;

  // Validation
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = t('offerTemplates.errors.nameRequired', 'Şablon adı zorunludur');
    }
    if (formData.defaultValidityDays < 1 || formData.defaultValidityDays > 90) {
      newErrors.defaultValidityDays = t('offerTemplates.errors.validityRange', 'Geçerlilik süresi 1-90 gün arasında olmalıdır');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Toggle benefit selection
  const toggleBenefit = (benefitId) => {
    setSelectedBenefits(prev => {
      if (prev.includes(benefitId)) {
        return prev.filter(id => id !== benefitId);
      } else {
        return [...prev, benefitId];
      }
    });
  };

  // Get placeholder by language
  const getPlaceholder = (key) => {
    const item = OFFER_TEMPLATE_PLACEHOLDERS[key];
    if (!item) return '';
    return item.placeholder[lang] || item.placeholder.tr;
  };

  // Insert placeholder
  const insertPlaceholder = (field, key) => {
    const placeholder = getPlaceholder(key);
    const textarea = document.getElementById(`offer-${field}`);
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = formData[field];
      const newValue = currentValue.substring(0, start) + placeholder + currentValue.substring(end);
      handleChange(field, newValue);
      setTimeout(() => {
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
        textarea.focus();
      }, 0);
    } else {
      handleChange(field, formData[field] + placeholder);
    }
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Prepare benefits data
    const selectedBenefitsData = benefits
      .filter(b => selectedBenefits.includes(b.id))
      .map(b => ({
        id: b.id,
        name: b.name,
        value: b.value,
        valuePeriod: b.valuePeriod,
        isVariable: b.isVariable,
        category: b.category,
        icon: b.icon,
      }));

    const input = {
      name: formData.name.trim(),
      introText: formData.introText.trim() || null,
      outroText: formData.outroText.trim() || null,
      defaultValidityDays: parseInt(formData.defaultValidityDays, 10),
      defaultBenefits: selectedBenefitsData.length > 0 ? selectedBenefitsData : null,
      isActive: formData.isActive,
    };

    try {
      if (isEditing) {
        const { data } = await updateTemplate({
          variables: { id: template.id, input },
        });
        if (data.updateOfferTemplate.success) {
          onSuccess();
        } else {
          setErrors({ submit: data.updateOfferTemplate.message });
        }
      } else {
        const { data } = await createTemplate({
          variables: { input },
        });
        if (data.createOfferTemplate.success) {
          onSuccess();
        } else {
          setErrors({ submit: data.createOfferTemplate.message });
        }
      }
    } catch (error) {
      setErrors({ submit: error.message });
    }
  };

  const validityOptions = [
    { value: 3, label: `3 ${t('common.days', 'gün')}` },
    { value: 7, label: `7 ${t('common.days', 'gün')}` },
    { value: 14, label: `14 ${t('common.days', 'gün')}` },
    { value: 21, label: `21 ${t('common.days', 'gün')}` },
    { value: 30, label: `30 ${t('common.days', 'gün')}` },
  ];

  // Group benefits by category
  const benefitsByCategory = benefits.reduce((acc, benefit) => {
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
    OTHER: t('benefits.categories.other', 'Diğer'),
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 20,
        maxWidth: 800,
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
          color: 'white',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FileText size={24} />
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                {isEditing 
                  ? t('offerTemplates.editTitle', 'Şablonu Düzenle')
                  : t('offerTemplates.addTitle', 'Yeni Teklif Şablonu')
                }
              </h2>
              <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
                {isEditing ? template.name : t('offerTemplates.addDesc', 'Adaylara göndereceğiniz teklifler için şablon oluşturun')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: 8,
              border: 'none',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 8,
              cursor: 'pointer',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {/* Error */}
          {errors.submit && (
            <div style={{
              padding: 12,
              background: '#FEF2F2',
              border: '1px solid #FEE2E2',
              borderRadius: 8,
              color: '#DC2626',
              fontSize: 14,
              marginBottom: 20,
            }}>
              {errors.submit}
            </div>
          )}

          {/* Template Name */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              display: 'block', 
              fontSize: 14, 
              fontWeight: 600, 
              color: '#374151',
              marginBottom: 8 
            }}>
              {t('offerTemplates.name', 'Şablon Adı')} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={t('offerTemplates.namePlaceholder', 'Örn: Standart Teklif Şablonu')}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: `1px solid ${errors.name ? '#EF4444' : '#E5E7EB'}`,
                borderRadius: 10,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {errors.name && (
              <div style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.name}</div>
            )}
          </div>

          {/* Placeholders Info */}
          <div style={{
            padding: 16,
            background: '#F0F9FF',
            border: '1px solid #BAE6FD',
            borderRadius: 10,
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Info size={16} color="#0284C7" />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0369A1' }}>
                {t('offerTemplates.placeholders', 'Kullanılabilir Değişkenler')}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(OFFER_TEMPLATE_PLACEHOLDERS).map(([key, value]) => (
                <span
                  key={key}
                  style={{
                    padding: '4px 10px',
                    background: 'white',
                    border: '1px solid #BAE6FD',
                    borderRadius: 6,
                    fontSize: 12,
                    color: '#0369A1',
                    cursor: 'pointer',
                  }}
                  title={value[lang]}
                >
                  {value.placeholder[lang] || value.placeholder.tr}
                </span>
              ))}
            </div>
          </div>

          {/* Intro Text */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 14, 
              fontWeight: 600, 
              color: '#374151',
              marginBottom: 8 
            }}>
              <span>{t('offerTemplates.introText', 'Giriş Metni')}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {['candidate_name', 'position', 'company'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => insertPlaceholder('introText', key)}
                    style={{
                      padding: '2px 8px',
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      borderRadius: 4,
                      fontSize: 11,
                      color: '#2563EB',
                      cursor: 'pointer',
                    }}
                    title={OFFER_TEMPLATE_PLACEHOLDERS[key][lang]}
                  >
                    {getPlaceholder(key)}
                  </button>
                ))}
              </div>
            </label>
            <textarea
              id="offer-introText"
              value={formData.introText}
              onChange={(e) => handleChange('introText', e.target.value)}
              placeholder={lang === 'tr' 
                ? 'Sayın {{aday_adi}},\n\n{{sirket}} olarak, {{pozisyon}} pozisyonu için size iş teklifinde bulunmaktan memnuniyet duyarız.'
                : 'Dear {{candidate_name}},\n\nWe are pleased to extend a job offer for the {{position}} position at {{company}}.'
              }
              rows={5}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #E5E7EB',
                borderRadius: 10,
                fontSize: 14,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Outro Text */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 14, 
              fontWeight: 600, 
              color: '#374151',
              marginBottom: 8 
            }}>
              <span>{t('offerTemplates.outroText', 'Kapanış Metni')}</span>
            </label>
            <textarea
              id="offer-outroText"
              value={formData.outroText}
              onChange={(e) => handleChange('outroText', e.target.value)}
              placeholder={lang === 'tr'
                ? 'Bu teklif {{son_kabul_tarihi}} tarihine kadar geçerlidir.\n\nSorularınız için bizimle iletişime geçebilirsiniz.\n\nSaygılarımızla'
                : 'This offer is valid until {{valid_until}}.\n\nPlease feel free to contact us if you have any questions.\n\nBest regards'
              }
              rows={4}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #E5E7EB',
                borderRadius: 10,
                fontSize: 14,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Benefits Selection */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14, 
              fontWeight: 600, 
              color: '#374151',
              marginBottom: 12 
            }}>
              <Gift size={16} color="#3B82F6" />
              <span>{t('offerTemplates.defaultBenefits', 'Varsayılan Yan Haklar')}</span>
              <span style={{ fontSize: 12, fontWeight: 400, color: '#6B7280' }}>
                ({selectedBenefits.length} {t('common.selected', 'seçili')})
              </span>
            </label>
            
            {benefitsLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#6B7280' }}>
                {t('common.loading', 'Yükleniyor...')}
              </div>
            ) : benefits.length === 0 ? (
              <div style={{ 
                padding: 20, 
                textAlign: 'center', 
                color: '#6B7280',
                background: '#F9FAFB',
                borderRadius: 10,
                border: '1px dashed #E5E7EB',
              }}>
                {t('offerTemplates.noBenefits', 'Henüz yan hak tanımlanmamış. Ayarlar → Yan Haklar bölümünden ekleyebilirsiniz.')}
              </div>
            ) : (
              <div style={{
                border: '1px solid #E5E7EB',
                borderRadius: 10,
                maxHeight: 250,
                overflow: 'auto',
              }}>
                {Object.entries(benefitsByCategory).map(([category, categoryBenefits]) => (
                  <div key={category}>
                    {/* Category Header */}
                    <div style={{
                      padding: '8px 12px',
                      background: '#F9FAFB',
                      borderBottom: '1px solid #E5E7EB',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#6B7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      position: 'sticky',
                      top: 0,
                    }}>
                      <span>{CATEGORY_ICONS[category] || '📦'}</span>
                      <span>{categoryNames[category] || category}</span>
                    </div>
                    
                    {/* Benefits in category */}
                    {categoryBenefits.map(benefit => {
                      const isSelected = selectedBenefits.includes(benefit.id);
                      return (
                        <div
                          key={benefit.id}
                          onClick={() => toggleBenefit(benefit.id)}
                          style={{
                            padding: '10px 12px',
                            borderBottom: '1px solid #F3F4F6',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            background: isSelected ? '#EFF6FF' : 'white',
                            transition: 'background 0.15s',
                          }}
                          onMouseOver={(e) => {
                            if (!isSelected) e.currentTarget.style.background = '#F9FAFB';
                          }}
                          onMouseOut={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'white';
                          }}
                        >
                          {/* Checkbox */}
                          <div style={{
                            width: 20,
                            height: 20,
                            borderRadius: 4,
                            border: `2px solid ${isSelected ? '#3B82F6' : '#D1D5DB'}`,
                            background: isSelected ? '#3B82F6' : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {isSelected && <Check size={14} color="white" />}
                          </div>
                          
                          {/* Icon */}
                          <span style={{ fontSize: 16 }}>{benefit.icon || CATEGORY_ICONS[benefit.category] || '📦'}</span>
                          
                          {/* Name & Value */}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, color: '#111827' }}>{benefit.name}</div>
                            {benefit.value && (
                              <div style={{ fontSize: 12, color: '#6B7280' }}>
                                {benefit.value.toLocaleString()} ₺ 
                                {benefit.valuePeriod && ` / ${
                                  benefit.valuePeriod === 'DAILY' ? t('benefits.valuePeriods.daily', 'Günlük') :
                                  benefit.valuePeriod === 'MONTHLY' ? t('benefits.valuePeriods.monthly', 'Aylık') :
                                  t('benefits.valuePeriods.yearly', 'Yıllık')
                                }`}
                              </div>
                            )}
                          </div>
                          
                          {/* Variable badge */}
                          {benefit.isVariable && (
                            <span style={{
                              padding: '2px 6px',
                              background: '#FEF3C7',
                              color: '#92400E',
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 500,
                            }}>
                              {t('benefits.variable', 'Değişken')}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Validity Days & Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Validity Days */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: 14, 
                fontWeight: 600, 
                color: '#374151',
                marginBottom: 8 
              }}>
                {t('offerTemplates.validityDays', 'Varsayılan Geçerlilik Süresi')}
              </label>
              <select
                value={formData.defaultValidityDays}
                onChange={(e) => handleChange('defaultValidityDays', parseInt(e.target.value, 10))}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #E5E7EB',
                  borderRadius: 10,
                  fontSize: 14,
                  outline: 'none',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                {validityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.defaultValidityDays && (
                <div style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.defaultValidityDays}</div>
              )}
            </div>

            {/* Status */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: 14, 
                fontWeight: 600, 
                color: '#374151',
                marginBottom: 8 
              }}>
                {t('offerTemplates.status', 'Durum')}
              </label>
              <div style={{
                display: 'flex',
                gap: 8,
              }}>
                <button
                  type="button"
                  onClick={() => handleChange('isActive', true)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: `1px solid ${formData.isActive ? '#10B981' : '#E5E7EB'}`,
                    background: formData.isActive ? '#D1FAE5' : 'white',
                    borderRadius: 10,
                    fontSize: 14,
                    color: formData.isActive ? '#059669' : '#6B7280',
                    cursor: 'pointer',
                    fontWeight: formData.isActive ? 600 : 400,
                  }}
                >
                  {t('common.active', 'Aktif')}
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('isActive', false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: `1px solid ${!formData.isActive ? '#6B7280' : '#E5E7EB'}`,
                    background: !formData.isActive ? '#F3F4F6' : 'white',
                    borderRadius: 10,
                    fontSize: 14,
                    color: !formData.isActive ? '#374151' : '#6B7280',
                    cursor: 'pointer',
                    fontWeight: !formData.isActive ? 600 : 400,
                  }}
                >
                  {t('common.inactive', 'Pasif')}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
          background: '#F9FAFB',
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '12px 24px',
              border: '1px solid #E5E7EB',
              background: 'white',
              borderRadius: 10,
              fontSize: 14,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {t('common.cancel', 'İptal')}
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              color: 'white',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                {t('common.saving', 'Kaydediliyor...')}
              </>
            ) : (
              <>
                <Save size={16} />
                {isEditing ? t('common.save', 'Kaydet') : t('common.create', 'Oluştur')}
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AddEditOfferTemplateModal;
