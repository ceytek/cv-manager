/**
 * Add/Edit Second Interview Template Modal
 * Supports drag-and-drop variables for dynamic content
 * Two template types: Online and In-Person
 */
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { X, GripVertical, User, Briefcase, Building2, Calendar, Clock, Video, MapPin, Link2, Map } from 'lucide-react';
import { 
  CREATE_SECOND_INTERVIEW_TEMPLATE, 
  UPDATE_SECOND_INTERVIEW_TEMPLATE,
  GET_SECOND_INTERVIEW_TEMPLATE_VARIABLES,
  DEFAULT_ONLINE_TEMPLATE,
  DEFAULT_IN_PERSON_TEMPLATE,
} from '../graphql/secondInterviewTemplate';
import { GET_COMPANY_ADDRESSES } from '../graphql/companyAddress';

const AddEditSecondInterviewTemplateModal = ({ template, defaultType, onClose }) => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  const isEdit = !!template;
  
  const [name, setName] = useState(template?.name || '');
  const [templateType, setTemplateType] = useState(template?.templateType || defaultType || 'ONLINE');
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');
  const [language, setLanguage] = useState(template?.language || 'TR');
  const [isActive, setIsActive] = useState(template?.isActive ?? true);
  const [isDefault, setIsDefault] = useState(template?.isDefault ?? false);
  const [saving, setSaving] = useState(false);
  const [draggedVar, setDraggedVar] = useState(null);
  
  const subjectRef = useRef(null);
  const bodyRef = useRef(null);
  const [activeField, setActiveField] = useState(null);

  // Fetch available variables
  const { data: variablesData } = useQuery(GET_SECOND_INTERVIEW_TEMPLATE_VARIABLES);
  
  // Fetch company addresses for in-person templates
  const { data: addressesData } = useQuery(GET_COMPANY_ADDRESSES);
  const companyAddresses = addressesData?.companyAddresses || [];
  const [selectedAddressId, setSelectedAddressId] = useState('');

  const [createTemplate] = useMutation(CREATE_SECOND_INTERVIEW_TEMPLATE);
  const [updateTemplate] = useMutation(UPDATE_SECOND_INTERVIEW_TEMPLATE);

  // Get variables based on template type
  const variables = templateType === 'ONLINE'
    ? (variablesData?.secondInterviewTemplateVariables?.onlineVariables || [])
    : (variablesData?.secondInterviewTemplateVariables?.inPersonVariables || []);

  // Set default content when creating new template
  useEffect(() => {
    if (!isEdit && !subject && !body) {
      const defaultContent = templateType === 'ONLINE' ? DEFAULT_ONLINE_TEMPLATE : DEFAULT_IN_PERSON_TEMPLATE;
      if (language === 'TR') {
        setSubject(defaultContent.subject_tr);
        setBody(defaultContent.body_tr);
      } else {
        setSubject(defaultContent.subject_en);
        setBody(defaultContent.body_en);
      }
    }
  }, [templateType, language, isEdit]);

  // Variable icons
  const getVariableIcon = (key) => {
    switch(key) {
      case 'candidate_name':
        return <User size={14} />;
      case 'position':
        return <Briefcase size={14} />;
      case 'company_name':
        return <Building2 size={14} />;
      case 'date':
        return <Calendar size={14} />;
      case 'time':
        return <Clock size={14} />;
      case 'platform':
        return <Video size={14} />;
      case 'meeting_link':
        return <Link2 size={14} />;
      case 'address_name':
        return <MapPin size={14} />;
      case 'address_detail':
        return <MapPin size={14} />;
      case 'google_maps_link':
        return <Map size={14} />;
      default:
        return <GripVertical size={14} />;
    }
  };

  // Get selected address for preview
  const selectedAddress = companyAddresses.find(a => a.id === selectedAddressId);

  // Sample values for preview
  const getSampleValue = (key) => {
    // Use selected address values if available
    if (selectedAddress) {
      if (key === 'address_name') return selectedAddress.name;
      if (key === 'address_detail') return `${selectedAddress.address}${selectedAddress.city ? ', ' + selectedAddress.city : ''}`;
      if (key === 'google_maps_link') return selectedAddress.googleMapsLink || 'https://maps.google.com/...';
    }
    
    const samples = {
      candidate_name: isEnglish ? 'John Doe' : 'Ahmet Yılmaz',
      position: isEnglish ? 'Software Developer' : 'Yazılım Geliştirici',
      company_name: isEnglish ? 'ABC Company' : 'ABC Şirketi',
      date: isEnglish ? 'January 25, 2026' : '25 Ocak 2026',
      time: '14:00',
      platform: 'Zoom',
      meeting_link: 'https://zoom.us/j/123456789',
      address_name: isEnglish ? 'Head Office' : 'Merkez Ofis',
      address_detail: isEnglish ? '123 Main St, Istanbul' : 'Levent Mah. İş Merkezi No:123, İstanbul',
      google_maps_link: 'https://maps.google.com/...',
    };
    return samples[key] || key;
  };
  
  // Filter out address variables for separate handling
  const addressVariableKeys = ['address_name', 'address_detail', 'google_maps_link'];
  const filteredVariables = templateType === 'IN_PERSON' 
    ? variables.filter(v => !addressVariableKeys.includes(v.key))
    : variables;

  // Handle drag start
  const handleDragStart = (e, variable) => {
    setDraggedVar(variable);
    e.dataTransfer.setData('text/plain', `{${variable.key}}`);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Handle drag over
  const handleDragOver = (e, field) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setActiveField(field);
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setActiveField(null);
  };

  // Handle drop
  const handleDrop = (e, field) => {
    e.preventDefault();
    if (!draggedVar) return;
    
    const varText = `{${draggedVar.key}}`;
    
    if (field === 'subject') {
      const input = subjectRef.current;
      const start = input.selectionStart || subject.length;
      const newValue = subject.slice(0, start) + varText + subject.slice(start);
      setSubject(newValue);
    } else if (field === 'body') {
      const textarea = bodyRef.current;
      const start = textarea.selectionStart || body.length;
      const newValue = body.slice(0, start) + varText + body.slice(start);
      setBody(newValue);
    }
    
    setDraggedVar(null);
    setActiveField(null);
  };

  // Insert variable at cursor (click handler)
  const insertVariable = (variable, field) => {
    const varText = `{${variable.key}}`;
    
    if (field === 'subject') {
      const input = subjectRef.current;
      const start = input.selectionStart || subject.length;
      const newValue = subject.slice(0, start) + varText + subject.slice(start);
      setSubject(newValue);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + varText.length, start + varText.length);
      }, 0);
    } else if (field === 'body') {
      const textarea = bodyRef.current;
      const start = textarea.selectionStart || body.length;
      const newValue = body.slice(0, start) + varText + body.slice(start);
      setBody(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + varText.length, start + varText.length);
      }, 0);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!name.trim() || !subject.trim() || !body.trim()) {
      alert(isEnglish ? 'Please fill in all fields' : 'Lütfen tüm alanları doldurun');
      return;
    }

    setSaving(true);
    try {
      const input = {
        name: name.trim(),
        templateType: templateType,
        subject: subject.trim(),
        body: body.trim(),
        language,
        isActive,
        isDefault,
      };

      if (isEdit) {
        await updateTemplate({ variables: { id: template.id, input } });
      } else {
        await createTemplate({ variables: { input } });
      }
      onClose();
    } catch (err) {
      alert((isEnglish ? 'Error: ' : 'Hata: ') + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Preview with sample data
  const getPreview = (text) => {
    let preview = text;
    variables.forEach(v => {
      preview = preview.replace(
        new RegExp(`\\{${v.key}\\}`, 'g'), 
        `<strong style="color:#7C3AED">${getSampleValue(v.key)}</strong>`
      );
    });
    return preview;
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        width: '90%',
        maxWidth: 950,
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FAFAFA',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#F3E8FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {templateType === 'ONLINE' ? (
                <Video size={20} color="#7C3AED" />
              ) : (
                <MapPin size={20} color="#7C3AED" />
              )}
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937' }}>
                {isEdit 
                  ? t('secondInterviewTemplates.modal.editTitle', 'Şablonu Düzenle')
                  : t('secondInterviewTemplates.modal.createTitle', 'Yeni Şablon Oluştur')
                }
              </h2>
              <p style={{ fontSize: 12, color: '#6B7280' }}>
                {templateType === 'ONLINE' 
                  ? t('secondInterviewTemplates.onlineType', 'Online Görüşme')
                  : t('secondInterviewTemplates.inPersonType', 'Yüz Yüze Görüşme')
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 8,
            }}
          >
            <X size={20} color="#6B7280" />
          </button>
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: 24,
          display: 'grid',
          gridTemplateColumns: '240px 1fr',
          gap: 24,
        }}>
          {/* Variables Panel (Left) */}
          <div>
            <h3 style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              color: '#374151', 
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <GripVertical size={16} color="#7C3AED" />
              {t('secondInterviewTemplates.modal.dragDropVariables', 'Değişkenler')}
            </h3>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>
              {t('secondInterviewTemplates.modal.dragDropHint', 'Sürükle-bırak veya tıkla')}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredVariables.map(v => (
                <div
                  key={v.key}
                  draggable
                  onDragStart={(e) => handleDragStart(e, v)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    cursor: 'grab',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F5F3FF';
                    e.currentTarget.style.borderColor = '#8B5CF6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#F9FAFB';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}
                >
                  <GripVertical size={14} color="#9CA3AF" />
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: '#F3E8FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#7C3AED',
                  }}>
                    {getVariableIcon(v.key)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1F2937' }}>
                      {isEnglish ? v.labelEn : v.labelTr}
                    </div>
                    <code style={{ fontSize: 11, color: '#6B7280' }}>
                      {`{${v.key}}`}
                    </code>
                  </div>
                </div>
              ))}
            </div>

            {/* Address Selection for In-Person Templates */}
            {templateType === 'IN_PERSON' && (
              <div style={{ marginTop: 20 }}>
                <h4 style={{ 
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: '#374151', 
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <MapPin size={14} color="#7C3AED" />
                  {t('secondInterviewTemplates.modal.addressSection', 'Adres Bilgisi')}
                </h4>
                <select
                  value={selectedAddressId}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: 8,
                    fontSize: 13,
                    marginBottom: 12,
                  }}
                >
                  <option value="">{t('secondInterviewTemplates.modal.selectAddress', 'Adres seçin...')}</option>
                  {companyAddresses.map(addr => (
                    <option key={addr.id} value={addr.id}>{addr.name}</option>
                  ))}
                </select>
                
                {selectedAddressId && selectedAddress && (
                  <div style={{
                    background: '#F5F3FF',
                    border: '1px solid #DDD6FE',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 12,
                  }}>
                    <div style={{ fontWeight: 600, color: '#5B21B6', marginBottom: 4 }}>
                      {selectedAddress.name}
                    </div>
                    <div style={{ color: '#6B7280', marginBottom: 8 }}>
                      {selectedAddress.address}
                      {selectedAddress.city && `, ${selectedAddress.city}`}
                    </div>
                    <button
                      onClick={() => {
                        const addressBlock = `\n📍 ${isEnglish ? 'Location' : 'Adres'}: {address_name}\n   {address_detail}\n🗺️ ${isEnglish ? 'Map' : 'Harita'}: {google_maps_link}`;
                        setBody(prev => prev + addressBlock);
                      }}
                      style={{
                        padding: '6px 12px',
                        background: '#7C3AED',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <MapPin size={14} />
                      {t('secondInterviewTemplates.modal.insertAddress', 'Adres Ekle')}
                    </button>
                  </div>
                )}
                
                {companyAddresses.length === 0 && (
                  <p style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>
                    {t('secondInterviewTemplates.modal.noAddresses', 'Henüz adres tanımlı değil. Ayarlar → Şirket Adresleri\'nden ekleyebilirsiniz.')}
                  </p>
                )}
              </div>
            )}

            {/* Quick Insert Buttons */}
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 8 }}>
                {t('secondInterviewTemplates.modal.quickAdd', 'Hızlı Ekle')}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {filteredVariables.map(v => (
                  <button
                    key={v.key}
                    onClick={() => insertVariable(v, 'body')}
                    style={{
                      padding: '4px 8px',
                      background: '#EDE9FE',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: 11,
                      color: '#6D28D9',
                      cursor: 'pointer',
                    }}
                  >
                    {`{${v.key}}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form (Right) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Template Name */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                {t('secondInterviewTemplates.modal.templateName', 'Şablon Adı')} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('secondInterviewTemplates.modal.templateNamePlaceholder', 'örn: Online Davet - Türkçe')}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 8,
                  fontSize: 14,
                }}
              />
            </div>

            {/* Language & Options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  {t('secondInterviewTemplates.modal.language', 'Dil')}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                >
                  <option value="TR">Türkçe</option>
                  <option value="EN">English</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  id="isActive"
                />
                <label htmlFor="isActive" style={{ fontSize: 13, color: '#374151' }}>
                  {t('secondInterviewTemplates.modal.active', 'Aktif')}
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  id="isDefault"
                />
                <label htmlFor="isDefault" style={{ fontSize: 13, color: '#374151' }}>
                  {t('secondInterviewTemplates.modal.default', 'Varsayılan')}
                </label>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                {t('secondInterviewTemplates.modal.emailSubject', 'E-posta Konusu')} *
              </label>
              <input
                ref={subjectRef}
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onDragOver={(e) => handleDragOver(e, 'subject')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'subject')}
                placeholder={t('secondInterviewTemplates.modal.emailSubjectPlaceholder', '2. Görüşme Daveti - {position}')}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `2px solid ${activeField === 'subject' ? '#8B5CF6' : '#D1D5DB'}`,
                  borderRadius: 8,
                  fontSize: 14,
                  transition: 'border-color 0.2s',
                }}
              />
            </div>

            {/* Body */}
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                {t('secondInterviewTemplates.modal.emailBody', 'E-posta İçeriği')} *
              </label>
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onDragOver={(e) => handleDragOver(e, 'body')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'body')}
                style={{
                  width: '100%',
                  minHeight: 200,
                  padding: '12px 14px',
                  border: `2px solid ${activeField === 'body' ? '#8B5CF6' : '#D1D5DB'}`,
                  borderRadius: 8,
                  fontSize: 14,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: 1.6,
                  transition: 'border-color 0.2s',
                }}
              />
            </div>

            {/* Preview */}
            {body && (
              <div style={{
                background: '#FAFAFA',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                padding: 16,
              }}>
                <h4 style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' }}>
                  {t('secondInterviewTemplates.modal.preview', 'Önizleme')}
                </h4>
                <div 
                  style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}
                  dangerouslySetInnerHTML={{ __html: getPreview(body).replace(/\n/g, '<br/>') }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
          background: '#FAFAFA',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'white',
              border: '1px solid #D1D5DB',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {t('common.cancel', 'İptal')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 24px',
              background: saving ? '#9CA3AF' : '#8B5CF6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving 
              ? t('secondInterviewTemplates.modal.saving', 'Kaydediliyor...') 
              : isEdit 
                ? t('secondInterviewTemplates.modal.update', 'Güncelle') 
                : t('secondInterviewTemplates.modal.save', 'Kaydet')
            }
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddEditSecondInterviewTemplateModal;
