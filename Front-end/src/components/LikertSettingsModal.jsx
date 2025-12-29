/**
 * Likert Settings Modal
 * Configure likert test settings for a job using templates
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@apollo/client/react';
import { X, ListChecks, Globe } from 'lucide-react';
import { GET_LIKERT_TEMPLATES } from '../graphql/likert';
import { UPDATE_JOB_INTERVIEW_SETTINGS } from '../graphql/jobs';

const LikertSettingsModal = ({ isOpen, onClose, job, onSuccess }) => {
  const { t } = useTranslation();
  
  // Local state - initialize from job prop
  const [likertEnabled, setLikertEnabled] = useState(false);
  const [likertTemplateId, setLikertTemplateId] = useState('');
  const [likertDeadlineHours, setLikertDeadlineHours] = useState(72);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: templatesData } = useQuery(GET_LIKERT_TEMPLATES, { 
    fetchPolicy: 'cache-and-network',
    skip: !isOpen,
  });
  const [updateJob] = useMutation(UPDATE_JOB_INTERVIEW_SETTINGS);

  const templates = templatesData?.likertTemplates?.filter(t => t.isActive) || [];
  const selectedTemplate = templates.find(t => t.id === likertTemplateId);

  // Initialize state from job prop when modal opens
  useEffect(() => {
    if (isOpen && job) {
      console.log('LikertSettingsModal: Initializing from job prop:', {
        likertEnabled: job.likertEnabled,
        likertTemplateId: job.likertTemplateId,
      });
      setLikertEnabled(job.likertEnabled === true);
      setLikertTemplateId(job.likertTemplateId || '');
      setLikertDeadlineHours(job.likertDeadlineHours || 72);
    }
  }, [isOpen, job]);

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const input = {
        likertEnabled,
        likertTemplateId: likertEnabled && likertTemplateId ? likertTemplateId : null,
        likertDeadlineHours: parseInt(likertDeadlineHours) || 72,
      };

      console.log('Saving likert settings:', input);
      const result = await updateJob({ variables: { id: job.id, input } });
      console.log('Save result:', result.data?.updateJob);
      
      if (result.data?.updateJob) {
        onSuccess?.();
        onClose();
      }
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
      <div style={{ background: 'white', borderRadius: '16px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <ListChecks size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Likert Test Ayarları</h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>{job?.title}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '8px' }}>
            <X size={20} color="#6B7280" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {error && <div style={{ padding: '12px', background: '#FEE2E2', color: '#DC2626', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

          {/* Enable Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#F9FAFB', borderRadius: '12px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontWeight: '600', color: '#111827' }}>Likert Testi Aktif Et</div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>Adaylara Likert testi gönderilmesini sağlar</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
              <input type="checkbox" checked={likertEnabled} onChange={(e) => setLikertEnabled(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: likertEnabled ? '#8B5CF6' : '#D1D5DB', borderRadius: '24px', transition: '0.3s' }}>
                <span style={{ position: 'absolute', height: '18px', width: '18px', left: likertEnabled ? '27px' : '3px', bottom: '3px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s' }} />
              </span>
            </label>
          </div>

          {likertEnabled && (
            <>
              {/* Template Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Likert Test Şablonu *</label>
                <select value={likertTemplateId} onChange={(e) => setLikertTemplateId(e.target.value)} className="text-input" style={{ width: '100%' }}>
                  <option value="">Bir şablon seçin...</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.questionCount} ifade)</option>
                  ))}
                </select>
              </div>

              {/* Template Preview */}
              {selectedTemplate && (
                <div style={{ padding: '16px', background: '#F3E8FF', borderRadius: '12px', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#6D28D9' }}>Şablon Önizleme</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <ListChecks size={14} color="#8B5CF6" />
                      <span>{selectedTemplate.questionCount} ifade</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <Globe size={14} color="#8B5CF6" />
                      <span>{selectedTemplate.language === 'en' ? '🇬🇧 English' : '🇹🇷 Türkçe'}</span>
                    </div>
                  </div>
                  {selectedTemplate.description && (
                    <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#374151' }}>{selectedTemplate.description}</p>
                  )}
                </div>
              )}

              {/* Deadline Hours */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Test Süresi</label>
                <select value={likertDeadlineHours} onChange={(e) => setLikertDeadlineHours(e.target.value)} className="text-input" style={{ width: '100%' }}>
                  <option value="24">24 saat</option>
                  <option value="48">48 saat</option>
                  <option value="72">72 saat</option>
                  <option value="168">7 gün</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} className="btn btn-secondary" disabled={saving}>{t('common.cancel')}</button>
          <button onClick={handleSave} className="btn btn-primary" disabled={saving || (likertEnabled && !likertTemplateId)}>{saving ? t('common.saving') : t('common.save')}</button>
        </div>
      </div>
    </div>
  );
};

export default LikertSettingsModal;
