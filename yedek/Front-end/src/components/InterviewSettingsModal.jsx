/**
 * Interview Settings Modal
 * Configure interview settings for a job using templates
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@apollo/client/react';
import { X, Video, Clock, FileText, Globe } from 'lucide-react';
import { GET_INTERVIEW_TEMPLATES } from '../graphql/interviewTemplates';
import { AGREEMENT_TEMPLATES_QUERY } from '../graphql/agreementTemplates';
import { UPDATE_JOB_INTERVIEW_SETTINGS } from '../graphql/jobs';

const InterviewSettingsModal = ({ isOpen, onClose, job, onSuccess }) => {
  const { t } = useTranslation();
  
  // Local state - initialize from job prop
  const [interviewEnabled, setInterviewEnabled] = useState(false);
  const [interviewTemplateId, setInterviewTemplateId] = useState('');
  const [interviewDeadlineHours, setInterviewDeadlineHours] = useState(72);
  const [agreementTemplateId, setAgreementTemplateId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch templates
  const { data: interviewTemplatesData } = useQuery(GET_INTERVIEW_TEMPLATES, {
    fetchPolicy: 'cache-and-network',
    skip: !isOpen,
  });
  
  const { data: agreementTemplatesData } = useQuery(AGREEMENT_TEMPLATES_QUERY, {
    fetchPolicy: 'cache-and-network',
    skip: !isOpen,
  });

  const [updateJob] = useMutation(UPDATE_JOB_INTERVIEW_SETTINGS);

  const interviewTemplates = interviewTemplatesData?.interviewTemplates?.filter(t => t.isActive) || [];
  const agreementTemplates = agreementTemplatesData?.agreementTemplates?.filter(t => t.isActive) || [];
  
  const selectedTemplate = interviewTemplates.find(t => t.id === interviewTemplateId);

  // Initialize state from job prop when modal opens
  useEffect(() => {
    if (isOpen && job) {
      console.log('InterviewSettingsModal: Initializing from job prop:', {
        interviewEnabled: job.interviewEnabled,
        interviewTemplateId: job.interviewTemplateId,
      });
      setInterviewEnabled(job.interviewEnabled === true);
      setInterviewTemplateId(job.interviewTemplateId || '');
      setInterviewDeadlineHours(job.interviewDeadlineHours || 72);
      setAgreementTemplateId(job.agreementTemplateId || '');
    }
  }, [isOpen, job]);

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const input = {
        interviewEnabled,
        interviewTemplateId: interviewEnabled && interviewTemplateId ? interviewTemplateId : null,
        interviewDeadlineHours: parseInt(interviewDeadlineHours) || 72,
        agreementTemplateId: interviewEnabled && agreementTemplateId ? agreementTemplateId : null,
      };

      console.log('Saving interview settings:', input);
      const result = await updateJob({
        variables: { id: job.id, input },
      });
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

  const formatDuration = (seconds) => {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      return `${mins} dk`;
    }
    return `${seconds} sn`;
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}>
              <Video size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                {t('interviewSettings.title')}
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
                {job?.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '8px',
            }}
          >
            <X size={20} color="#6B7280" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{
              padding: '12px',
              background: '#FEE2E2',
              color: '#DC2626',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          {/* Enable Interview Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: '#F9FAFB',
            borderRadius: '12px',
            marginBottom: '20px',
          }}>
            <div>
              <div style={{ fontWeight: '600', color: '#111827' }}>
                {t('interviewSettings.enableInterview')}
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>
                {t('interviewSettings.enableInterviewDesc')}
              </div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
              <input
                type="checkbox"
                checked={interviewEnabled}
                onChange={(e) => setInterviewEnabled(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: interviewEnabled ? '#3B82F6' : '#D1D5DB',
                borderRadius: '24px',
                transition: '0.3s',
              }}>
                <span style={{
                  position: 'absolute',
                  height: '18px',
                  width: '18px',
                  left: interviewEnabled ? '27px' : '3px',
                  bottom: '3px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.3s',
                }} />
              </span>
            </label>
          </div>

          {interviewEnabled && (
            <>
              {/* Interview Template Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                  {t('interviewSettings.selectTemplate')} *
                </label>
                <select
                  value={interviewTemplateId}
                  onChange={(e) => setInterviewTemplateId(e.target.value)}
                  className="text-input"
                  style={{ width: '100%' }}
                >
                  <option value="">{t('interviewSettings.selectTemplatePlaceholder')}</option>
                  {interviewTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.questionCount} soru)
                    </option>
                  ))}
                </select>
              </div>

              {/* Template Preview */}
              {selectedTemplate && (
                <div style={{
                  padding: '16px',
                  background: '#EFF6FF',
                  borderRadius: '12px',
                  marginBottom: '20px',
                }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#1D4ED8' }}>
                    {t('interviewSettings.templatePreview')}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <FileText size={14} color="#3B82F6" />
                      <span>{selectedTemplate.questionCount} {t('interviewSettings.questions')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <Clock size={14} color="#3B82F6" />
                      <span>{formatDuration(selectedTemplate.durationPerQuestion)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <Globe size={14} color="#3B82F6" />
                      <span>{selectedTemplate.language === 'en' ? '🇬🇧 English' : '🇹🇷 Türkçe'}</span>
                    </div>
                  </div>
                  {selectedTemplate.description && (
                    <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#374151' }}>
                      {selectedTemplate.description}
                    </p>
                  )}
                </div>
              )}

              {/* Deadline Hours */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                  {t('interviewSettings.deadlineHours')}
                </label>
                <select
                  value={interviewDeadlineHours}
                  onChange={(e) => setInterviewDeadlineHours(e.target.value)}
                  className="text-input"
                  style={{ width: '100%' }}
                >
                  <option value="24">24 {t('interviewSettings.hours')}</option>
                  <option value="48">48 {t('interviewSettings.hours')}</option>
                  <option value="72">72 {t('interviewSettings.hours')}</option>
                  <option value="168">7 {t('interviewSettings.days')}</option>
                </select>
              </div>

              {/* Agreement Template Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                  {t('interviewSettings.agreementTemplate')}
                </label>
                <select
                  value={agreementTemplateId}
                  onChange={(e) => setAgreementTemplateId(e.target.value)}
                  className="text-input"
                  style={{ width: '100%' }}
                >
                  <option value="">{t('interviewSettings.noAgreement')}</option>
                  {agreementTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6B7280' }}>
                  {t('interviewSettings.agreementHint')}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            disabled={saving}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={saving || (interviewEnabled && !interviewTemplateId)}
          >
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewSettingsModal;
