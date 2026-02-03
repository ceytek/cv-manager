/**
 * Job Form Component - Sağ Panel
 * Tüm alanlar: title, dept, description, requirements, keywords, location, 
 * remote_policy, employment_type, experience_level, education, majors, languages, status
 */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery } from '@apollo/client/react';
import { CREATE_JOB_MUTATION, UPDATE_JOB_MUTATION, JOBS_QUERY } from '../graphql/jobs';
import { JOB_INTRO_TEMPLATES_QUERY } from '../graphql/jobIntroTemplates';
import { JOB_OUTRO_TEMPLATES_QUERY } from '../graphql/jobOutroTemplates';
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

  // Fetch job outro templates
  const { data: outroTemplatesData } = useQuery(JOB_OUTRO_TEMPLATES_QUERY, {
    variables: { activeOnly: true },
    fetchPolicy: 'network-only',
  });
  const outroTemplates = outroTemplatesData?.jobOutroTemplates || [];

  const [useIntro, setUseIntro] = useState(false);
  const [selectedIntroId, setSelectedIntroId] = useState('');
  const [useOutro, setUseOutro] = useState(false);
  const [selectedOutroId, setSelectedOutroId] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    departmentId: '',
    introText: '',
    outroText: '',
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
    startDate: '',
    status: 'draft',
    isDisabledFriendly: false,
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
  const [errorModal, setErrorModal] = useState(null); // For modal-style error messages
  const [successModal, setSuccessModal] = useState(null); // For modal-style success messages
  const [savedJobInfo, setSavedJobInfo] = useState(null); // Store job info for navigation

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
        outroText: job.outroText || '',
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
        startDate: job.startDate || '',
        status: job.status || 'draft',
        isDisabledFriendly: job.isDisabledFriendly || false,
      });
      
      setLanguages(langArray);
      
      // If job has intro text, enable the switch
      if (job.introText) {
        setUseIntro(true);
      }
      // If job has outro text, enable the switch
      if (job.outroText) {
        setUseOutro(true);
      }
    }
  }, [job]);

  // Load AI-generated data if provided
  useEffect(() => {
    if (aiData) {
      // Parse required_languages if exists
      const langObj = aiData.required_languages || {};
      const langArray = Object.entries(langObj).map(([name, level]) => ({ name, level }));
      
      // Find department ID from department name
      let departmentId = '';
      if (aiData.department && departments.length > 0) {
        const matchedDept = departments.find(d => d.name === aiData.department);
        if (matchedDept) {
          departmentId = matchedDept.id;
        }
      }
      
      setFormData({
        title: aiData.title || '',
        departmentId: departmentId,
        introText: aiData.introText || '',
        outroText: aiData.outroText || '',
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
        startDate: aiData.start_date || '',
        status: 'draft',
        isDisabledFriendly: aiData.isDisabledFriendly || false,
      });
      
      setLanguages(langArray);
      
      // If AI data has intro text, enable the switch and set template ID
      if (aiData.introText) {
        setUseIntro(true);
        if (aiData.selectedIntroId) {
          setSelectedIntroId(aiData.selectedIntroId);
        }
      }
      // If AI data has outro text, enable the switch and set template ID
      if (aiData.outroText) {
        setUseOutro(true);
        if (aiData.selectedOutroId) {
          setSelectedOutroId(aiData.selectedOutroId);
        }
      }
    }
  }, [aiData, departments]);

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
      setErrorModal(t('jobForm.languageAlreadyAdded'));
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
      setErrorModal(t('jobForm.errorTitleRequired'));
      return;
    }
    if (!formData.departmentId) {
      setErrorModal(t('jobForm.errorDepartmentRequired'));
      return;
    }
    if (!formData.description || formData.description.length < 10) {
      setErrorModal(t('jobForm.errorDescriptionRequired'));
      return;
    }
    if (!formData.requirements || formData.requirements.length < 10) {
      setErrorModal(t('jobForm.errorRequirementsRequired'));
      return;
    }
    if (!formData.location) {
      setErrorModal(t('jobForm.errorLocationRequired'));
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

    // Get selected outro template name for preview
    const selectedOutroTemplate = selectedOutroId ? outroTemplates.find(t => t.id === selectedOutroId) : null;
    
    const jobData = {
      title: formData.title.trim(),
      departmentId: formData.departmentId,
      introText: useIntro && formData.introText ? formData.introText.trim() : null,
      outroText: useOutro && formData.outroText ? formData.outroText.trim() : null,
      outroTemplateName: useOutro && selectedOutroTemplate ? selectedOutroTemplate.name : null,
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
      startDate: formData.startDate || null,
      status: formData.status,
      isDisabledFriendly: formData.isDisabledFriendly,
    };

    // Show preview modal instead of direct save
    setPreviewData(jobData);
    setShowPreview(true);
  };

  const handlePublish = async () => {
    try {
      // Remove outroTemplateName from input (it's only for preview display)
      const { outroTemplateName, ...inputData } = previewData;
      
      let result;
      let jobData;
      if (isEditing) {
        result = await updateJob({ variables: { id: job.id, input: inputData } });
        jobData = result.data?.updateJob;
      } else {
        result = await createJob({ variables: { input: inputData } });
        jobData = result.data?.createJob;
      }

      // Store job info for navigation after modal close
      if (jobData) {
        setSavedJobInfo({ id: jobData.id, status: jobData.status });
      }

      // Close preview modal and show success modal
      setShowPreview(false);
      setSuccessModal(isEditing ? t('jobForm.successUpdated') : t('jobForm.successCreated'));
    } catch (err) {
      console.error('Job save error:', err);
      // Show error in modal
      setErrorModal(err.message || t('jobForm.errorGeneral'));
    }
  };

  return (
    <>
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
              <SimpleRichTextEditor
                label={t('jobForm.introText')}
                value={formData.introText}
                onChange={(val) => handleChange('introText', val)}
                placeholder={t('jobForm.introPlaceholder')}
                hint={t('jobForm.introHint')}
              />
            </div>
          </>
        )}
      </SectionPanel>

      {/* SECTION: Sonuç Yazı / Outro (What we offer) */}
      <SectionPanel title={t('jobForm.sectionOutro')} icon="🎁" defaultOpen={useOutro}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: useOutro ? 16 : 0 }}>
          <label style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>{t('jobForm.addOutro')}</label>
          <button
            type="button"
            onClick={() => {
              setUseOutro(!useOutro);
              if (useOutro) {
                handleChange('outroText', '');
                setSelectedOutroId('');
              }
            }}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              border: 'none',
              background: useOutro ? '#10B981' : '#D1D5DB',
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
              left: useOutro ? 23 : 3,
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>
        
        {useOutro && (
          <>
            {outroTemplates.length > 0 && (
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>{t('jobForm.selectOutroTemplate')}</label>
                <select
                  value={selectedOutroId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedOutroId(id);
                    if (id) {
                      const template = outroTemplates.find(t => t.id === id);
                      if (template) {
                        handleChange('outroText', template.content);
                      }
                    }
                  }}
                  className="text-input"
                >
                  <option value="">{t('jobForm.selectOutroPlaceholder')}</option>
                  {outroTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <SimpleRichTextEditor
                label={t('jobForm.outroText')}
                value={formData.outroText}
                onChange={(val) => handleChange('outroText', val)}
                placeholder={t('jobForm.outroPlaceholder')}
                hint={t('jobForm.outroHint')}
              />
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

      {/* SECTION 5: İlan Durumu */}
      <SectionPanel title={t('jobForm.sectionJobStatus')} icon="📋">
        {/* İlan Durumu */}
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>{t('jobForm.status')}</label>
          <select value={formData.status} onChange={(e) => handleChange('status', e.target.value)} className="text-input">
            <option value="draft">{t('jobForm.statusDraft')}</option>
            <option value="active">{t('jobForm.statusActive')}</option>
            <option value="closed">{t('jobForm.statusClosed')}</option>
            <option value="archived">{t('jobForm.statusArchived')}</option>
          </select>
        </div>
        
        {/* Engelli Dostu İlan */}
        <div 
          onClick={() => handleChange('isDisabledFriendly', !formData.isDisabledFriendly)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            padding: '16px',
            background: formData.isDisabledFriendly ? '#EFF6FF' : '#F9FAFB',
            border: formData.isDisabledFriendly ? '2px solid #3B82F6' : '2px solid #E5E7EB',
            borderRadius: 12,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: formData.isDisabledFriendly ? '#3B82F6' : '#D1D5DB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
          }}>
            <span style={{ fontSize: 24 }}>♿</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontSize: 15, 
              fontWeight: 600, 
              color: formData.isDisabledFriendly ? '#1E40AF' : '#374151',
              marginBottom: 2 
            }}>
              {t('jobForm.disabledFriendly')}
            </div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>
              {t('jobForm.disabledFriendlyHint')}
            </div>
          </div>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            border: formData.isDisabledFriendly ? '2px solid #3B82F6' : '2px solid #D1D5DB',
            background: formData.isDisabledFriendly ? '#3B82F6' : 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}>
            {formData.isDisabledFriendly && (
              <span style={{ color: 'white', fontWeight: 700 }}>✓</span>
            )}
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
    </form>

    {/* Preview Modal - Using Portal to prevent DOM issues */}
    {createPortal(
      <JobPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        jobData={previewData}
        departments={departments}
        onPublish={handlePublish}
        isLoading={createLoading || updateLoading}
      />,
      document.body
    )}

    {/* Error Modal - Using Portal */}
    {errorModal && createPortal(
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2100
      }}>
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 24,
          maxWidth: 420,
          width: '90%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: 22 }}>⚠️</span>
            </div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1F2937' }}>
              {t('common.warning', 'Uyarı')}
            </h3>
          </div>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: '#4B5563', lineHeight: 1.6 }}>
            {errorModal}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setErrorModal(null)}
              style={{
                padding: '10px 24px',
                background: '#6366F1',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {t('common.ok', 'Tamam')}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* Success Modal - Using Portal */}
    {successModal && createPortal(
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2100
      }}>
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 24,
          maxWidth: 420,
          width: '90%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#D1FAE5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: 22 }}>✅</span>
            </div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1F2937' }}>
              {t('common.success', 'Başarılı')}
            </h3>
          </div>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: '#4B5563', lineHeight: 1.6 }}>
            {successModal}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                setSuccessModal(null);
                if (onSuccess) onSuccess(savedJobInfo);
                setSavedJobInfo(null);
              }}
              style={{
                padding: '10px 24px',
                background: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {t('common.ok', 'Tamam')}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
  </>
  );
};

export default JobForm;
