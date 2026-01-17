/**
 * Add/Edit Likert Template Modal
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@apollo/client/react';
import { X, Plus, Trash2, Globe, ListChecks, Clock } from 'lucide-react';
import { CREATE_LIKERT_TEMPLATE, UPDATE_LIKERT_TEMPLATE, GET_LIKERT_TEMPLATE } from '../graphql/likert';

const defaultScaleLabels = {
  tr: {
    3: ['Katılmıyorum', 'Kararsızım', 'Katılıyorum'],
    4: ['Kesinlikle Katılmıyorum', 'Katılmıyorum', 'Katılıyorum', 'Kesinlikle Katılıyorum'],
    5: ['Kesinlikle Katılmıyorum', 'Katılmıyorum', 'Kararsızım', 'Katılıyorum', 'Kesinlikle Katılıyorum'],
  },
  en: {
    3: ['Disagree', 'Neutral', 'Agree'],
    4: ['Strongly Disagree', 'Disagree', 'Agree', 'Strongly Agree'],
    5: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
  }
};

const AddEditLikertTemplateModal = ({ isOpen, onClose, onSuccess, template }) => {
  const { t } = useTranslation();
  const isEdit = !!template;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scaleType, setScaleType] = useState(5);
  const [language, setLanguage] = useState('tr');
  const [scaleLabels, setScaleLabels] = useState(defaultScaleLabels['tr'][5]);
  const [hasTimeLimit, setHasTimeLimit] = useState(false);
  const [timeLimit, setTimeLimit] = useState(30 * 60); // Default 30 minutes in seconds
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: templateData } = useQuery(GET_LIKERT_TEMPLATE, {
    variables: { id: template?.id },
    skip: !template?.id,
    fetchPolicy: 'network-only',
  });

  const [createTemplate] = useMutation(CREATE_LIKERT_TEMPLATE);
  const [updateTemplate] = useMutation(UPDATE_LIKERT_TEMPLATE);

  useEffect(() => {
    if (templateData?.likertTemplate) {
      const t = templateData.likertTemplate;
      setName(t.name || '');
      setDescription(t.description || '');
      const st = t.scaleType || 5;
      setScaleType(st);
      setScaleLabels(t.scaleLabels || defaultScaleLabels[st]);
      setLanguage(t.language || 'tr');
      setHasTimeLimit(!!t.timeLimit);
      setTimeLimit(t.timeLimit || 30 * 60);
      setQuestions(t.questions?.map(q => ({
        id: q.id,
        text: q.questionText,
        order: q.questionOrder,
        isReverseScored: q.isReverseScored || false,
      })) || []);
    } else if (!template) {
      setName(''); setDescription(''); setScaleType(5); setLanguage('tr'); setScaleLabels(defaultScaleLabels['tr'][5]); setHasTimeLimit(false); setTimeLimit(30 * 60); setQuestions([]);
    }
  }, [templateData, template]);
  
  // Update scale labels when scale type or language changes
  useEffect(() => {
    setScaleLabels(prev => {
      const targetLen = parseInt(scaleType);
      const langLabels = defaultScaleLabels[language] || defaultScaleLabels['tr'];
      // Always update if language changed or length mismatch
      return langLabels[targetLen] || langLabels[5];
    });
  }, [scaleType, language]);

  const addQuestion = () => {
    setQuestions([...questions, { id: `new-${Date.now()}`, text: '', order: questions.length + 1, isReverseScored: false }]);
  };

  const removeQuestion = (index) => {
    const updated = questions.filter((_, i) => i !== index);
    updated.forEach((q, i) => q.order = i + 1);
    setQuestions(updated);
  };

  const moveQuestion = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === questions.length - 1)) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index + direction]] = [newQuestions[index + direction], newQuestions[index]];
    newQuestions.forEach((q, i) => q.order = i + 1);
    setQuestions(newQuestions);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError(t('likertTemplateModal.nameRequired') || 'Template name is required'); return; }
    const validQuestions = questions.filter(q => q.text.trim());
    if (validQuestions.length === 0) { setError(t('likertTemplateModal.questionsRequired') || 'At least one question is required'); return; }

    setSaving(true);
    setError('');

    try {
      const input = {
        name: name.trim(),
        description: description.trim() || null,
        scaleType: parseInt(scaleType),
        scaleLabels: scaleLabels,
        language,
        timeLimit: hasTimeLimit ? parseInt(timeLimit) : null,
        questions: validQuestions.map((q, i) => ({ 
          id: q.id || null,  // Include existing question ID for updates
          questionText: q.text.trim(), 
          questionOrder: i + 1, 
          isReverseScored: q.isReverseScored || false 
        })),
      };

      if (isEdit) {
        await updateTemplate({ variables: { id: template.id, input } });
      } else {
        await createTemplate({ variables: { input } });
      }
      onSuccess?.();
    } catch (err) {
      console.error('[LikertTemplate] Error:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '90%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{isEdit ? t('likertTemplateModal.titleEdit') : t('likertTemplateModal.titleAdd')}</h2>
          <button onClick={onClose} style={{ padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="#6B7280" /></button>
        </div>

        <div style={{ padding: '24px' }}>
          {error && <div style={{ padding: '12px', background: '#FEE2E2', color: '#DC2626', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>{t('likertTemplateModal.templateName')} *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('likertTemplateModal.templateNamePlaceholder')} className="text-input" style={{ width: '100%' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>{t('likertTemplateModal.description')}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('likertTemplateModal.descriptionPlaceholder')} className="text-input" style={{ width: '100%', minHeight: '80px', resize: 'vertical' }} />
          </div>

          {/* Test Language */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              <Globe size={14} style={{ display: 'inline', marginRight: '6px' }} />
              {language === 'en' ? 'Test Language' : 'Test Dili'}
            </label>
            <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '12px' }}>
              {language === 'en' 
                ? 'The selected language determines the static texts (welcome, start, complete, etc.) on the candidate\'s test page.'
                : 'Seçilen dil, adayın test sayfasındaki sabit metinleri (hoş geldiniz, başla, tamamla vb.) belirler.'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button 
                type="button"
                onClick={() => setLanguage('tr')}
                style={{ 
                  padding: '12px', 
                  border: `2px solid ${language === 'tr' ? '#8B5CF6' : '#E5E7EB'}`, 
                  borderRadius: '8px', 
                  background: language === 'tr' ? '#8B5CF6' : 'white',
                  color: language === 'tr' ? 'white' : '#374151',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                }}
              >
                TR - Türkçe
              </button>
              <button 
                type="button"
                onClick={() => setLanguage('en')}
                style={{ 
                  padding: '12px', 
                  border: `2px solid ${language === 'en' ? '#8B5CF6' : '#E5E7EB'}`, 
                  borderRadius: '8px', 
                  background: language === 'en' ? '#8B5CF6' : 'white',
                  color: language === 'en' ? 'white' : '#374151',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                }}
              >
                EN - English
              </button>
            </div>
          </div>

          {/* Scale Settings */}
          <div style={{ marginBottom: '20px', padding: '16px', background: '#F3F4F6', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '600', color: '#8B5CF6' }}>
              {language === 'en' ? 'Option Settings' : 'Seçenek Ayarları'}
            </h3>
            
            {/* Scale Type */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                {language === 'en' ? 'Number of Options' : 'Seçenek Sayısı'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {[3, 4, 5].map(val => (
                  <button 
                    key={val}
                    type="button"
                    onClick={() => setScaleType(val)}
                    style={{ 
                      padding: '12px', 
                      border: `2px solid ${scaleType == val ? '#8B5CF6' : '#E5E7EB'}`, 
                      borderRadius: '8px', 
                      background: scaleType == val ? '#8B5CF6' : 'white',
                      color: scaleType == val ? 'white' : '#374151',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '14px',
                    }}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale Labels */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                {language === 'en' ? 'Scale Labels' : 'Ölçek Etiketleri'}
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {scaleLabels.map((label, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ 
                      width: '28px', 
                      height: '28px', 
                      borderRadius: '50%', 
                      background: '#8B5CF6', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '12px', 
                      fontWeight: '600',
                      flexShrink: 0,
                    }}>{index + 1}</span>
                    <input
                      type="text"
                      value={label}
                      onChange={(e) => {
                        const newLabels = [...scaleLabels];
                        newLabels[index] = e.target.value;
                        setScaleLabels(newLabels);
                      }}
                      className="text-input"
                      style={{ flex: 1 }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Time Limit Settings */}
          <div style={{ marginBottom: '20px', padding: '16px', background: '#FEF3C7', borderRadius: '12px', border: '1px solid #FDE68A' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hasTimeLimit ? '16px' : '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#D97706" />
                <span style={{ fontWeight: '600', fontSize: '14px', color: '#92400E' }}>
                  {language === 'en' ? 'Time Limit' : 'Süre Sınırı'}
                </span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={hasTimeLimit}
                  onChange={(e) => setHasTimeLimit(e.target.checked)}
                  style={{ marginRight: '8px', width: '18px', height: '18px', accentColor: '#D97706' }}
                />
                <span style={{ fontSize: '13px', color: '#78350F' }}>
                  {language === 'en' ? 'Enable time limit' : 'Süre sınırı aktif'}
                </span>
              </label>
            </div>
            
            {hasTimeLimit && (
              <div>
                <p style={{ fontSize: '12px', color: '#92400E', marginBottom: '12px' }}>
                  {language === 'en' 
                    ? 'Candidate must complete the test within this time. If time runs out, only completed answers will be saved.'
                    : 'Aday testi bu süre içinde tamamlamalı. Süre dolarsa sadece tamamlanan cevaplar kaydedilir.'}
                </p>
                <select 
                  value={timeLimit} 
                  onChange={(e) => setTimeLimit(parseInt(e.target.value))} 
                  className="text-input" 
                  style={{ width: '100%' }}
                >
                  <option value={5 * 60}>5 {language === 'en' ? 'minutes' : 'dakika'}</option>
                  <option value={10 * 60}>10 {language === 'en' ? 'minutes' : 'dakika'}</option>
                  <option value={15 * 60}>15 {language === 'en' ? 'minutes' : 'dakika'}</option>
                  <option value={20 * 60}>20 {language === 'en' ? 'minutes' : 'dakika'}</option>
                  <option value={30 * 60}>30 {language === 'en' ? 'minutes' : 'dakika'}</option>
                  <option value={45 * 60}>45 {language === 'en' ? 'minutes' : 'dakika'}</option>
                  <option value={60 * 60}>60 {language === 'en' ? 'minutes' : 'dakika'}</option>
                </select>
              </div>
            )}
          </div>

          {/* Questions */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ fontWeight: '600', fontSize: '15px' }}>
                {language === 'en' ? 'Questions' : 'Sorular'} ({questions.length})
              </label>
              <button onClick={addQuestion} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#374151', cursor: 'pointer', fontWeight: '500' }}>
                <Plus size={16} /> {language === 'en' ? 'Add Question' : 'Soru Ekle'}
              </button>
            </div>
            
            {questions.length === 0 ? (
              <div style={{ 
                padding: '40px 20px', 
                background: '#F9FAFB', 
                borderRadius: '12px', 
                border: '2px dashed #E5E7EB',
                textAlign: 'center',
                color: '#9CA3AF',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>❓</div>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  {language === 'en' 
                    ? 'No questions added yet. Click the button above to add questions.'
                    : 'Henüz soru eklenmedi. Soru eklemek için yukarıdaki butona tıklayın.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {questions.map((q, index) => (
                  <div key={q.id} style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '12px', 
                    padding: '16px', 
                    background: 'white', 
                    borderRadius: '12px', 
                    border: '1px solid #E5E7EB',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <button 
                        onClick={() => moveQuestion(index, -1)} 
                        disabled={index === 0} 
                        style={{ 
                          padding: '4px', 
                          background: 'transparent', 
                          border: 'none', 
                          cursor: index === 0 ? 'default' : 'pointer', 
                          color: index === 0 ? '#D1D5DB' : '#6B7280',
                          fontSize: '10px',
                        }}
                      >▲</button>
                      <span style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '50%', 
                        background: '#F3F4F6', 
                        color: '#6B7280', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '12px', 
                        fontWeight: '600',
                      }}>{index + 1}</span>
                      <button 
                        onClick={() => moveQuestion(index, 1)} 
                        disabled={index === questions.length - 1} 
                        style={{ 
                          padding: '4px', 
                          background: 'transparent', 
                          border: 'none', 
                          cursor: index === questions.length - 1 ? 'default' : 'pointer', 
                          color: index === questions.length - 1 ? '#D1D5DB' : '#6B7280',
                          fontSize: '10px',
                        }}
                      >▼</button>
                    </div>
                    <textarea
                      value={q.text}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[index].text = e.target.value;
                        setQuestions(updated);
                      }}
                      placeholder={language === 'en' ? 'Enter your question here...' : 'Sorunuzu buraya yazın...'}
                      className="text-input"
                      style={{ 
                        flex: 1, 
                        minHeight: '60px', 
                        resize: 'vertical',
                        fontFamily: 'monospace',
                        fontSize: '14px',
                      }}
                    />
                    <button 
                      onClick={() => removeQuestion(index)} 
                      style={{ 
                        padding: '8px', 
                        background: '#FEE2E2', 
                        border: 'none', 
                        borderRadius: '8px', 
                        cursor: 'pointer', 
                        color: '#DC2626',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} className="btn btn-secondary" disabled={saving}>{t('common.cancel')}</button>
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>{saving ? t('common.saving') : t('common.save')}</button>
        </div>
      </div>
    </div>
  );
};

export default AddEditLikertTemplateModal;

