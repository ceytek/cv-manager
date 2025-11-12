/**
 * Job Form Component - Sağ Panel
 * Tüm alanlar: title, dept, description, requirements, keywords, location, 
 * remote_policy, employment_type, experience_level, education, majors, languages, 
 * salary, deadline, status
 */
import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client/react';
import { CREATE_JOB_MUTATION, UPDATE_JOB_MUTATION, JOBS_QUERY } from '../graphql/jobs';
import { useTranslation } from 'react-i18next';

const JobForm = ({ job, departments = [], onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const isEditing = !!job;
  
  const [formData, setFormData] = useState({
    title: '',
    departmentId: '',
    description: '',
    requirements: '',
    keywords: '',
    location: '',
    remotePolicy: 'office',
    employmentType: 'full-time',
    experienceLevel: 'mid',
    requiredEducation: '',
    preferredMajors: '',
    requiredLanguages: '{}',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'TRY',
    deadline: '',
    startDate: 'immediate',
    status: 'draft',
  });

  // Language state - kullanıcı dostu UI için
  const [languages, setLanguages] = useState([]);
  const [newLanguage, setNewLanguage] = useState({ name: '', level: 'basic' });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load job data if editing
  useEffect(() => {
    if (job) {
      // Parse requiredLanguages object into array
      const langObj = job.requiredLanguages || {};
      const langArray = Object.entries(langObj).map(([name, level]) => ({ name, level }));
      
      setFormData({
        title: job.title || '',
        departmentId: job.departmentId || '',
        description: job.description || '',
        requirements: job.requirements || '',
        keywords: (job.keywords || []).join(', '),
        location: job.location || '',
        remotePolicy: job.remotePolicy || 'office',
        employmentType: job.employmentType || 'full-time',
        experienceLevel: job.experienceLevel || 'mid',
        requiredEducation: job.requiredEducation || '',
        preferredMajors: job.preferredMajors || '',
        requiredLanguages: JSON.stringify(langObj),
        salaryMin: job.salaryMin || '',
        salaryMax: job.salaryMax || '',
        salaryCurrency: job.salaryCurrency || 'TRY',
        deadline: job.deadline || '',
        startDate: job.startDate || 'immediate',
        status: job.status || 'draft',
      });
      
      setLanguages(langArray);
    }
  }, [job]);

  const [createJob] = useMutation(CREATE_JOB_MUTATION, {
    refetchQueries: [{ query: JOBS_QUERY, variables: { includeInactive: false } }],
  });

  const [updateJob] = useMutation(UPDATE_JOB_MUTATION, {
    refetchQueries: [{ query: JOBS_QUERY, variables: { includeInactive: false } }],
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Language handlers
  const handleAddLanguage = () => {
    if (!newLanguage.name.trim()) return;
    
    // Check if language already exists
    if (languages.some(l => l.name.toLowerCase() === newLanguage.name.toLowerCase())) {
      setError(t('jobForm.languageAlreadyAdded'));
      setTimeout(() => setError(''), 2000);
      return;
    }
    
    setLanguages([...languages, { name: newLanguage.name.trim(), level: newLanguage.level }]);
    setNewLanguage({ name: '', level: 'basic' });
  };

  const handleRemoveLanguage = (index) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.title || formData.title.length < 3) {
      setError(t('jobForm.errorTitleRequired'));
      return;
    }
    if (!formData.departmentId) {
      setError(t('jobForm.errorDepartmentRequired'));
      return;
    }
    if (!formData.description || formData.description.length < 10) {
      setError(t('jobForm.errorDescriptionRequired'));
      return;
    }
    if (!formData.requirements || formData.requirements.length < 10) {
      setError(t('jobForm.errorRequirementsRequired'));
      return;
    }
    if (!formData.location) {
      setError(t('jobForm.errorLocationRequired'));
      return;
    }

    // Salary validation
    const salaryMin = formData.salaryMin ? parseInt(formData.salaryMin) : null;
    const salaryMax = formData.salaryMax ? parseInt(formData.salaryMax) : null;
    
    if (salaryMin && salaryMax && salaryMin > salaryMax) {
      setError(t('jobForm.errorSalaryRange'));
      return;
    }

    try {
      // Parse keywords and languages
      const keywords = formData.keywords
        ? formData.keywords.split(',').map(k => k.trim()).filter(k => k)
        : [];
      
      // Convert languages array to object: { "English": "business", "German": "basic" }
      const requiredLanguages = languages.reduce((acc, lang) => {
        acc[lang.name] = lang.level;
        return acc;
      }, {});

      const jobData = {
        title: formData.title.trim(),
        departmentId: formData.departmentId,
        description: formData.description.trim(),
        requirements: formData.requirements.trim(),
        keywords,
        location: formData.location.trim(),
        remotePolicy: formData.remotePolicy,
        employmentType: formData.employmentType,
        experienceLevel: formData.experienceLevel,
        requiredEducation: formData.requiredEducation || null,
        preferredMajors: formData.preferredMajors || null,
        requiredLanguages,
        salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : null,
        salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : null,
        salaryCurrency: formData.salaryCurrency,
        deadline: formData.deadline || null,
        startDate: formData.startDate || null,
        status: formData.status,
      };

      if (isEditing) {
        await updateJob({ variables: { id: job.id, input: jobData } });
        setSuccess(t('jobForm.successUpdated'));
      } else {
        await createJob({ variables: { input: jobData } });
        setSuccess(t('jobForm.successCreated'));
      }

      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err) {
      setError(err.message || t('jobForm.errorGeneral'));
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
        {isEditing ? t('jobForm.editJob') : t('jobForm.createJob')}
      </h2>

      {error && <div style={{ padding: 12, background: '#FEE2E2', color: '#991B1B', borderRadius: 8, fontSize: 14 }}>{error}</div>}
      {success && <div style={{ padding: 12, background: '#D1FAE5', color: '#065F46', borderRadius: 8, fontSize: 14 }}>{success}</div>}

      {/* İlan Başlığı */}
      <div>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>{t('jobForm.jobTitle')} *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder={t('jobForm.jobTitlePlaceholder')}
          className="text-input"
          required
        />
      </div>

      {/* Departman */}
      <div>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>{t('jobForm.department')} *</label>
        <select
          value={formData.departmentId}
          onChange={(e) => handleChange('departmentId', e.target.value)}
          className="text-input"
          required
        >
          <option value="">{t('jobForm.departmentPlaceholder')}</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Lokasyon & Çalışma Türü */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>{t('jobForm.location')} *</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder={t('jobForm.locationPlaceholder')}
            className="text-input"
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>{t('jobForm.employmentType')}</label>
          <select value={formData.employmentType} onChange={(e) => handleChange('employmentType', e.target.value)} className="text-input">
            <option value="full-time">{t('jobForm.fullTime')}</option>
            <option value="part-time">{t('jobForm.partTime')}</option>
            <option value="contract">{t('jobForm.contract')}</option>
            <option value="internship">{t('jobForm.internship')}</option>
          </select>
        </div>
      </div>

      {/* Remote Policy & Experience */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>{t('jobForm.remotePolicy')}</label>
          <select value={formData.remotePolicy} onChange={(e) => handleChange('remotePolicy', e.target.value)} className="text-input">
            <option value="office">{t('jobForm.office')}</option>
            <option value="hybrid">{t('jobForm.hybrid')}</option>
            <option value="remote">{t('jobForm.remote')}</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>{t('jobForm.experienceLevel')}</label>
          <select value={formData.experienceLevel} onChange={(e) => handleChange('experienceLevel', e.target.value)} className="text-input">
            <option value="junior">{t('jobForm.junior')}</option>
            <option value="mid">{t('jobForm.mid')}</option>
            <option value="senior">{t('jobForm.senior')}</option>
            <option value="lead">{t('jobForm.lead')}</option>
          </select>
        </div>
      </div>

      {/* İş Tanımı */}
      <div>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>{t('jobForm.description')} *</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder={t('jobForm.descriptionPlaceholder')}
          className="text-input"
          rows={4}
          required
        />
      </div>

      {/* Aranan Nitelikler */}
      <div>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>{t('jobForm.requirements')} *</label>
        <textarea
          value={formData.requirements}
          onChange={(e) => handleChange('requirements', e.target.value)}
          placeholder={t('jobForm.requirementsPlaceholder')}
          className="text-input"
          rows={4}
          required
        />
      </div>

      {/* Anahtar Kelimeler */}
      <div>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>{t('jobForm.keywords')}</label>
        <input
          type="text"
          value={formData.keywords}
          onChange={(e) => handleChange('keywords', e.target.value)}
          placeholder={t('jobForm.keywordsPlaceholder')}
          className="text-input"
        />
      </div>

      {/* Eğitim & Bölümler */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>{t('jobForm.education')}</label>
          <select value={formData.requiredEducation} onChange={(e) => handleChange('requiredEducation', e.target.value)} className="text-input">
            <option value="">{t('jobForm.educationNone')}</option>
            <option value="high_school">{t('jobForm.highSchool')}</option>
            <option value="associate">{t('jobForm.associate')}</option>
            <option value="bachelor">{t('jobForm.bachelor')}</option>
            <option value="master">{t('jobForm.master')}</option>
            <option value="phd">{t('jobForm.phd')}</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>{t('jobForm.preferredMajors')}</label>
          <input
            type="text"
            value={formData.preferredMajors}
            onChange={(e) => handleChange('preferredMajors', e.target.value)}
            placeholder={t('jobForm.preferredMajorsPlaceholder')}
            className="text-input"
          />
        </div>
      </div>

      {/* Dil Gereksinimleri */}
      <div>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>{t('jobForm.languageRequirements')}</label>
        
        {/* Existing Languages */}
        {languages.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {languages.map((lang, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: 20,
                  fontSize: 13,
                }}
              >
                <span style={{ fontWeight: 500 }}>{lang.name}</span>
                <span style={{ color: '#6B7280' }}>•</span>
                <span style={{ color: '#3B82F6' }}>
                  {lang.level === 'basic' && t('jobForm.languageBasic')}
                  {lang.level === 'intermediate' && t('jobForm.languageIntermediate')}
                  {lang.level === 'advanced' && t('jobForm.languageAdvanced')}
                  {lang.level === 'business' && t('jobForm.languageBusiness')}
                  {lang.level === 'native' && t('jobForm.languageNative')}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(index)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#EF4444',
                    cursor: 'pointer',
                    fontSize: 16,
                    padding: 0,
                    marginLeft: 4,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Language */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr auto', gap: 8, alignItems: 'end' }}>
          <div>
            <input
              type="text"
              value={newLanguage.name}
              onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
              placeholder={t('jobForm.languagePlaceholder')}
              className="text-input"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLanguage())}
            />
          </div>
          <div>
            <select
              value={newLanguage.level}
              onChange={(e) => setNewLanguage({ ...newLanguage, level: e.target.value })}
              className="text-input"
            >
              <option value="basic">{t('jobForm.languageBasic')}</option>
              <option value="intermediate">{t('jobForm.languageIntermediate')}</option>
              <option value="advanced">{t('jobForm.languageAdvanced')}</option>
              <option value="business">{t('jobForm.languageBusiness')}</option>
              <option value="native">{t('jobForm.languageNative')}</option>
            </select>
          </div>
          <button
            type="button"
            onClick={handleAddLanguage}
            style={{
              padding: '10px 16px',
              background: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {t('jobForm.addLanguage')}
          </button>
        </div>
      </div>

      {/* Maaş Aralığı */}
      <div>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>{t('jobForm.salaryRange')}</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 12 }}>
          <input 
            type="number" 
            value={formData.salaryMin} 
            onChange={(e) => handleChange('salaryMin', e.target.value)} 
            placeholder={t('jobForm.salaryMin')} 
            className="text-input"
            style={{
              borderColor: formData.salaryMin && formData.salaryMax && parseInt(formData.salaryMin) > parseInt(formData.salaryMax) ? '#EF4444' : undefined
            }}
          />
          <input 
            type="number" 
            value={formData.salaryMax} 
            onChange={(e) => handleChange('salaryMax', e.target.value)} 
            placeholder={t('jobForm.salaryMax')} 
            className="text-input"
            style={{
              borderColor: formData.salaryMin && formData.salaryMax && parseInt(formData.salaryMin) > parseInt(formData.salaryMax) ? '#EF4444' : undefined
            }}
          />
          <select value={formData.salaryCurrency} onChange={(e) => handleChange('salaryCurrency', e.target.value)} className="text-input">
            <option value="TRY">TRY</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        {formData.salaryMin && formData.salaryMax && parseInt(formData.salaryMin) > parseInt(formData.salaryMax) && (
          <div style={{ marginTop: 6, fontSize: 13, color: '#EF4444' }}>
            {t('jobForm.salaryError')}
          </div>
        )}
      </div>

      {/* Son Başvuru Tarihi & İlan Durumu */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>{t('jobForm.deadline')}</label>
          <input type="date" value={formData.deadline} onChange={(e) => handleChange('deadline', e.target.value)} className="text-input" />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>{t('jobForm.status')}</label>
          <select value={formData.status} onChange={(e) => handleChange('status', e.target.value)} className="text-input">
            <option value="draft">{t('jobForm.statusDraft')}</option>
            <option value="active">{t('jobForm.statusActive')}</option>
            <option value="closed">{t('jobForm.statusClosed')}</option>
            <option value="archived">{t('jobForm.statusArchived')}</option>
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button type="submit" className="btn-primary" style={{ flex: 1 }}>
          {t('jobForm.publish')}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          {t('jobForm.cancel')}
        </button>
      </div>
    </form>
  );
};

export default JobForm;
