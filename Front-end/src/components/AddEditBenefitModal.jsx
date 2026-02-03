import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { X, Gift, Save, Loader2 } from 'lucide-react';
import { CREATE_BENEFIT, UPDATE_BENEFIT, BENEFIT_CATEGORIES, VALUE_PERIODS } from '../graphql/benefits';

const AddEditBenefitModal = ({ benefit, onClose, onSuccess }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'tr' ? 'tr' : 'en';
  const isEditing = !!benefit;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'financial',
    value: '',
    valuePeriod: 'monthly',
    isVariable: false,
    icon: '',
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  // Initialize form with benefit data if editing
  useEffect(() => {
    if (benefit) {
      setFormData({
        name: benefit.name || '',
        description: benefit.description || '',
        category: benefit.category || 'financial',
        value: benefit.value ? benefit.value.toString() : '',
        valuePeriod: benefit.valuePeriod || 'monthly',
        isVariable: benefit.isVariable || false,
        icon: benefit.icon || '',
        isActive: benefit.isActive !== false,
      });
    }
  }, [benefit]);

  // Mutations
  const [createBenefit, { loading: creating }] = useMutation(CREATE_BENEFIT, {
    onCompleted: (data) => {
      if (data.createBenefit.success) {
        onSuccess();
      } else {
        setErrors({ submit: data.createBenefit.message });
      }
    },
    onError: (error) => {
      setErrors({ submit: error.message });
    },
  });

  const [updateBenefit, { loading: updating }] = useMutation(UPDATE_BENEFIT, {
    onCompleted: (data) => {
      if (data.updateBenefit.success) {
        onSuccess();
      } else {
        setErrors({ submit: data.updateBenefit.message });
      }
    },
    onError: (error) => {
      setErrors({ submit: error.message });
    },
  });

  const loading = creating || updating;

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t('benefits.errors.nameRequired', 'Yan hak adı gereklidir');
    }
    
    if (!formData.isVariable && formData.value && isNaN(parseFloat(formData.value))) {
      newErrors.value = t('benefits.errors.invalidValue', 'Geçerli bir değer girin');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const input = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      category: formData.category,
      value: formData.isVariable ? null : (formData.value ? parseFloat(formData.value) : null),
      valuePeriod: formData.valuePeriod,
      isVariable: formData.isVariable,
      icon: formData.icon.trim() || null,
      isActive: formData.isActive,
    };

    if (isEditing) {
      updateBenefit({ variables: { id: benefit.id, input } });
    } else {
      createBenefit({ variables: { input } });
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
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
        maxWidth: 520,
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
          position: 'sticky',
          top: 0,
          background: 'white',
          zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Gift size={20} color="white" />
            </div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#111827' }}>
              {isEditing 
                ? t('benefits.editTitle', 'Yan Hakkı Düzenle')
                : t('benefits.addTitle', 'Yeni Yan Hak Ekle')
              }
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: 8,
              border: 'none',
              background: '#F3F4F6',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} color="#6B7280" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          {/* Error Message */}
          {errors.submit && (
            <div style={{
              padding: '12px 16px',
              background: '#FEE2E2',
              borderRadius: 8,
              color: '#DC2626',
              fontSize: 14,
              marginBottom: 20,
            }}>
              {errors.submit}
            </div>
          )}

          {/* Name */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
            }}>
              {t('benefits.form.name', 'Yan Hak Adı')} <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={t('benefits.form.namePlaceholder', 'Örn: Özel Sağlık Sigortası')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1px solid ${errors.name ? '#EF4444' : '#E5E7EB'}`,
                borderRadius: 10,
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = errors.name ? '#EF4444' : '#3B82F6'}
              onBlur={(e) => e.target.style.borderColor = errors.name ? '#EF4444' : '#E5E7EB'}
            />
            {errors.name && (
              <div style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }}>{errors.name}</div>
            )}
          </div>

          {/* Category */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
            }}>
              {t('benefits.form.category', 'Kategori')}
            </label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10 
            }}>
              {Object.entries(BENEFIT_CATEGORIES).map(([key, cat]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleChange('category', key)}
                  style={{
                    padding: '12px 8px',
                    border: `2px solid ${formData.category === key ? cat.color : '#E5E7EB'}`,
                    borderRadius: 10,
                    background: formData.category === key ? `${cat.color}10` : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{cat.icon}</span>
                  <span style={{ 
                    fontSize: 12, 
                    fontWeight: 500,
                    color: formData.category === key ? cat.color : '#6B7280',
                  }}>
                    {cat.label[lang]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Value & Period */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
            }}>
              {t('benefits.form.value', 'Değeri')} <span style={{ color: '#9CA3AF', fontWeight: 400 }}>({t('common.optional', 'İsteğe bağlı')})</span>
            </label>
            
            {/* Variable Checkbox */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
              cursor: 'pointer',
              fontSize: 14,
              color: '#6B7280',
            }}>
              <input
                type="checkbox"
                checked={formData.isVariable}
                onChange={(e) => handleChange('isVariable', e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              {t('benefits.form.isVariable', 'Değişken (pozisyona/performansa göre)')}
            </label>

            {/* Value Input & Period Select */}
            {!formData.isVariable && (
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => handleChange('value', e.target.value)}
                    placeholder={t('benefits.form.valuePlaceholder', 'Boş bırakılabilir')}
                    style={{
                      width: '100%',
                      padding: '12px 40px 12px 16px',
                      border: `1px solid ${errors.value ? '#EF4444' : '#E5E7EB'}`,
                      borderRadius: 10,
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    right: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9CA3AF',
                    fontSize: 14,
                  }}>
                    ₺
                  </span>
                </div>
                <select
                  value={formData.valuePeriod}
                  onChange={(e) => handleChange('valuePeriod', e.target.value)}
                  style={{
                    padding: '12px 16px',
                    border: '1px solid #E5E7EB',
                    borderRadius: 10,
                    fontSize: 14,
                    outline: 'none',
                    cursor: 'pointer',
                    background: 'white',
                    minWidth: 120,
                  }}
                >
                  {Object.entries(VALUE_PERIODS).map(([key, period]) => (
                    <option key={key} value={key}>{period.label[lang]}</option>
                  ))}
                </select>
              </div>
            )}
            {errors.value && (
              <div style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }}>{errors.value}</div>
            )}
          </div>

          {/* Description */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
            }}>
              {t('benefits.form.description', 'Kısa Açıklama')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={t('benefits.form.descriptionPlaceholder', 'Adaya sunulacak metin...')}
              rows={3}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #E5E7EB',
                borderRadius: 10,
                fontSize: 14,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
              onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
            />
          </div>

          {/* Icon */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
            }}>
              {t('benefits.form.icon', 'İkon (Emoji)')}
            </label>
            
            {/* Emoji Picker Grid */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              padding: 12,
              background: '#F9FAFB',
              borderRadius: 10,
              marginBottom: 8,
            }}>
              {['💰', '🏥', '🚗', '📚', '🏃', '🍽️', '🎁', '💳', '🏠', '✈️', '📱', '💻', '🎓', '🏋️', '🚌', '☕', '🎯', '⭐', '🔥', '💎'].map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleChange('icon', emoji)}
                  style={{
                    width: 40,
                    height: 40,
                    border: formData.icon === emoji ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                    borderRadius: 8,
                    background: formData.icon === emoji ? '#EFF6FF' : 'white',
                    cursor: 'pointer',
                    fontSize: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  {emoji}
                </button>
              ))}
              {/* Clear button */}
              {formData.icon && (
                <button
                  type="button"
                  onClick={() => handleChange('icon', '')}
                  style={{
                    width: 40,
                    height: 40,
                    border: '1px solid #FEE2E2',
                    borderRadius: 8,
                    background: '#FEF2F2',
                    cursor: 'pointer',
                    fontSize: 14,
                    color: '#EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={t('common.delete', 'Sil')}
                >
                  ✕
                </button>
              )}
            </div>
            
            {/* Selected display */}
            {formData.icon && (
              <div style={{ 
                fontSize: 13, 
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                {t('benefits.form.selectedIcon', 'Seçilen')}: <span style={{ fontSize: 20 }}>{formData.icon}</span>
              </div>
            )}
            {!formData.icon && (
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                {t('benefits.form.iconHint', 'Boş bırakırsanız kategori ikonu kullanılır')}
              </div>
            )}
          </div>

          {/* Active Status */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              padding: '12px 16px',
              background: '#F9FAFB',
              borderRadius: 10,
            }}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
                  {t('benefits.form.isActive', 'Aktif')}
                </div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>
                  {t('benefits.form.isActiveHint', 'Pasif yan haklar teklif şablonlarında gösterilmez')}
                </div>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            justifyContent: 'flex-end',
            paddingTop: 20,
            borderTop: '1px solid #E5E7EB',
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                border: '1px solid #E5E7EB',
                background: 'white',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                color: '#6B7280',
              }}
            >
              {t('common.cancel', 'İptal')}
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                border: 'none',
                background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                color: 'white',
                borderRadius: 10,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: loading ? 'none' : '0 4px 14px rgba(59, 130, 246, 0.35)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" />
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
        </form>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AddEditBenefitModal;
