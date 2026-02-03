/**
 * Add/Edit Likert Test Template Modal
 * Supports drag-and-drop variables for dynamic content
 */
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { X, GripVertical, User, Briefcase, Building2, Link2, Calendar, ClipboardList } from 'lucide-react';
import { 
  CREATE_LIKERT_TEMPLATE, 
  UPDATE_LIKERT_TEMPLATE,
  GET_LIKERT_TEMPLATE_VARIABLES,
  DEFAULT_LIKERT_TEMPLATE,
} from '../graphql/likertTemplate';

const AddEditLikertTemplateModal = ({ template, onClose }) => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  const isEdit = !!template;
  
  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');
  const [isActive, setIsActive] = useState(template?.isActive ?? true);
  const [isDefault, setIsDefault] = useState(template?.isDefault ?? false);
  const [saving, setSaving] = useState(false);
  const [draggedVar, setDraggedVar] = useState(null);
  
  const subjectRef = useRef(null);
  const bodyRef = useRef(null);
  const [activeField, setActiveField] = useState(null);

  // Fetch available variables
  const { data: variablesData } = useQuery(GET_LIKERT_TEMPLATE_VARIABLES);
  const variables = variablesData?.likertEmailTemplateVariables?.variables || [];

  const [createTemplate] = useMutation(CREATE_LIKERT_TEMPLATE);
  const [updateTemplate] = useMutation(UPDATE_LIKERT_TEMPLATE);

  // Set default content when creating new template
  useEffect(() => {
    if (!isEdit && !subject && !body) {
      if (isEnglish) {
        setSubject(DEFAULT_LIKERT_TEMPLATE.subject_en);
        setBody(DEFAULT_LIKERT_TEMPLATE.body_en);
      } else {
        setSubject(DEFAULT_LIKERT_TEMPLATE.subject_tr);
        setBody(DEFAULT_LIKERT_TEMPLATE.body_tr);
      }
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
      case 'test_link':
        return <Link2 size={14} />;
      case 'expiry_date':
        return <Calendar size={14} />;
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
      test_link: 'https://hrsmart.app/likert/abc123',
      expiry_date: isEnglish ? 'February 1, 2026' : '1 Şubat 2026',
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
    setActiveField(null);
    
    const variableText = e.dataTransfer.getData('text/plain');
    
    if (field === 'subject') {
      const input = subjectRef.current;
      const start = input.selectionStart || subject.length;
      const newValue = subject.slice(0, start) + variableText + subject.slice(start);
      setSubject(newValue);
    } else if (field === 'body') {
      const textarea = bodyRef.current;
      const start = textarea.selectionStart || body.length;
      const newValue = body.slice(0, start) + variableText + body.slice(start);
      setBody(newValue);
    }
    
    setDraggedVar(null);
  };

  // Insert variable at cursor
  const insertVariable = (variable, field) => {
    const variableText = `{${variable.key}}`;
    
    if (field === 'subject') {
      const input = subjectRef.current;
      const start = input.selectionStart || subject.length;
      const newValue = subject.slice(0, start) + variableText + subject.slice(start);
      setSubject(newValue);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + variableText.length, start + variableText.length);
      }, 0);
    } else {
      const textarea = bodyRef.current;
      const start = textarea.selectionStart || body.length;
      const newValue = body.slice(0, start) + variableText + body.slice(start);
      setBody(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variableText.length, start + variableText.length);
      }, 0);
    }
  };

  // Get preview content with replaced variables
  const getPreview = (content) => {
    let preview = content;
    variables.forEach(v => {
      const regex = new RegExp(`\\{${v.key}\\}`, 'g');
      preview = preview.replace(regex, getSampleValue(v.key));
    });
    return preview;
  };

  const handleSave = async () => {
    if (!name.trim() || !subject.trim() || !body.trim()) {
      alert(isEnglish 
        ? 'Please fill in all required fields' 
        : 'Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    setSaving(true);
    try {
      const input = {
        name: name.trim(),
        subject: subject.trim(),
        body: body.trim(),
        language: isEnglish ? 'EN' : 'TR',
        isActive,
        isDefault,
      };

      if (isEdit) {
        await updateTemplate({
          variables: { id: template.id, input }
        });
      } else {
        await createTemplate({
          variables: { input }
        });
      }
      onClose();
    } catch (error) {
      alert((isEnglish ? 'Error: ' : 'Hata: ') + error.message);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        width: '100%',
        maxWidth: 900,
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'white' }}>
            <ClipboardList size={24} />
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
              {isEdit 
                ? t('likertEmailTemplates.editTemplate', 'Şablonu Düzenle')
                : t('likertEmailTemplates.newTemplate', 'Yeni Şablon')}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: 8,
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <X size={20} color="white" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
            {/* Left - Form */}
            <div>
              {/* Template Name */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: '#374151',
                  marginBottom: 6 
                }}>
                  {t('likertEmailTemplates.templateName', 'Şablon Adı')} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isEnglish ? 'e.g. Default Likert Invitation' : 'örn. Varsayılan Likert Daveti'}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Subject */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: '#374151',
                  marginBottom: 6 
                }}>
                  {t('likertEmailTemplates.emailSubject', 'E-posta Konusu')} *
                </label>
                <input
                  ref={subjectRef}
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  onDragOver={(e) => handleDragOver(e, 'subject')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'subject')}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: `2px solid ${activeField === 'subject' ? '#F59E0B' : '#D1D5DB'}`,
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                />
              </div>

              {/* Body */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: '#374151',
                  marginBottom: 6 
                }}>
                  {t('likertEmailTemplates.emailBody', 'E-posta İçeriği')} *
                </label>
                <textarea
                  ref={bodyRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onDragOver={(e) => handleDragOver(e, 'body')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'body')}
                  rows={12}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: `2px solid ${activeField === 'body' ? '#F59E0B' : '#D1D5DB'}`,
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                  }}
                />
              </div>

              {/* Options */}
              <div style={{ display: 'flex', gap: 24 }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8,
                  cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ width: 18, height: 18 }}
                  />
                  <span style={{ fontSize: 14, color: '#374151' }}>
                    {t('common.active', 'Aktif')}
                  </span>
                </label>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8,
                  cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    style={{ width: 18, height: 18 }}
                  />
                  <span style={{ fontSize: 14, color: '#374151' }}>
                    {t('likertEmailTemplates.setAsDefault', 'Varsayılan Şablon')}
                  </span>
                </label>
              </div>
            </div>

            {/* Right - Variables */}
            <div>
              <div style={{
                background: '#FFFBEB',
                borderRadius: 12,
                padding: 16,
                border: '1px solid #FDE68A',
              }}>
                <h4 style={{ 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: '#92400E',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <GripVertical size={16} />
                  {t('likertEmailTemplates.availableVariables', 'Kullanılabilir Değişkenler')}
                </h4>
                <p style={{ fontSize: 12, color: '#B45309', marginBottom: 12 }}>
                  {t('likertEmailTemplates.dragVariables', 'Değişkenleri sürükleyip bırakın veya tıklayın')}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {variables.map((v) => (
                    <div
                      key={v.key}
                      draggable
                      onDragStart={(e) => handleDragStart(e, v)}
                      onClick={() => insertVariable(v, 'body')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        background: 'white',
                        borderRadius: 6,
                        fontSize: 13,
                        cursor: 'grab',
                        border: '1px solid #FDE68A',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#FEF3C7';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      {getVariableIcon(v.key)}
                      <span style={{ flex: 1 }}>
                        {isEnglish ? v.labelEn : v.labelTr}
                      </span>
                      <code style={{ 
                        fontSize: 11, 
                        color: '#D97706',
                        background: '#FEF3C7',
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}>
                        {`{${v.key}}`}
                      </code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div style={{ marginTop: 16 }}>
                <h4 style={{ 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: '#374151',
                  marginBottom: 8 
                }}>
                  {t('likertEmailTemplates.preview', 'Önizleme')}
                </h4>
                <div style={{
                  background: '#F9FAFB',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 12,
                  color: '#4B5563',
                  maxHeight: 200,
                  overflow: 'auto',
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    {t('common.subject', 'Konu')}: {getPreview(subject)}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {getPreview(body)}
                  </div>
                </div>
              </div>
            </div>
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
            disabled={saving}
            style={{
              padding: '10px 20px',
              background: '#F3F4F6',
              color: '#374151',
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
              background: '#F59E0B',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving 
              ? t('common.saving', 'Kaydediliyor...') 
              : t('common.save', 'Kaydet')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddEditLikertTemplateModal;
