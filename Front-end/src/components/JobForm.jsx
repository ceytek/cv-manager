/**
 * Job Form Component - Sağ Panel
 * Tüm alanlar: title, dept, description, requirements, keywords, location, 
 * remote_policy, employment_type, experience_level, education, majors, languages, 
 * salary, deadline, status
 */
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { CREATE_JOB_MUTATION, UPDATE_JOB_MUTATION, JOBS_QUERY } from '../graphql/jobs';
import { JOB_INTRO_TEMPLATES_QUERY } from '../graphql/jobIntroTemplates';
import { useTranslation } from 'react-i18next';
import JobPreviewModal from './JobForm/JobPreviewModal';
import SimpleRichTextEditor from './SimpleRichTextEditor';

// Section Panel Component
const SectionPanel = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div style={{
      background: '#FAFBFC',
      border: '1px solid #E5E7EB',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 16,
    }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
          borderBottom: isOpen ? '1px solid #E5E7EB' : 'none',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#1F2937' }}>{title}</span>
        </div>
        <span style={{ 
          fontSize: 18, 
          color: '#6B7280',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
        }}>
          ▾
        </span>
      </div>
      {isOpen && (
        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {children}
        </div>
      )}
    </div>
  );
};

const JobForm = ({ job, aiData, departments = [], onSuccess, onCancel, isModal = false }) => {
  const { t, i18n } = useTranslation();
  const isEditing = !!job;
  
  // Fetch job intro templates
  const { data: introTemplatesData } = useQuery(JOB_INTRO_TEMPLATES_QUERY, {
    variables: { activeOnly: true },
    fetchPolicy: 'network-only',
  });
  const introTemplates = introTemplatesData?.jobIntroTemplates || [];

  const [useIntro, setUseIntro] = useState(false);
  const [selectedIntroId, setSelectedIntroId] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    departmentId: '',
    introText: '',
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
    startDate: '',
    status: 'draft',
  });

  // Language state - kullanıcı dostu UI için
  const [languages, setLanguages] = useState([]);
  const [newLanguage, setNewLanguage] = useState({ name: '', level: 'basic' });
  
  // Predefined language options
  const languageOptions = [
    { value: 'turkish', labelTr: 'Türkçe', labelEn: 'Turkish' },
    { value: 'english', labelTr: 'İngilizce', labelEn: 'English' },
    { value: 'german', labelTr: 'Almanca', labelEn: 'German' },
    { value: 'russian', labelTr: 'Rusça', labelEn: 'Russian' }
  ];
  
  // Get language label based on current language
  const getLanguageLabel = (lang) => {
    return i18n.language === 'en' ? lang.labelEn : lang.labelTr;
  };

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Load job data if editing
  useEffect(() => {
    if (job) {
      // Parse requiredLanguages object into array
      const langObj = job.requiredLanguages || {};
      const langArray = Object.entries(langObj).map(([name, level]) => ({ name, level }));
      
      setFormData({
        title: job.title || '',
        departmentId: job.departmentId || '',
        introText: job.introText || '',
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
        startDate: job.startDate || '',
        status: job.status || 'draft',
      });
      
      setLanguages(langArray);
      
      // If job has intro text, enable the switch
      if (job.introText) {
        setUseIntro(true);
      }
    }
  }, [job]);

  // Load AI-generated data if provided
  useEffect(() => {
    if (aiData) {
      // Parse required_languages if exists
      const langObj = aiData.required_languages || {};
      const langArray = Object.entries(langObj).map(([name, level]) => ({ name, level }));
      
      setFormData({
        title: aiData.title || '',
        departmentId: '', // Will be set by user
        description: aiData.description || '',
        requirements: aiData.requirements || '',
        keywords: (aiData.keywords || []).join(', '),
        location: aiData.location || '',
        remotePolicy: 'office', // Default
        employmentType: aiData.employmentType || 'full-time',
        experienceLevel: aiData.experienceLevel || 'mid',
        requiredEducation: '',
        preferredMajors: aiData.preferred_majors || '',
        requiredLanguages: JSON.stringify(langObj),
        salaryMin: '',
        salaryMax: '',
        salaryCurrency: 'TRY',
        deadline: '',
        startDate: aiData.start_date || '',
        status: 'draft',
      });
      
      setLanguages(langArray);
    }
  }, [aiData]);

  const [createJob, { loading: createLoading }] = useMutation(CREATE_JOB_MUTATION, {
    refetchQueries: [{ query: JOBS_QUERY, variables: { includeInactive: false } }],
  });

  const [updateJob, { loading: updateLoading }] = useMutation(UPDATE_JOB_MUTATION, {
    refetchQueries: [{ query: JOBS_QUERY, variables: { includeInactive: false } }],
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Language handlers
  const handleAddLanguage = () => {
    if (!newLanguage.name) return;
    
    // Check if language already exists
    if (languages.some(l => l.name === newLanguage.name)) {
      setError(t('jobForm.languageAlreadyAdded'));
      setTimeout(() => setError(''), 2000);
      return;
    }
    
    // Get the display name based on current language
    const selectedLang = languageOptions.find(l => l.value === newLanguage.name);
    const displayName = selectedLang ? getLanguageLabel(selectedLang) : newLanguage.name;
    
    setLanguages([...languages, { name: newLanguage.name, displayName, level: newLanguage.level }]);
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
      introText: useIntro && formData.introText ? formData.introText.trim() : null,
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

    // Show preview modal instead of direct save
    setPreviewData(jobData);
    setShowPreview(true);
  };

  const handlePublish = async () => {
    try {
      if (isEditing) {
        await updateJob({ variables: { id: job.id, input: previewData } });
        setSuccess(t('jobForm.successUpdated'));
      } else {
        await createJob({ variables: { input: previewData } });
        setSuccess(t('jobForm.successCreated'));
      }

      setShowPreview(false);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err) {
      setError(err.message || t('jobForm.errorGeneral'));
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {!isModal && (
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>
          {isEditing ? t('jobForm.editJob') : t('jobForm.createJob')}
        </h2>
      )}

      {error && <div style={{ padding: 12, background: '#FEE2E2', color: '#991B1B', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ padding: 12, background: '#D1FAE5', color: '#065F46', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>{success}</div>}

      {/* SECTION 1: Temel Bilgiler */}
      <SectionPanel title={t('jobForm.sectionBasicInfo')} icon="📋">
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
      </SectionPanel>

      {/* SECTION: Ön Yazı / Introduction */}
      <SectionPanel title={t('jobForm.sectionIntro')} icon="📝" defaultOpen={useIntro}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: useIntro ? 16 : 0 }}>
          <label style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>{t('jobForm.addIntro')}</label>
          <button
            type="button"
            onClick={() => {
              setUseIntro(!useIntro);
              if (useIntro) {
                handleChange('introText', '');
                setSelectedIntroId('');
              }
            }}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              border: 'none',
              background: useIntro ? '#10B981' : '#D1D5DB',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: 'white',
              position: 'absolute',
              top: 3,
              left: useIntro ? 23 : 3,
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>
        
        {useIntro && (
          <>
            {introTemplates.length > 0 && (
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>{t('jobForm.selectIntroTemplate')}</label>
                <select
                  value={selectedIntroId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedIntroId(id);
                    if (id) {
                      const template = introTemplates.find(t => t.id === id);
                      if (template) {
                        handleChange('introText', template.content);
                      }
                    }
                  }}
                  className="text-input"
                >
                  <option value="">{t('jobForm.selectIntroPlaceholder')}</option>
                  {introTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>{t('jobForm.introText')}</label>
              <textarea
                value={formData.introText}
                onChange={(e) => handleChange('introText', e.target.value)}
                placeholder={t('jobForm.introPlaceholder')}
                className="text-input"
                rows={6}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#6B7280' }}>{t('jobForm.introHint')}</p>
            </div>
          </>
        )}
      </SectionPanel>

      {/* SECTION 2: Lokasyon & Çalışma */}
      <SectionPanel title={t('jobForm.sectionLocationWork')} icon="📍">
        {/* İl & Çalışma Türü */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>{t('jobForm.city')} *</label>
            <select
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="text-input"
              required
            >
              <option value="">{t('jobForm.selectCity')}</option>
              <option value="İstanbul (Avrupa)">İstanbul (Avrupa)</option>
              <option value="İstanbul (Anadolu)">İstanbul (Anadolu)</option>
              <option value="Ankara">Ankara</option>
              <option value="İzmir">İzmir</option>
              <option value="Kocaeli">Kocaeli</option>
              <option value="Yalova">Yalova</option>
              <option value="Adana">Adana</option>
              <option value="Adıyaman">Adıyaman</option>
              <option value="Afyonkarahisar">Afyonkarahisar</option>
              <option value="Ağrı">Ağrı</option>
              <option value="Aksaray">Aksaray</option>
              <option value="Amasya">Amasya</option>
              <option value="Antalya">Antalya</option>
              <option value="Ardahan">Ardahan</option>
              <option value="Artvin">Artvin</option>
              <option value="Aydın">Aydın</option>
              <option value="Balıkesir">Balıkesir</option>
              <option value="Bartın">Bartın</option>
              <option value="Batman">Batman</option>
              <option value="Bayburt">Bayburt</option>
              <option value="Bilecik">Bilecik</option>
              <option value="Bingöl">Bingöl</option>
              <option value="Bitlis">Bitlis</option>
              <option value="Bolu">Bolu</option>
              <option value="Burdur">Burdur</option>
              <option value="Bursa">Bursa</option>
              <option value="Çanakkale">Çanakkale</option>
              <option value="Çankırı">Çankırı</option>
              <option value="Çorum">Çorum</option>
              <option value="Denizli">Denizli</option>
              <option value="Diyarbakır">Diyarbakır</option>
              <option value="Düzce">Düzce</option>
              <option value="Edirne">Edirne</option>
              <option value="Elazığ">Elazığ</option>
              <option value="Erzincan">Erzincan</option>
              <option value="Erzurum">Erzurum</option>
              <option value="Eskişehir">Eskişehir</option>
              <option value="Gaziantep">Gaziantep</option>
              <option value="Giresun">Giresun</option>
              <option value="Gümüşhane">Gümüşhane</option>
              <option value="Hakkari">Hakkari</option>
              <option value="Hatay">Hatay</option>
              <option value="Iğdır">Iğdır</option>
              <option value="Isparta">Isparta</option>
              <option value="Kahramanmaraş">Kahramanmaraş</option>
              <option value="Karabük">Karabük</option>
              <option value="Karaman">Karaman</option>
              <option value="Kars">Kars</option>
              <option value="Kastamonu">Kastamonu</option>
              <option value="Kayseri">Kayseri</option>
              <option value="Kırıkkale">Kırıkkale</option>
              <option value="Kırklareli">Kırklareli</option>
              <option value="Kırşehir">Kırşehir</option>
              <option value="Kilis">Kilis</option>
              <option value="Konya">Konya</option>
              <option value="Kütahya">Kütahya</option>
              <option value="Malatya">Malatya</option>
              <option value="Manisa">Manisa</option>
              <option value="Mardin">Mardin</option>
              <option value="Mersin">Mersin</option>
              <option value="Muğla">Muğla</option>
              <option value="Muş">Muş</option>
              <option value="Nevşehir">Nevşehir</option>
              <option value="Niğde">Niğde</option>
              <option value="Ordu">Ordu</option>
              <option value="Osmaniye">Osmaniye</option>
              <option value="Rize">Rize</option>
              <option value="Sakarya">Sakarya</option>
              <option value="Samsun">Samsun</option>
              <option value="Siirt">Siirt</option>
              <option value="Sinop">Sinop</option>
              <option value="Sivas">Sivas</option>
              <option value="Şanlıurfa">Şanlıurfa</option>
              <option value="Şırnak">Şırnak</option>
              <option value="Tekirdağ">Tekirdağ</option>
              <option value="Tokat">Tokat</option>
              <option value="Trabzon">Trabzon</option>
              <option value="Tunceli">Tunceli</option>
              <option value="Uşak">Uşak</option>
              <option value="Van">Van</option>
              <option value="Yozgat">Yozgat</option>
              <option value="Zonguldak">Zonguldak</option>
            </select>
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
      </SectionPanel>

      {/* SECTION 3: İş Detayları */}
      <SectionPanel title={t('jobForm.sectionJobDetails')} icon="📝">
        {/* İş Tanımı - Rich Text Editor */}
        <div>
          <SimpleRichTextEditor
            label={t('jobForm.description')}
            required
            value={formData.description}
            onChange={(val) => handleChange('description', val)}
            placeholder={t('jobForm.descriptionPlaceholder')}
            minHeight={150}
            hint={t('jobForm.richTextHint')}
          />
        </div>

        {/* Aranan Nitelikler - Rich Text Editor */}
        <div>
          <SimpleRichTextEditor
            label={t('jobForm.requirements')}
            required
            value={formData.requirements}
            onChange={(val) => handleChange('requirements', val)}
            placeholder={t('jobForm.requirementsPlaceholder')}
            minHeight={150}
            hint={t('jobForm.richTextHintRequirements')}
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
      </SectionPanel>

      {/* SECTION 4: Eğitim & Dil */}
      <SectionPanel title={t('jobForm.sectionEducationLanguage')} icon="🎓">
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
              {languages.map((lang, index) => {
                const langOption = languageOptions.find(l => l.value === lang.name);
                const displayName = langOption ? getLanguageLabel(langOption) : lang.name;
                return (
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
                    <span style={{ fontWeight: 500 }}>{displayName}</span>
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
                );
              })}
            </div>
          )}

          {/* Add New Language */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={newLanguage.name}
              onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
              className="text-input"
              style={{ flex: 1 }}
            >
              <option value="">{t('jobForm.selectLanguage')}</option>
              {languageOptions
                .filter(lang => !languages.some(l => l.name === lang.value))
                .map(lang => (
                  <option key={lang.value} value={lang.value}>
                    {getLanguageLabel(lang)}
                  </option>
                ))
              }
            </select>
            <select
              value={newLanguage.level}
              onChange={(e) => setNewLanguage({ ...newLanguage, level: e.target.value })}
              className="text-input"
              style={{ flex: 1 }}
            >
              <option value="basic">{t('jobForm.languageBasic')}</option>
              <option value="intermediate">{t('jobForm.languageIntermediate')}</option>
              <option value="advanced">{t('jobForm.languageAdvanced')}</option>
              <option value="business">{t('jobForm.languageBusiness')}</option>
              <option value="native">{t('jobForm.languageNative')}</option>
            </select>
            <button
              type="button"
              onClick={handleAddLanguage}
              disabled={!newLanguage.name}
              style={{
                padding: '10px 16px',
                background: newLanguage.name ? '#10B981' : '#D1D5DB',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: newLanguage.name ? 'pointer' : 'not-allowed',
                whiteSpace: 'nowrap',
              }}
            >
              {t('jobForm.addLanguage')}
            </button>
          </div>
        </div>
      </SectionPanel>

      {/* SECTION 5: Maaş & Tarih */}
      <SectionPanel title={t('jobForm.sectionSalaryDates')} icon="💰">
        {/* Maaş Aralığı */}
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
            {t('jobForm.salaryRange')} 
            <span style={{ color: '#9CA3AF', fontSize: 12, marginLeft: 8 }}>({t('common.optional')})</span>
          </label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select 
              value={formData.salaryCurrency} 
              onChange={(e) => handleChange('salaryCurrency', e.target.value)} 
              className="text-input"
              style={{ width: 80 }}
            >
              <option value="TRY">₺ TRY</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
            </select>
            <input 
              type="number" 
              value={formData.salaryMin} 
              onChange={(e) => handleChange('salaryMin', e.target.value)} 
              placeholder={t('jobForm.salaryMin')} 
              className="text-input"
              style={{
                width: 100,
                borderColor: formData.salaryMin && formData.salaryMax && parseInt(formData.salaryMin) > parseInt(formData.salaryMax) ? '#EF4444' : undefined
              }}
            />
            <span style={{ color: '#9CA3AF', fontSize: 14 }}>—</span>
            <input 
              type="number" 
              value={formData.salaryMax} 
              onChange={(e) => handleChange('salaryMax', e.target.value)} 
              placeholder={t('jobForm.salaryMax')} 
              className="text-input"
              style={{
                width: 100,
                borderColor: formData.salaryMin && formData.salaryMax && parseInt(formData.salaryMin) > parseInt(formData.salaryMax) ? '#EF4444' : undefined
              }}
            />
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
      </SectionPanel>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button type="submit" className="btn-primary" style={{ flex: 1 }}>
          👁️ {t('jobForm.preview')}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          {t('jobForm.cancel')}
        </button>
      </div>

      {/* Preview Modal */}
      <JobPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        jobData={previewData}
        departments={departments}
        onPublish={handlePublish}
        isLoading={createLoading || updateLoading}
      />
    </form>
  );
};

export default JobForm;
