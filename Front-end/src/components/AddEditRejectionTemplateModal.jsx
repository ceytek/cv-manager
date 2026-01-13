/**
 * Add/Edit Rejection Template Modal
 * Supports drag-and-drop variables for dynamic content
 */
import React, { useState, useRef } from 'react';
import { useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { X, GripVertical, User, Phone, Briefcase, Mail, Building2, Image } from 'lucide-react';
import { 
  CREATE_REJECTION_TEMPLATE, 
  UPDATE_REJECTION_TEMPLATE 
} from '../graphql/rejectionTemplates';

const AddEditRejectionTemplateModal = ({ template, onClose, variables }) => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  const isEdit = !!template;
  
  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');
  const [language, setLanguage] = useState(template?.language || 'TR');
  const [isActive, setIsActive] = useState(template?.isActive ?? true);
  const [isDefault, setIsDefault] = useState(template?.isDefault ?? false);
  const [saving, setSaving] = useState(false);
  const [draggedVar, setDraggedVar] = useState(null);
  
  const subjectRef = useRef(null);
  const bodyRef = useRef(null);
  const [activeField, setActiveField] = useState(null); // 'subject' or 'body'

  const [createTemplate] = useMutation(CREATE_REJECTION_TEMPLATE);
  const [updateTemplate] = useMutation(UPDATE_REJECTION_TEMPLATE);

  // Variable icons
  const getVariableIcon = (key) => {
    switch(key) {
      case 'ad':
      case 'soyad':
        return <User size={14} />;
      case 'telefon':
        return <Phone size={14} />;
      case 'ilan_adi':
        return <Briefcase size={14} />;
      case 'sirket_adi':
        return <Building2 size={14} />;
      case 'sirket_logo':
        return <Image size={14} />;
      default:
        return <Mail size={14} />;
    }
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
      // Focus and set cursor position
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + varText.length, start + varText.length);
      }, 0);
    } else if (field === 'body') {
      const textarea = bodyRef.current;
      const start = textarea.selectionStart || body.length;
      const newValue = body.slice(0, start) + varText + body.slice(start);
      setBody(newValue);
      // Focus and set cursor position
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
      preview = preview.replace(new RegExp(`\\{${v.key}\\}`, 'g'), `<strong style="color:#2563EB">${v.example}</strong>`);
    });
    return preview;
  };

  return (
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
        maxWidth: 900,
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
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1F2937' }}>
            {isEdit ? t('rejectionTemplates.modal.editTitle') : t('rejectionTemplates.modal.createTitle')}
          </h2>
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
          gridTemplateColumns: '220px 1fr',
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
              <GripVertical size={16} />
              {t('rejectionTemplates.modal.dragDropVariables')}
            </h3>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>
              {t('rejectionTemplates.modal.dragDropHint')}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {variables.map(v => (
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
                    e.currentTarget.style.background = '#EFF6FF';
                    e.currentTarget.style.borderColor = '#3B82F6';
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
                    background: '#DBEAFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563EB',
                  }}>
                    {getVariableIcon(v.key)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1F2937' }}>
                      {v.label}
                    </div>
                    <code style={{ fontSize: 11, color: '#6B7280' }}>
                      {`{${v.key}}`}
                    </code>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Insert Buttons */}
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 8 }}>{t('rejectionTemplates.modal.quickAdd')}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {variables.map(v => (
                  <button
                    key={v.key}
                    onClick={() => insertVariable(v, 'body')}
                    style={{
                      padding: '4px 8px',
                      background: '#E0E7FF',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: 11,
                      color: '#4338CA',
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
                {t('rejectionTemplates.modal.templateName')} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('rejectionTemplates.modal.templateNamePlaceholder')}
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
                  {t('rejectionTemplates.modal.language')}
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
                  {t('rejectionTemplates.modal.active')}
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
                  {t('rejectionTemplates.modal.default')}
                </label>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                {t('rejectionTemplates.modal.emailSubject')} *
              </label>
              <input
                ref={subjectRef}
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onDragOver={(e) => handleDragOver(e, 'subject')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'subject')}
                placeholder={t('rejectionTemplates.modal.emailSubjectPlaceholder')}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `2px solid ${activeField === 'subject' ? '#3B82F6' : '#D1D5DB'}`,
                  borderRadius: 8,
                  fontSize: 14,
                  transition: 'border-color 0.2s',
                }}
              />
            </div>

            {/* Body */}
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                {t('rejectionTemplates.modal.emailBody')} *
              </label>
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onDragOver={(e) => handleDragOver(e, 'body')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'body')}
                placeholder={isEnglish 
                  ? `Dear {ad} {soyad},

We have carefully reviewed your application for the {ilan_adi} position.

Thank you for your interest. We hope to work with you in the future.

Best regards`
                  : `Sayın {ad} {soyad},

{ilan_adi} pozisyonu için yaptığınız başvuruyu dikkatli bir şekilde değerlendirdik.

Başvurunuz için teşekkür eder, gelecekte sizinle çalışma fırsatı bulmayı umut ederiz.

Saygılarımızla`}
                style={{
                  width: '100%',
                  minHeight: 200,
                  padding: '12px 14px',
                  border: `2px solid ${activeField === 'body' ? '#3B82F6' : '#D1D5DB'}`,
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
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                padding: 16,
              }}>
                <h4 style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' }}>
                  {t('rejectionTemplates.modal.preview')}
                </h4>
                <div 
                  style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}
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
            {t('common.cancel')}
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
            {saving ? t('rejectionTemplates.modal.saving') : isEdit ? t('rejectionTemplates.modal.update') : t('rejectionTemplates.modal.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEditRejectionTemplateModal;
