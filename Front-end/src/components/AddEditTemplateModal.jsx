/**
 * Add/Edit Agreement Template Modal
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client/react';
import { X, FileText } from 'lucide-react';
import { CREATE_AGREEMENT_TEMPLATE, UPDATE_AGREEMENT_TEMPLATE } from '../graphql/agreementTemplates';

const AddEditTemplateModal = ({ isOpen, onClose, onSuccess, template }) => {
  const { t } = useTranslation();
  const isEdit = !!template;

  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [createTemplate] = useMutation(CREATE_AGREEMENT_TEMPLATE);
  const [updateTemplate] = useMutation(UPDATE_AGREEMENT_TEMPLATE);

  useEffect(() => {
    if (template) {
      setName(template.name || '');
      setContent(template.content || '');
      setIsActive(template.isActive !== false);
    } else {
      setName('');
      setContent('');
      setIsActive(true);
    }
  }, [template]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError(t('agreementTemplates.nameRequired'));
      return;
    }
    if (!content.trim()) {
      setError(t('agreementTemplates.contentRequired'));
      return;
    }

    setSaving(true);
    setError('');

    try {
      const input = {
        name: name.trim(),
        content: content.trim(),
        isActive,
      };

      if (isEdit) {
        await updateTemplate({ variables: { id: template.id, input } });
      } else {
        await createTemplate({ variables: { input } });
      }

      onSuccess?.();
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '90%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <FileText size={20} />
            </div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              {isEdit ? t('agreementTemplates.editTemplate') : t('agreementTemplates.newTemplate')}
            </h2>
          </div>
          <button onClick={onClose} style={{ padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={20} color="#6B7280" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{ padding: '12px', background: '#FEE2E2', color: '#DC2626', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {/* Name */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              {t('agreementTemplates.templateName')} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('agreementTemplates.templateNamePlaceholder')}
              className="text-input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Content */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              {t('agreementTemplates.content')} *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('agreementTemplates.contentPlaceholder')}
              className="text-input"
              style={{ width: '100%', minHeight: '250px', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }}
            />
          </div>

          {/* Active Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#F9FAFB', borderRadius: '12px' }}>
            <div>
              <div style={{ fontWeight: '600', color: '#111827' }}>{t('agreementTemplates.isActive')}</div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>{t('agreementTemplates.isActiveHint')}</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: isActive ? '#10B981' : '#D1D5DB',
                borderRadius: '24px',
                transition: '0.3s',
              }}>
                <span style={{
                  position: 'absolute',
                  height: '18px', width: '18px',
                  left: isActive ? '27px' : '3px',
                  bottom: '3px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.3s',
                }} />
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} className="btn btn-secondary" disabled={saving}>
            {t('common.cancel')}
          </button>
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
            {saving ? t('common.saving') : t('agreementTemplates.save') || t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEditTemplateModal;


