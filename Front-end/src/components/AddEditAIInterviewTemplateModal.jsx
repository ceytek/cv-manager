/**
 * Add/Edit AI Interview Email Template Modal
 * Supports drag-and-drop variables for dynamic content
 */
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { X, GripVertical, User, Briefcase, Building2, Calendar, Clock, Link2, Timer, Sparkles, Eye } from 'lucide-react';
import { 
  CREATE_AI_INTERVIEW_EMAIL_TEMPLATE, 
  UPDATE_AI_INTERVIEW_EMAIL_TEMPLATE,
  DEFAULT_AI_INTERVIEW_TEMPLATE_TR,
  DEFAULT_AI_INTERVIEW_TEMPLATE_EN,
} from '../graphql/aiInterviewTemplate';

const AddEditAIInterviewTemplateModal = ({ isOpen, template, variables = [], onClose }) => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  const isEdit = !!template;
  
  // Sistem diline göre dil belirle
  const systemLanguage = isEnglish ? 'EN' : 'TR';
  
  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');
  const [isActive, setIsActive] = useState(template?.isActive ?? true);
  const [isDefault, setIsDefault] = useState(template?.isDefault ?? false);
  const [saving, setSaving] = useState(false);
  const [draggedVar, setDraggedVar] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const subjectRef = useRef(null);
  const bodyRef = useRef(null);
  const [activeField, setActiveField] = useState(null);

  const [createTemplate] = useMutation(CREATE_AI_INTERVIEW_EMAIL_TEMPLATE);
  const [updateTemplate] = useMutation(UPDATE_AI_INTERVIEW_EMAIL_TEMPLATE);

  // Set default content when creating new template based on system language
  useEffect(() => {
    if (!isEdit && !name && !subject && !body) {
      const defaultContent = isEnglish 
        ? DEFAULT_AI_INTERVIEW_TEMPLATE_EN 
        : DEFAULT_AI_INTERVIEW_TEMPLATE_TR;
      setName(defaultContent.name);
      setSubject(defaultContent.subject);
      setBody(defaultContent.body);
    }
  }, [isEdit, isEnglish]);

  // Variable icons
  const getVariableIcon = (key) => {
    switch(key) {
      case 'candidate_name':
        return <User size={14} />;
      case 'position':
        return <Briefcase size={14} />;
      case 'company_name':
        return <Building2 size={14} />;
      case 'interview_link':
        return <Link2 size={14} />;
      case 'expiry_date':
        return <Calendar size={14} />;
      case 'expiry_time':
        return <Clock size={14} />;
      case 'duration':
        return <Timer size={14} />;
      default:
        return <GripVertical size={14} />;
    }
  };

  // Sample values for preview
  const getSampleValue = (key) => {
    const samples = {
      candidate_name: isEnglish ? 'John Doe' : 'Ahmet Yılmaz',
      position: isEnglish ? 'Software Developer' : 'Yazılım Geliştirici',
      company_name: isEnglish ? 'ABC Company' : 'ABC Şirketi',
      interview_link: 'https://interview.example.com/abc123xyz',
      expiry_date: isEnglish ? 'January 27, 2026' : '27 Ocak 2026',
      expiry_time: '23:59',
      duration: isEnglish ? '30 minutes' : '30 dakika',
    };
    return samples[key] || key;
  };

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
        subject: subject.trim(),
        body: body.trim(),
        language: systemLanguage,
        isActive,
        isDefault,
      };
      
      if (isEdit) {
        await updateTemplate({
          variables: { id: template.id, input },
        });
      } else {
        await createTemplate({
          variables: { input },
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
      alert((isEnglish ? 'Error: ' : 'Hata: ') + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Render preview with sample values
  const renderPreview = (text) => {
    let result = text;
    variables.forEach(v => {
      const regex = new RegExp(`\\{${v.key}\\}`, 'g');
      result = result.replace(regex, `<span style="background:#DBEAFE;color:#1D4ED8;padding:1px 4px;border-radius:4px;font-weight:500;">${getSampleValue(v.key)}</span>`);
    });
    return result;
  };

  if (!isOpen) return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: 20,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        width: '100%',
        maxWidth: 1000,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#DBEAFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles size={20} color="#3B82F6" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', margin: 0 }}>
                {isEdit 
                  ? t('aiInterviewTemplates.modal.editTitle', 'Şablonu Düzenle')
                  : t('aiInterviewTemplates.modal.addTitle', 'Yeni Şablon Oluştur')}
              </h2>
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                {t('aiInterviewTemplates.modal.subtitle', 'AI görüşme davet e-postası şablonu')}
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
          gridTemplateColumns: showPreview ? '1fr 1fr' : '1fr',
          gap: 24,
        }}>
          {/* Form Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Template Name */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                {t('aiInterviewTemplates.modal.templateName', 'Şablon Adı')} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('aiInterviewTemplates.modal.templateNamePlaceholder', 'Örn: Standart AI Görüşme Daveti')}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 10,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>

            {/* Status Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Active */}
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  {t('common.status', 'Durum')}
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 14px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 10,
                  cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  <span style={{ fontSize: 14, color: '#374151' }}>
                    {t('common.active', 'Aktif')}
                  </span>
                </label>
              </div>

              {/* Default */}
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  {t('common.default', 'Varsayılan')}
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 14px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 10,
                  cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  <span style={{ fontSize: 14, color: '#374151' }}>
                    {t('aiInterviewTemplates.modal.setAsDefault', 'Varsayılan Yap')}
                  </span>
                </label>
              </div>
            </div>

            {/* Variables */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                {t('aiInterviewTemplates.modal.variables', 'Değişkenler')}
                <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 8 }}>
                  {t('aiInterviewTemplates.modal.dragOrClick', 'Sürükle veya tıkla')}
                </span>
              </label>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                padding: 12,
                background: '#F9FAFB',
                borderRadius: 10,
                border: '1px solid #E5E7EB',
              }}>
                {variables.map((variable) => (
                  <button
                    key={variable.key}
                    draggable
                    onDragStart={(e) => handleDragStart(e, variable)}
                    onClick={() => insertVariable(variable, 'body')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: 6,
                      fontSize: 13,
                      color: '#374151',
                      cursor: 'grab',
                      transition: 'all 0.2s',
                    }}
                    title={`{${variable.key}}`}
                  >
                    {getVariableIcon(variable.key)}
                    <span>{isEnglish ? variable.labelEn : variable.labelTr}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                {t('aiInterviewTemplates.modal.subject', 'E-posta Konusu')} *
              </label>
              <input
                ref={subjectRef}
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onDragOver={(e) => handleDragOver(e, 'subject')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'subject')}
                placeholder={t('aiInterviewTemplates.modal.subjectPlaceholder', 'AI Görüşme Daveti - {position}')}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: activeField === 'subject' ? '2px solid #3B82F6' : '1px solid #D1D5DB',
                  borderRadius: 10,
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>

            {/* Body */}
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                {t('aiInterviewTemplates.modal.body', 'E-posta İçeriği')} *
              </label>
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onDragOver={(e) => handleDragOver(e, 'body')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'body')}
                placeholder={t('aiInterviewTemplates.modal.bodyPlaceholder', 'E-posta içeriğini buraya yazın...')}
                style={{
                  width: '100%',
                  minHeight: 250,
                  padding: '12px 14px',
                  border: activeField === 'body' ? '2px solid #3B82F6' : '1px solid #D1D5DB',
                  borderRadius: 10,
                  fontSize: 14,
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: 1.6,
                  transition: 'border-color 0.2s',
                }}
              />
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div style={{
              background: '#F9FAFB',
              borderRadius: 12,
              padding: 20,
              border: '1px solid #E5E7EB',
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', marginBottom: 16 }}>
                {t('aiInterviewTemplates.modal.preview', 'Önizleme')}
              </h3>
              
              <div style={{
                background: 'white',
                borderRadius: 8,
                border: '1px solid #E5E7EB',
                overflow: 'hidden',
              }}>
                {/* Email Header */}
                <div style={{
                  padding: '12px 16px',
                  background: '#F3F4F6',
                  borderBottom: '1px solid #E5E7EB',
                }}>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 4px 0' }}>
                    {t('common.subject', 'Konu')}:
                  </p>
                  <p 
                    style={{ fontSize: 14, fontWeight: 500, color: '#1F2937', margin: 0 }}
                    dangerouslySetInnerHTML={{ __html: renderPreview(subject) }}
                  />
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
                    dangerouslySetInnerHTML={{ __html: renderPreview(body) }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              background: showPreview ? '#DBEAFE' : '#F3F4F6',
              color: showPreview ? '#1D4ED8' : '#6B7280',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Eye size={16} />
            {showPreview 
              ? t('aiInterviewTemplates.modal.hidePreview', 'Önizlemeyi Gizle')
              : t('aiInterviewTemplates.modal.showPreview', 'Önizleme')}
          </button>
          
          <div style={{ display: 'flex', gap: 12 }}>
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
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '10px 24px',
                background: saving ? '#9CA3AF' : '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving 
                ? t('common.saving', 'Kaydediliyor...')
                : t('common.save', 'Kaydet')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddEditAIInterviewTemplateModal;
