/**
 * Add/Edit Interview Template Modal
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@apollo/client/react';
import { X, Plus, Trash2, Globe, Clock, Timer, Sparkles, Mic } from 'lucide-react';
import { CREATE_INTERVIEW_TEMPLATE, UPDATE_INTERVIEW_TEMPLATE, GET_INTERVIEW_TEMPLATE } from '../graphql/interviewTemplates';

const AddEditInterviewTemplateModal = ({ isOpen, onClose, onSuccess, template }) => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  const isEdit = !!template;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [introText, setIntroText] = useState('');
  const [language, setLanguage] = useState('tr');
  const [useGlobalTimer, setUseGlobalTimer] = useState(false);
  const [totalDuration, setTotalDuration] = useState(1800); // 30 minutes default
  const [durationPerQuestion, setDurationPerQuestion] = useState(120);
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(false);
  const [voiceResponseEnabled, setVoiceResponseEnabled] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Duration options for per-question timer (in seconds)
  const questionDurationOptions = [
    { value: 60, label: '1 dk' },
    { value: 120, label: '2 dk' },
    { value: 180, label: '3 dk' },
    { value: 300, label: '5 dk' },
    { value: 600, label: '10 dk' },
    { value: 900, label: '15 dk' },
  ];

  // Duration options for global timer (in seconds)
  const globalDurationOptions = [
    { value: 300, label: '5 dk' },
    { value: 600, label: '10 dk' },
    { value: 900, label: '15 dk' },
    { value: 1200, label: '20 dk' },
    { value: 1800, label: '30 dk' },
    { value: 2700, label: '45 dk' },
    { value: 3600, label: '60 dk' },
  ];

  // Fetch full template with questions if editing
  const { data: templateData } = useQuery(GET_INTERVIEW_TEMPLATE, {
    variables: { id: template?.id },
    skip: !template?.id,
    fetchPolicy: 'network-only',
  });

  const [createTemplate] = useMutation(CREATE_INTERVIEW_TEMPLATE);
  const [updateTemplate] = useMutation(UPDATE_INTERVIEW_TEMPLATE);

  useEffect(() => {
    if (templateData?.interviewTemplate) {
      const t = templateData.interviewTemplate;
      setName(t.name || '');
      setDescription(t.description || '');
      setIntroText(t.introText || '');
      setLanguage(t.language || 'tr');
      setUseGlobalTimer(t.useGlobalTimer || false);
      setTotalDuration(t.totalDuration || 1800);
      setDurationPerQuestion(t.durationPerQuestion || 120);
      setAiAnalysisEnabled(t.aiAnalysisEnabled || false);
      setVoiceResponseEnabled(t.voiceResponseEnabled || false);
      setQuestions(t.questions?.map(q => ({
        id: q.id,
        text: q.questionText,
        order: q.questionOrder,
        timeLimit: q.timeLimit || t.durationPerQuestion || 120,
      })) || []);
    } else if (!template) {
      // Reset for new template
      setName('');
      setDescription('');
      setIntroText('');
      setLanguage('tr');
      setUseGlobalTimer(false);
      setTotalDuration(1800);
      setDurationPerQuestion(120);
      setAiAnalysisEnabled(false);
      setVoiceResponseEnabled(false);
      setQuestions([]);
    }
  }, [templateData, template]);

  const addQuestion = () => {
    if (!newQuestion.trim()) return;
    setQuestions([...questions, {
      id: `new-${Date.now()}`,
      text: newQuestion.trim(),
      order: questions.length + 1,
      timeLimit: parseInt(durationPerQuestion),
    }]);
    setNewQuestion('');
  };

  const removeQuestion = (index) => {
    const updated = questions.filter((_, i) => i !== index);
    updated.forEach((q, i) => q.order = i + 1);
    setQuestions(updated);
  };

  const moveQuestion = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === questions.length - 1)) return;
    const newQuestions = [...questions];
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[index + direction];
    newQuestions[index + direction] = temp;
    newQuestions.forEach((q, i) => q.order = i + 1);
    setQuestions(newQuestions);
  };

  const updateQuestionTimeLimit = (index, timeLimit) => {
    const updated = [...questions];
    updated[index].timeLimit = parseInt(timeLimit);
    setQuestions(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError(isEnglish ? 'Template name is required' : 'Şablon adı gereklidir');
      return;
    }
    if (questions.length === 0) {
      setError(isEnglish ? 'At least one question is required' : 'En az bir soru gereklidir');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const input = {
        name: name.trim(),
        description: description.trim() || null,
        introText: introText.trim() || null,
        language,
        durationPerQuestion: parseInt(durationPerQuestion) || 120,
        useGlobalTimer,
        totalDuration: useGlobalTimer ? parseInt(totalDuration) : null,
        aiAnalysisEnabled,
        voiceResponseEnabled,
        questions: questions.map((q, i) => ({
          questionText: q.text,
          questionOrder: i + 1,
          timeLimit: parseInt(q.timeLimit) || parseInt(durationPerQuestion) || 120,
        })),
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
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            {isEdit ? (isEnglish ? 'Edit Interview Template' : 'Mülakat Şablonunu Düzenle') : (isEnglish ? 'New Interview Template' : 'Yeni Mülakat Şablonu')}
          </h2>
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
              {isEnglish ? 'Template Name' : 'Şablon Adı'} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isEnglish ? 'e.g., Technical Interview' : 'ör. Teknik Mülakat'}
              className="text-input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              {isEnglish ? 'Description' : 'Açıklama'}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isEnglish ? 'Brief description of this template' : 'Bu şablonun kısa açıklaması'}
              className="text-input"
              style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          {/* Language */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              <Globe size={14} style={{ display: 'inline', marginRight: '6px' }} />
              {isEnglish ? 'Interview Language' : 'Mülakat Dili'}
            </label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="text-input" style={{ width: '100%' }}>
              <option value="tr">🇹🇷 Türkçe</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>

          {/* Timer Mode Switch */}
          <div style={{ marginBottom: '20px', padding: '16px', background: '#F9FAFB', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Timer size={18} color="#3B82F6" />
                <span style={{ fontWeight: '600', fontSize: '14px' }}>
                  {isEnglish ? 'Use Global Timer' : 'Genel Süre Kullan'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setUseGlobalTimer(!useGlobalTimer)}
                style={{
                  width: '48px',
                  height: '24px',
                  borderRadius: '12px',
                  background: useGlobalTimer ? '#3B82F6' : '#D1D5DB',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s',
                }}
              >
                <span style={{
                  position: 'absolute',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'white',
                  top: '2px',
                  left: useGlobalTimer ? '26px' : '2px',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>

            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6B7280' }}>
              {useGlobalTimer 
                ? (isEnglish 
                    ? 'A single timer will run for the entire interview. The timer continues as questions progress.' 
                    : 'Tüm mülakat için tek bir süre işleyecek. Sorular geçtikçe süre devam edecek.')
                : (isEnglish 
                    ? 'Each question will have its own time limit. Timer resets when moving to the next question.' 
                    : 'Her soru için ayrı süre belirlenecek. Sonraki soruya geçildiğinde süre sıfırlanacak.')
              }
            </p>

            {useGlobalTimer ? (
              /* Global Timer - Total Duration */
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                  <Clock size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  {isEnglish ? 'Total Interview Duration' : 'Toplam Mülakat Süresi'}
                </label>
                <select 
                  value={totalDuration} 
                  onChange={(e) => setTotalDuration(parseInt(e.target.value))} 
                  className="text-input" 
                  style={{ width: '100%' }}
                >
                  {globalDurationOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ) : (
              /* Per-Question Timer - Default Duration */
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                  <Clock size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  {isEnglish ? 'Default Duration Per Question' : 'Varsayılan Soru Süresi'}
                </label>
                <select 
                  value={durationPerQuestion} 
                  onChange={(e) => setDurationPerQuestion(parseInt(e.target.value))} 
                  className="text-input" 
                  style={{ width: '100%' }}
                >
                  {questionDurationOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* AI Analysis & Voice Response Options */}
          <div style={{ marginBottom: '20px', display: 'flex', gap: '16px' }}>
            {/* AI Analysis Option */}
            <div style={{ flex: 1, padding: '16px', background: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#22C55E" />
                  <span style={{ fontWeight: '600', fontSize: '14px', color: '#166534' }}>
                    {isEnglish ? 'AI Analysis' : 'AI Analiz'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAiAnalysisEnabled(!aiAnalysisEnabled)}
                  style={{
                    width: '48px',
                    height: '24px',
                    borderRadius: '12px',
                    background: aiAnalysisEnabled ? '#22C55E' : '#D1D5DB',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'white',
                    top: '2px',
                    left: aiAnalysisEnabled ? '26px' : '2px',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#166534' }}>
                {isEnglish 
                  ? 'AI will analyze candidate answers and provide scores'
                  : 'AI cevapları analiz edip puan verecek'}
              </p>
            </div>

            {/* Voice Response Option */}
            <div style={{ flex: 1, padding: '16px', background: '#EFF6FF', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mic size={18} color="#3B82F6" />
                  <span style={{ fontWeight: '600', fontSize: '14px', color: '#1E40AF' }}>
                    {isEnglish ? 'Voice Response' : 'Sesli Yanıt'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setVoiceResponseEnabled(!voiceResponseEnabled)}
                  style={{
                    width: '48px',
                    height: '24px',
                    borderRadius: '12px',
                    background: voiceResponseEnabled ? '#3B82F6' : '#D1D5DB',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'white',
                    top: '2px',
                    left: voiceResponseEnabled ? '26px' : '2px',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#1E40AF' }}>
                {isEnglish 
                  ? 'Candidates can respond using voice (Speech-to-Text)'
                  : 'Adaylar sesli yanıt verebilir (Konuşma-Metin)'}
              </p>
            </div>
          </div>

          {/* Intro Text */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              {isEnglish ? 'Introduction Text' : 'Giriş Metni'}
            </label>
            <textarea
              value={introText}
              onChange={(e) => setIntroText(e.target.value)}
              placeholder={isEnglish ? 'Text shown to candidates before the interview starts' : 'Mülakat başlamadan önce adaylara gösterilecek metin'}
              className="text-input"
              style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          {/* Questions */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              {isEnglish ? 'Questions' : 'Sorular'} ({questions.length})
            </label>

            {/* Question List */}
            <div style={{ marginBottom: '12px' }}>
              {questions.map((q, index) => (
                <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#F9FAFB', borderRadius: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button onClick={() => moveQuestion(index, -1)} disabled={index === 0} style={{ padding: '2px', background: 'transparent', border: 'none', cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.3 : 1 }}>▲</button>
                    <button onClick={() => moveQuestion(index, 1)} disabled={index === questions.length - 1} style={{ padding: '2px', background: 'transparent', border: 'none', cursor: index === questions.length - 1 ? 'default' : 'pointer', opacity: index === questions.length - 1 ? 0.3 : 1 }}>▼</button>
                  </div>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3B82F6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', flexShrink: 0 }}>
                    {index + 1}
                  </span>
                  <span style={{ flex: 1, fontSize: '14px', color: '#374151' }}>{q.text}</span>
                  
                  {/* Per-question time limit selector (only shown when not using global timer) */}
                  {!useGlobalTimer && (
                    <select
                      value={q.timeLimit}
                      onChange={(e) => updateQuestionTimeLimit(index, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #D1D5DB',
                        fontSize: '12px',
                        background: 'white',
                        cursor: 'pointer',
                      }}
                    >
                      {questionDurationOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  )}
                  
                  <button onClick={() => removeQuestion(index)} style={{ padding: '6px', background: '#FEE2E2', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#DC2626' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Question */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addQuestion()}
                placeholder={isEnglish ? 'Type a question and press Enter...' : 'Soru yazın ve Enter\'a basın...'}
                className="text-input"
                style={{ flex: 1 }}
              />
              <button onClick={addQuestion} disabled={!newQuestion.trim()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} />
                {isEnglish ? 'Add' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} className="btn btn-secondary" disabled={saving}>
            {t('common.cancel')}
          </button>
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
            {saving ? (isEnglish ? 'Saving...' : 'Kaydediliyor...') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEditInterviewTemplateModal;
