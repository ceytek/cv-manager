/**
 * AI Job Creator Modal
 * Yapay zeka ile otomatik iş ilanı oluşturma arayüzü
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@apollo/client/react';
import { X, Sparkles, Briefcase, MapPin, Clock, GraduationCap, Languages, Tag, Plus, Globe } from 'lucide-react';
import { GENERATE_JOB_WITH_AI_MUTATION } from '../../graphql/jobs';
import { DEPARTMENTS_QUERY } from '../../graphql/departments';
import JobCreationProgressModal from '../JobCreationProgressModal';

const AIJobCreator = ({ isOpen, onClose, onGenerate }) => {
  const { t, i18n } = useTranslation();
  
  // GraphQL Queries and Mutations
  const { data: departmentsData, loading: departmentsLoading } = useQuery(DEPARTMENTS_QUERY, {
    variables: { includeInactive: false }
  });
  const [generateJobMutation, { loading: mutationLoading }] = useMutation(GENERATE_JOB_WITH_AI_MUTATION);
  
  // Form state
  const [formData, setFormData] = useState({
    position: '',
    department: '',
    location: '',
    employmentType: 'full-time',
    experienceLevel: '',
    requiredSkills: [],
    requiredLanguages: [],
    additionalNotes: '',
    jobLanguage: 'turkish' // İlan dili seçimi
  });
  
  const [currentSkill, setCurrentSkill] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState({ name: '', level: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  
  // Progress modal state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressStatus, setProgressStatus] = useState('creating');

  // Predefined options
  const locations = [
    { value: 'ankara', label: 'Ankara' },
    { value: 'istanbul', label: 'İstanbul' },
    { value: 'izmir', label: 'İzmir' }
  ];

  const employmentTypes = [
    { value: 'full-time', label: t('jobForm.fullTime') || 'Tam Zamanlı' },
    { value: 'part-time', label: t('jobForm.partTime') || 'Yarı Zamanlı' },
    { value: 'contract', label: t('jobForm.contract') || 'Sözleşmeli' },
    { value: 'internship', label: t('jobForm.intern') || 'Stajyer' }
  ];

  const experienceLevels = [
    { value: 'entry', label: t('jobForm.entryLevel') || 'Giriş Seviyesi' },
    { value: 'junior', label: t('jobForm.junior') || 'Junior (0-2 yıl)' },
    { value: 'mid', label: t('jobForm.mid') || 'Mid-Level (2-5 yıl)' },
    { value: 'senior', label: t('jobForm.senior') || 'Senior (5+ yıl)' },
    { value: 'lead', label: t('jobForm.lead') || 'Lead/Manager' }
  ];

  const languageLevels = [
    { value: 'A1', label: 'A1 - Başlangıç' },
    { value: 'A2', label: 'A2 - Temel' },
    { value: 'B1', label: 'B1 - Orta Seviye' },
    { value: 'B2', label: 'B2 - Orta-İleri Seviye' },
    { value: 'C1', label: 'C1 - İleri Seviye' },
    { value: 'C2', label: 'C2 - Ana Dil Seviyesi' },
    { value: 'Native', label: 'Ana Dil' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSkill = () => {
    if (currentSkill.trim() && !formData.requiredSkills.includes(currentSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, currentSkill.trim()]
      }));
      setCurrentSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleAddLanguage = () => {
    if (currentLanguage.name.trim() && currentLanguage.level) {
      const languageExists = formData.requiredLanguages.some(
        lang => lang.name.toLowerCase() === currentLanguage.name.trim().toLowerCase()
      );
      
      if (!languageExists) {
        setFormData(prev => ({
          ...prev,
          requiredLanguages: [...prev.requiredLanguages, {
            name: currentLanguage.name.trim(),
            level: currentLanguage.level
          }]
        }));
        setCurrentLanguage({ name: '', level: '' });
      }
    }
  };

  const handleRemoveLanguage = (languageToRemove) => {
    setFormData(prev => ({
      ...prev,
      requiredLanguages: prev.requiredLanguages.filter(lang => lang.name !== languageToRemove.name)
    }));
  };

  const handleGenerate = async () => {
    // Validation
    if (!formData.position.trim()) {
      setError(t('aiJobCreator.errorPosition'));
      return;
    }
    if (!formData.location) {
      setError(t('aiJobCreator.errorLocation'));
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    // Show progress modal
    setShowProgressModal(true);
    setProgressStatus('creating');
    
    try {
      // Call GraphQL mutation
      const { data } = await generateJobMutation({
        variables: {
          input: {
            position: formData.position.trim(),
            department: formData.department.trim() || null,
            location: formData.location,
            employmentType: formData.employmentType,
            experienceLevel: formData.experienceLevel || null,
            requiredSkills: formData.requiredSkills,
            requiredLanguages: formData.requiredLanguages.map(lang => ({
              name: lang.name,
              level: lang.level
            })),
            additionalNotes: formData.additionalNotes.trim() || null,
            language: formData.jobLanguage // Kullanıcının seçtiği ilan dili
          }
        }
      });

      if (data?.generateJobWithAi?.success) {
        // Show success status
        setProgressStatus('success');
        
        // Parse job data from JSON string
        const jobData = JSON.parse(data.generateJobWithAi.jobData);
        
        // Wait 2 seconds before closing
        setTimeout(() => {
          setShowProgressModal(false);
          
          // Pass to parent component
          onGenerate({
            ...jobData,
            location: formData.location,
            employmentType: formData.employmentType,
            experienceLevel: formData.experienceLevel,
            department: formData.department
          });
          
          handleClose();
        }, 2000);
      } else {
        setProgressStatus('error');
        setError(data?.generateJobWithAi?.message || t('aiJobCreator.errorGeneral'));
        
        // Close modal after 3 seconds
        setTimeout(() => {
          setShowProgressModal(false);
        }, 3000);
      }
    } catch (err) {
      console.error('AI generation error:', err);
      setProgressStatus('error');
      setError(err.message || t('aiJobCreator.errorGeneral'));
      
      // Close modal after 3 seconds
      setTimeout(() => {
        setShowProgressModal(false);
      }, 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setFormData({
      position: '',
      department: '',
      location: '',
      employmentType: 'full-time',
      experienceLevel: '',
      requiredSkills: [],
      requiredLanguages: [],
      additionalNotes: '',
      jobLanguage: 'turkish'
    });
    setCurrentSkill('');
    setCurrentLanguage({ name: '', level: '' });
    onClose();
  };

  if (!isOpen) return null;

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
      padding: 20
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        width: '100%',
        maxWidth: 900,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={24} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1F2937', margin: 0 }}>
                {t('aiJobCreator.title')}
              </h2>
              <p style={{ fontSize: 14, color: '#6B7280', margin: '4px 0 0 0' }}>
                {t('aiJobCreator.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              background: '#F3F4F6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} color="#6B7280" />
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 32
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24
          }}>
            {/* Job Language */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 8
              }}>
                <Globe size={16} style={{ display: 'inline', marginRight: 6 }} />
                {t('aiJobCreator.jobLanguage')} *
              </label>
              <select
                value={formData.jobLanguage}
                onChange={(e) => handleInputChange('jobLanguage', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #E5E7EB',
                  borderRadius: 10,
                  fontSize: 14,
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  background: 'white'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              >
                <option value="turkish">🇹🇷 Türkçe</option>
                <option value="english">🇬🇧 English</option>
              </select>
              <p style={{ 
                fontSize: 12, 
                color: '#6B7280', 
                margin: '6px 0 0 0',
                fontStyle: 'italic'
              }}>
                {t('aiJobCreator.jobLanguageNote')}
              </p>
            </div>

            {/* Position Name */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 8
              }}>
                <Briefcase size={16} style={{ display: 'inline', marginRight: 6 }} />
                {t('aiJobCreator.positionName')} *
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                placeholder={t('aiJobCreator.positionPlaceholder')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #E5E7EB',
                  borderRadius: 10,
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            {/* Department */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 8
              }}>
                {t('aiJobCreator.department')}
              </label>
              <select
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                disabled={departmentsLoading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #E5E7EB',
                  borderRadius: 10,
                  fontSize: 14,
                  outline: 'none',
                  cursor: departmentsLoading ? 'wait' : 'pointer',
                  transition: 'border-color 0.2s',
                  background: 'white'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              >
                <option value="">{t('aiJobCreator.departmentSelect')}</option>
                {departmentsData?.departments?.map(dept => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 8
              }}>
                <MapPin size={16} style={{ display: 'inline', marginRight: 6 }} />
                {t('aiJobCreator.location')} *
              </label>
              <select
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #E5E7EB',
                  borderRadius: 10,
                  fontSize: 14,
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  background: 'white'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              >
                <option value="">{t('aiJobCreator.locationPlaceholder')}</option>
                {locations.map(loc => (
                  <option key={loc.value} value={loc.value}>{loc.label}</option>
                ))}
              </select>
            </div>

            {/* Employment Type */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 8
              }}>
                <Clock size={16} style={{ display: 'inline', marginRight: 6 }} />
                {t('aiJobCreator.employmentType')}
              </label>
              <select
                value={formData.employmentType}
                onChange={(e) => handleInputChange('employmentType', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #E5E7EB',
                  borderRadius: 10,
                  fontSize: 14,
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  background: 'white'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              >
                <option value="full-time">{t('aiJobCreator.fullTime')}</option>
                <option value="part-time">{t('aiJobCreator.partTime')}</option>
                <option value="contract">{t('aiJobCreator.contract')}</option>
                <option value="internship">{t('aiJobCreator.internship')}</option>
              </select>
            </div>

            {/* Experience Level */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 8
              }}>
                <GraduationCap size={16} style={{ display: 'inline', marginRight: 6 }} />
                {t('aiJobCreator.experienceLevel')}
              </label>
              <select
                value={formData.experienceLevel}
                onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #E5E7EB',
                  borderRadius: 10,
                  fontSize: 14,
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  background: 'white'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              >
                <option value="">{t('aiJobCreator.selectExperience')}</option>
                <option value="junior">{t('aiJobCreator.junior')}</option>
                <option value="mid">{t('aiJobCreator.midLevel')}</option>
                <option value="senior">{t('aiJobCreator.senior')}</option>
              </select>
            </div>

            {/* Required Skills */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 8
              }}>
                <Tag size={16} style={{ display: 'inline', marginRight: 6 }} />
                {t('aiJobCreator.requiredSkills')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('aiJobCreator.skillsPlaceholder')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #E5E7EB',
                    borderRadius: 10,
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                />
              </div>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                {t('aiJobCreator.skillsNote')}
              </p>
              
              {/* Skills Tags */}
              {formData.requiredSkills.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginTop: 12
                }}>
                  {formData.requiredSkills.map((skill, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        background: '#EEF2FF',
                        color: '#667eea',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 500
                      }}
                    >
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <X size={14} color="#667eea" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Required Languages */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 8
              }}>
                <Languages size={16} style={{ display: 'inline', marginRight: 6 }} />
                {t('aiJobCreator.requiredLanguages')}
              </label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr auto',
                gap: 12,
                alignItems: 'end'
              }}>
                <div>
                  <input
                    type="text"
                    value={currentLanguage.name}
                    onChange={(e) => setCurrentLanguage(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t('aiJobCreator.languageNamePlaceholder')}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #E5E7EB',
                      borderRadius: 10,
                      fontSize: 14,
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                  />
                </div>
                <div>
                  <select
                    value={currentLanguage.level}
                    onChange={(e) => setCurrentLanguage(prev => ({ ...prev, level: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #E5E7EB',
                      borderRadius: 10,
                      fontSize: 14,
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                      background: 'white'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                  >
                    <option value="">{t('aiJobCreator.languageLevel')}</option>
                    {languageLevels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAddLanguage}
                  disabled={!currentLanguage.name.trim() || !currentLanguage.level}
                  style={{
                    padding: '12px 16px',
                    border: 'none',
                    borderRadius: 10,
                    background: currentLanguage.name.trim() && currentLanguage.level ? '#667eea' : '#D1D5DB',
                    color: 'white',
                    cursor: currentLanguage.name.trim() && currentLanguage.level ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  <Plus size={16} />
                  {t('aiJobCreator.addLanguage')}
                </button>
              </div>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                Dil adı ve seviyesini girerek ekleyin.
              </p>
              
              {/* Language Tags */}
              {formData.requiredLanguages.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginTop: 12
                }}>
                  {formData.requiredLanguages.map((lang, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        background: '#F0F9FF',
                        color: '#0369A1',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 500
                      }}
                    >
                      {lang.name} ({lang.level})
                      <button
                        onClick={() => handleRemoveLanguage(lang)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <X size={14} color="#0369A1" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Notes */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 8
              }}>
                {t('aiJobCreator.additionalNotes')}
              </label>
              <textarea
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                placeholder={t('aiJobCreator.notesPlaceholder')}
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #E5E7EB',
                  borderRadius: 10,
                  fontSize: 14,
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                {t('aiJobCreator.notesNote')}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '16px 32px',
            background: '#FEE2E2',
            borderTop: '1px solid #FCA5A5'
          }}>
            <div style={{ color: '#DC2626', fontSize: 14, fontWeight: 500 }}>
              ❌ {error}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '20px 32px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          gap: 12,
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleClose}
            disabled={isGenerating}
            style={{
              padding: '12px 24px',
              border: '2px solid #E5E7EB',
              borderRadius: 10,
              background: 'white',
              color: '#374151',
              fontSize: 14,
              fontWeight: 600,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              opacity: isGenerating ? 0.5 : 1
            }}
          >
            {t('aiJobCreator.cancel')}
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !formData.position.trim() || !formData.location}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: 10,
              background: isGenerating || !formData.position.trim() || !formData.location
                ? '#D1D5DB'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: isGenerating || !formData.position.trim() || !formData.location ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            {isGenerating ? (
              <>
                <div style={{
                  width: 16,
                  height: 16,
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite'
                }} />
                {t('aiJobCreator.generating')}
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {t('aiJobCreator.createAndSave')}
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Progress Modal */}
      <JobCreationProgressModal
        isOpen={showProgressModal}
        status={progressStatus}
        jobTitle={formData.position}
        onClose={() => setShowProgressModal(false)}
      />
    </div>
  );
};

export default AIJobCreator;
