/**
 * Add/Edit Likert Test Template Modal
 * With Manual and AI Question Generation tabs
 */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@apollo/client/react';
import { X, Plus, Trash2, Globe, Clock, ListChecks, Sparkles, Wand2, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { 
  CREATE_LIKERT_TEMPLATE, 
  UPDATE_LIKERT_TEMPLATE, 
  GET_LIKERT_TEMPLATE,
  GENERATE_LIKERT_QUESTIONS,
  REGENERATE_SINGLE_LIKERT_QUESTION
} from '../graphql/likert';

const AddEditLikertTestTemplateModal = ({ isOpen, onClose, onSuccess, template }) => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  const isEdit = !!template;

  // Tab state
  const [activeTab, setActiveTab] = useState('manual');

  // Common fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('tr');
  const [scaleType, setScaleType] = useState(5);
  const [timeLimit, setTimeLimit] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newQuestionReverse, setNewQuestionReverse] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Scale labels - editable
  const defaultScaleLabels = {
    5: {
      tr: ['Kesinlikle Katılmıyorum', 'Katılmıyorum', 'Kararsızım', 'Katılıyorum', 'Kesinlikle Katılıyorum'],
      en: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
    },
    7: {
      tr: ['Kesinlikle Katılmıyorum', 'Katılmıyorum', 'Biraz Katılmıyorum', 'Kararsızım', 'Biraz Katılıyorum', 'Katılıyorum', 'Kesinlikle Katılıyorum'],
      en: ['Strongly Disagree', 'Disagree', 'Somewhat Disagree', 'Neutral', 'Somewhat Agree', 'Agree', 'Strongly Agree']
    }
  };
  const [scaleLabels, setScaleLabels] = useState(defaultScaleLabels[5][language] || defaultScaleLabels[5]['tr']);

  // AI tab specific state
  const [aiQuestionCount, setAiQuestionCount] = useState(10);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiQuestions, setAiQuestions] = useState([]); // Array of {id, text, dimension, direction}
  const [aiDimension, setAiDimension] = useState('mixed');
  const [aiDirection, setAiDirection] = useState('mixed');
  const [regeneratingIndex, setRegeneratingIndex] = useState(null);

  // Dimension options
  const dimensionOptions = [
    { value: 'mixed', label: isEnglish ? 'Mixed (All Dimensions)' : 'Karışık (Tüm Boyutlar)', icon: '🎲' },
    { value: 'leadership', label: isEnglish ? 'Leadership' : 'Liderlik', icon: '👑' },
    { value: 'communication', label: isEnglish ? 'Communication' : 'İletişim', icon: '💬' },
    { value: 'teamwork', label: isEnglish ? 'Teamwork' : 'Takım Çalışması', icon: '👥' },
    { value: 'problem_solving', label: isEnglish ? 'Problem Solving' : 'Problem Çözme', icon: '🧩' },
    { value: 'stress_management', label: isEnglish ? 'Stress Management' : 'Stres Yönetimi', icon: '⚡' },
    { value: 'adaptability', label: isEnglish ? 'Adaptability' : 'Adaptasyon', icon: '🔄' },
    { value: 'motivation', label: isEnglish ? 'Motivation' : 'Motivasyon', icon: '🎯' },
    { value: 'integrity', label: isEnglish ? 'Integrity' : 'Dürüstlük', icon: '✓' },
  ];

  // Direction options
  const directionOptions = [
    { value: 'mixed', label: isEnglish ? 'Mixed (Recommended)' : 'Karışık (Önerilen)', color: '#8B5CF6' },
    { value: 'positive', label: isEnglish ? 'Positive Only' : 'Sadece Pozitif', color: '#10B981' },
    { value: 'negative', label: isEnglish ? 'Negative Only' : 'Sadece Negatif', color: '#EF4444' },
  ];

  // Dimension badges for display
  const dimensionBadges = {
    leadership: { icon: '👑', label: isEnglish ? 'Leadership' : 'Liderlik', color: '#F59E0B' },
    communication: { icon: '💬', label: isEnglish ? 'Communication' : 'İletişim', color: '#3B82F6' },
    teamwork: { icon: '👥', label: isEnglish ? 'Teamwork' : 'Takım', color: '#10B981' },
    problem_solving: { icon: '🧩', label: isEnglish ? 'Problem' : 'Problem', color: '#8B5CF6' },
    stress_management: { icon: '⚡', label: isEnglish ? 'Stress' : 'Stres', color: '#EF4444' },
    adaptability: { icon: '🔄', label: isEnglish ? 'Adapt' : 'Adaptasyon', color: '#06B6D4' },
    motivation: { icon: '🎯', label: isEnglish ? 'Motivation' : 'Motivasyon', color: '#EC4899' },
    integrity: { icon: '✓', label: isEnglish ? 'Integrity' : 'Dürüstlük', color: '#6366F1' },
  };

  // Time limit options
  const timeLimitOptions = [
    { value: null, label: isEnglish ? 'No limit' : 'Süre yok' },
    { value: 300, label: '5 dk' },
    { value: 600, label: '10 dk' },
    { value: 900, label: '15 dk' },
    { value: 1200, label: '20 dk' },
    { value: 1800, label: '30 dk' },
  ];

  // Fetch full template if editing
  const { data: templateData } = useQuery(GET_LIKERT_TEMPLATE, {
    variables: { id: template?.id },
    skip: !template?.id,
    fetchPolicy: 'network-only',
  });

  const [createTemplate] = useMutation(CREATE_LIKERT_TEMPLATE);
  const [updateTemplate] = useMutation(UPDATE_LIKERT_TEMPLATE);
  const [generateQuestions] = useMutation(GENERATE_LIKERT_QUESTIONS);
  const [regenerateSingleQuestion] = useMutation(REGENERATE_SINGLE_LIKERT_QUESTION);

  useEffect(() => {
    if (templateData?.likertTemplate) {
      const t = templateData.likertTemplate;
      setName(t.name || '');
      setDescription(t.description || '');
      setLanguage(t.language || 'tr');
      setScaleType(t.scaleType || 5);
      setTimeLimit(t.timeLimit || null);
      setQuestions(
        (t.questions || []).map((q, idx) => ({
          id: q.id || `q-${idx}`,
          text: q.questionText,
          order: q.questionOrder || idx + 1,
          isReverseScored: q.isReverseScored || false,
        }))
      );
    }
  }, [templateData]);

  // Reset when opening
  useEffect(() => {
    if (isOpen && !isEdit) {
      setName('');
      setDescription('');
      setLanguage('tr');
      setScaleType(5);
      setTimeLimit(null);
      setQuestions([]);
      setAiQuestions([]);
      setActiveTab('manual');
      setError('');
      setScaleLabels(defaultScaleLabels[5]['tr']);
    }
  }, [isOpen, isEdit]);

  // Update scale labels when scaleType or language changes
  useEffect(() => {
    setScaleLabels(defaultScaleLabels[scaleType]?.[language] || defaultScaleLabels[5]['tr']);
  }, [scaleType, language]);

  // Manual question management
  const addQuestion = () => {
    if (!newQuestion.trim()) return;
    setQuestions([
      ...questions,
      {
        id: `new-${Date.now()}`,
        text: newQuestion.trim(),
        order: questions.length + 1,
        isReverseScored: newQuestionReverse,
      }
    ]);
    setNewQuestion('');
    setNewQuestionReverse(false);
  };

  const removeQuestion = (index) => {
    const updated = questions.filter((_, i) => i !== index);
    updated.forEach((q, i) => q.order = i + 1);
    setQuestions(updated);
  };

  const moveQuestion = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;
    const updated = [...questions];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated.forEach((q, i) => q.order = i + 1);
    setQuestions(updated);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  // AI question generation
  const handleGenerateQuestions = async () => {
    if (!description.trim()) {
      setError(isEnglish ? 'Description is required for AI question generation' : 'AI soru üretimi için açıklama gereklidir');
      return;
    }

    setAiGenerating(true);
    setError('');

    try {
      const result = await generateQuestions({
        variables: {
          input: {
            description: description.trim(),
            questionCount: aiQuestionCount,
            language: language,
            dimension: aiDimension,
            direction: aiDirection,
            scaleType: scaleType,
          }
        }
      });

      setAiGenerating(false);
      
      if (result.data?.generateLikertQuestions?.success) {
        const generatedQuestions = result.data.generateLikertQuestions.questions || [];
        const mappedQuestions = generatedQuestions.map((q, index) => ({
          id: `ai-${Date.now()}-${index}`,
          text: q.text || '',
          dimension: q.dimension || aiDimension,
          direction: q.direction || 'positive',
          order: index + 1,
        }));
        // Use setTimeout to ensure state update happens in next tick
        setTimeout(() => setAiQuestions(mappedQuestions), 0);
      } else {
        setError(result.data?.generateLikertQuestions?.error || 'AI soru üretimi başarısız');
      }
    } catch (err) {
      console.error('AI generation error:', err);
      setError(err.message);
      setAiGenerating(false);
    }
  };

  // Regenerate single question
  const handleRegenerateSingle = async (index) => {
    if (regeneratingIndex !== null) return;
    
    const currentQuestion = aiQuestions[index];
    setRegeneratingIndex(index);
    
    try {
      const existingTexts = aiQuestions.map(q => q.text);
      
      const result = await regenerateSingleQuestion({
        variables: {
          input: {
            description: description.trim(),
            dimension: currentQuestion.dimension,
            direction: currentQuestion.direction,
            language: language,
            existingQuestions: existingTexts,
          }
        }
      });

      if (result.data?.regenerateSingleLikertQuestion?.success) {
        const newQuestion = result.data.regenerateSingleLikertQuestion.question;
        const updated = [...aiQuestions];
        updated[index] = {
          ...updated[index],
          text: newQuestion.text || '',
          dimension: newQuestion.dimension || currentQuestion.dimension,
          direction: newQuestion.direction || currentQuestion.direction,
        };
        setAiQuestions(updated);
      } else {
        setError(result.data?.regenerateSingleLikertQuestion?.error || 'Soru yenileme başarısız');
      }
    } catch (err) {
      console.error('Regenerate error:', err);
      setError(err.message);
    } finally {
      setRegeneratingIndex(null);
    }
  };

  // AI question management
  const updateAiQuestion = (index, newText) => {
    const updated = [...aiQuestions];
    updated[index].text = newText;
    setAiQuestions(updated);
  };

  const removeAiQuestion = (index) => {
    const updated = aiQuestions.filter((_, i) => i !== index);
    updated.forEach((q, i) => q.order = i + 1);
    setAiQuestions(updated);
  };

  const moveAiQuestion = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= aiQuestions.length) return;
    const updated = [...aiQuestions];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated.forEach((q, i) => q.order = i + 1);
    setAiQuestions(updated);
  };

  // Save template
  const handleSave = async () => {
    if (!name.trim()) {
      setError(isEnglish ? 'Template name is required' : 'Şablon adı gereklidir');
      return;
    }

    const finalQuestions = activeTab === 'ai' ? aiQuestions : questions;
    
    if (finalQuestions.length === 0) {
      setError(isEnglish ? 'At least one question is required' : 'En az bir soru gereklidir');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const input = {
        name: name.trim(),
        description: description.trim() || null,
        scaleType: scaleType,
        language: language,
        timeLimit: timeLimit,
        isAiGenerated: activeTab === 'ai',
        questions: finalQuestions.map((q, idx) => ({
          questionText: q.text,
          questionOrder: idx + 1,
          isReverseScored: activeTab === 'ai' ? (q.direction === 'negative') : (q.isReverseScored || false),
        })),
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

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

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
        maxWidth: 800,
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'white' }}>
            <ListChecks size={24} />
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
              {isEdit 
                ? (isEnglish ? 'Edit Likert Test Template' : 'Likert Test Şablonunu Düzenle')
                : (isEnglish ? 'New Likert Test Template' : 'Yeni Likert Test Şablonu')}
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

        {/* Tabs */}
        {!isEdit && (
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #E5E7EB',
            background: '#F9FAFB',
          }}>
            <button
              onClick={() => setActiveTab('manual')}
              style={{
                flex: 1,
                padding: '14px 20px',
                border: 'none',
                background: activeTab === 'manual' ? 'white' : 'transparent',
                borderBottom: activeTab === 'manual' ? '3px solid #8B5CF6' : '3px solid transparent',
                color: activeTab === 'manual' ? '#8B5CF6' : '#6B7280',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <ListChecks size={18} />
              {isEnglish ? 'Manual' : 'Manuel'}
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              style={{
                flex: 1,
                padding: '14px 20px',
                border: 'none',
                background: activeTab === 'ai' ? 'white' : 'transparent',
                borderBottom: activeTab === 'ai' ? '3px solid #8B5CF6' : '3px solid transparent',
                color: activeTab === 'ai' ? '#8B5CF6' : '#6B7280',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Sparkles size={18} />
              {isEnglish ? 'AI Generate' : 'AI ile Hazırla'}
            </button>
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {error && (
            <div style={{
              padding: '12px 16px',
              background: '#FEF2F2',
              border: '1px solid #FEE2E2',
              borderRadius: 8,
              color: '#DC2626',
              fontSize: 14,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          {/* Template Name */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
              {isEnglish ? 'Template Name' : 'Şablon Adı'} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isEnglish ? 'e.g., Leadership Assessment' : 'ör. Liderlik Değerlendirmesi'}
              className="text-input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
              {isEnglish ? 'Description' : 'Açıklama'}
              {activeTab === 'ai' && (
                <span style={{ color: '#8B5CF6', marginLeft: 8, fontSize: 12 }}>
                  ({isEnglish ? 'AI will generate questions based on this' : 'AI bu metne göre soru üretecek'})
                </span>
              )}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={activeTab === 'ai' 
                ? (isEnglish ? 'Describe the position and competencies to assess...' : 'Pozisyonu ve değerlendirilecek yetkinlikleri açıklayın...')
                : (isEnglish ? 'Brief description of this template' : 'Bu şablonun kısa açıklaması')
              }
              className="text-input"
              style={{ width: '100%', minHeight: activeTab === 'ai' ? 100 : 80, resize: 'vertical' }}
            />
          </div>

          {/* Language & Scale Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                <Globe size={14} style={{ display: 'inline', marginRight: 6 }} />
                {isEnglish ? 'Language' : 'Dil'}
              </label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="text-input" style={{ width: '100%' }}>
                <option value="tr">TR - Türkçe</option>
                <option value="en">EN - English</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                {isEnglish ? 'Scale Type' : 'Ölçek Tipi'}
              </label>
              <select value={scaleType} onChange={(e) => setScaleType(parseInt(e.target.value))} className="text-input" style={{ width: '100%' }}>
                <option value={5}>{isEnglish ? '5-Point Likert' : '5\'li Likert'}</option>
                <option value={7}>{isEnglish ? '7-Point Likert' : '7\'li Likert'}</option>
              </select>
            </div>
          </div>

          {/* Scale Labels - Editable */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 10, fontWeight: 500, fontSize: 14 }}>
              {isEnglish ? 'Scale Labels' : 'Ölçek Etiketleri'}
              <span style={{ fontWeight: 400, marginLeft: 8, fontSize: 12, color: '#6B7280' }}>
                ({isEnglish ? 'click to edit' : 'düzenlemek için tıklayın'})
              </span>
            </label>
            <div style={{ 
              display: 'flex', 
              gap: 8, 
              flexWrap: 'wrap',
              padding: 16,
              background: '#F9FAFB',
              borderRadius: 10,
              border: '1px solid #E5E7EB'
            }}>
              {scaleLabels.map((label, idx) => (
                <div 
                  key={idx}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    gap: 6,
                    flex: 1,
                    minWidth: scaleType === 7 ? '100px' : '120px',
                  }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${
                      idx === 0 ? '#FEE2E2, #FECACA' :
                      idx === scaleLabels.length - 1 ? '#D1FAE5, #A7F3D0' :
                      idx === Math.floor(scaleLabels.length / 2) ? '#FEF3C7, #FDE68A' :
                      idx < Math.floor(scaleLabels.length / 2) ? '#FED7AA, #FDBA74' :
                      '#BBF7D0, #86EFAC'
                    })`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: 14,
                    color: '#374151',
                    border: '2px solid white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    {idx + 1}
                  </div>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => {
                      const updated = [...scaleLabels];
                      updated[idx] = e.target.value;
                      setScaleLabels(updated);
                    }}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: 12,
                      textAlign: 'center',
                      border: '1px solid #E5E7EB',
                      borderRadius: 6,
                      background: 'white',
                      color: '#374151',
                      transition: 'all 0.15s ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3B82F6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#E5E7EB';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setScaleLabels(defaultScaleLabels[scaleType]?.[language] || defaultScaleLabels[5]['tr'])}
              style={{
                marginTop: 8,
                padding: '6px 12px',
                fontSize: 12,
                color: '#6B7280',
                background: 'transparent',
                border: '1px solid #E5E7EB',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              {isEnglish ? '↺ Reset to default' : '↺ Varsayılana sıfırla'}
            </button>
          </div>

          {/* Time Limit */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
              <Clock size={14} style={{ display: 'inline', marginRight: 6 }} />
              {isEnglish ? 'Time Limit' : 'Süre Limiti'}
            </label>
            <select value={timeLimit || ''} onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : null)} className="text-input" style={{ width: '200px' }}>
              {timeLimitOptions.map(opt => (
                <option key={opt.value || 'none'} value={opt.value || ''}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* AI Tab - Settings & Generate */}
          {activeTab === 'ai' && !isEdit && (
            <div style={{ marginBottom: 20, padding: 20, background: 'linear-gradient(135deg, #F3E8FF 0%, #EDE9FE 100%)', borderRadius: 12, border: '1px solid #DDD6FE' }}>
              {/* Dimension & Direction */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14, color: '#5B21B6' }}>
                    {isEnglish ? 'Dimension to Measure' : 'Ölçülecek Boyut'}
                  </label>
                  <select 
                    value={aiDimension} 
                    onChange={(e) => setAiDimension(e.target.value)}
                    className="text-input"
                    style={{ width: '100%' }}
                  >
                    {dimensionOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14, color: '#5B21B6' }}>
                    {isEnglish ? 'Question Direction' : 'Soru Yönü'}
                  </label>
                  <select 
                    value={aiDirection} 
                    onChange={(e) => setAiDirection(e.target.value)}
                    className="text-input"
                    style={{ width: '100%' }}
                  >
                    {directionOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Question Count */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14, color: '#5B21B6' }}>
                  {isEnglish ? 'Number of Questions' : 'Soru Sayısı'}
                </label>
                <select 
                  value={aiQuestionCount} 
                  onChange={(e) => setAiQuestionCount(parseInt(e.target.value))}
                  className="text-input"
                  style={{ width: '200px' }}
                >
                  {[5, 10, 15, 20, 25, 30].map(n => (
                    <option key={n} value={n}>{n} {isEnglish ? 'questions' : 'soru'}</option>
                  ))}
                </select>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateQuestions}
                disabled={aiGenerating || !description.trim()}
                style={{
                  padding: '14px 32px',
                  background: aiGenerating ? '#9CA3AF' : 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: aiGenerating || !description.trim() ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: aiGenerating ? 'none' : '0 4px 14px rgba(139, 92, 246, 0.35)',
                }}
              >
                {aiGenerating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    {isEnglish ? 'Generating...' : 'Oluşturuluyor...'}
                  </>
                ) : (
                  <>
                    <Wand2 size={20} />
                    {isEnglish ? 'Generate Questions' : 'Soruları Oluştur'}
                  </>
                )}
              </button>

              {/* AI Generated Questions */}
              {aiQuestions.length > 0 ? (
                <div style={{ marginTop: 20 }}>
                  <label style={{ display: 'block', marginBottom: 12, fontWeight: 500, fontSize: 14, color: '#5B21B6' }}>
                    {isEnglish ? 'Generated Questions' : 'Oluşturulan Sorular'} ({aiQuestions.length})
                    <span style={{ fontWeight: 400, marginLeft: 8, fontSize: 12, color: '#7C3AED' }}>
                      ({isEnglish ? 'edit as needed' : 'düzenleyebilirsiniz'})
                    </span>
                  </label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {aiQuestions.map((q, index) => (
                      <div 
                        key={q.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: 12, 
                          padding: 16, 
                          background: 'white', 
                          borderRadius: 10,
                          border: '1px solid #DDD6FE',
                        }}
                      >
                        {/* Reorder arrows */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 4 }}>
                          <button
                            onClick={() => moveAiQuestion(index, 'up')}
                            disabled={index === 0}
                            style={{
                              padding: 2,
                              background: 'transparent',
                              border: 'none',
                              cursor: index === 0 ? 'not-allowed' : 'pointer',
                              color: index === 0 ? '#D1D5DB' : '#6B7280',
                              fontSize: 10,
                              lineHeight: 1,
                            }}
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => moveAiQuestion(index, 'down')}
                            disabled={index === aiQuestions.length - 1}
                            style={{
                              padding: 2,
                              background: 'transparent',
                              border: 'none',
                              cursor: index === aiQuestions.length - 1 ? 'not-allowed' : 'pointer',
                              color: index === aiQuestions.length - 1 ? '#D1D5DB' : '#6B7280',
                              fontSize: 10,
                              lineHeight: 1,
                            }}
                          >
                            ▼
                          </button>
                        </div>
                        {/* Question number, dimension & direction badges */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <span style={{ 
                            width: 28, 
                            height: 28, 
                            borderRadius: '50%', 
                            background: '#8B5CF6', 
                            color: 'white', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: 13, 
                            fontWeight: 600,
                          }}>
                            {index + 1}
                          </span>
                          {/* Dimension badge */}
                          {q.dimension && dimensionBadges[q.dimension] && (
                            <span style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                              padding: '2px 6px',
                              background: `${dimensionBadges[q.dimension].color}15`,
                              color: dimensionBadges[q.dimension].color,
                              borderRadius: 10,
                              fontSize: 10,
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}>
                              <span>{dimensionBadges[q.dimension].icon}</span>
                              {dimensionBadges[q.dimension].label}
                            </span>
                          )}
                          {/* Direction badge */}
                          <span style={{
                            padding: '2px 6px',
                            background: q.direction === 'negative' ? '#FEE2E2' : '#D1FAE5',
                            color: q.direction === 'negative' ? '#DC2626' : '#059669',
                            borderRadius: 10,
                            fontSize: 9,
                            fontWeight: 600,
                          }}>
                            {q.direction === 'negative' ? '−' : '+'}
                          </span>
                        </div>
                        
                        {/* Editable textarea */}
                        <textarea
                          value={q.text}
                          onChange={(e) => updateAiQuestion(index, e.target.value)}
                          style={{
                            flex: 1,
                            padding: '10px 12px',
                            border: '1px solid #E5E7EB',
                            borderRadius: 8,
                            fontSize: 14,
                            lineHeight: 1.5,
                            resize: 'vertical',
                            minHeight: 50,
                            fontFamily: 'inherit',
                          }}
                        />

                        {/* Action buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                          <button 
                            onClick={() => handleRegenerateSingle(index)}
                            disabled={regeneratingIndex !== null}
                            title={isEnglish ? 'Regenerate' : 'Yeniden oluştur'}
                            style={{ 
                              padding: 8, 
                              background: regeneratingIndex === index ? '#E5E7EB' : '#EEF2FF', 
                              border: 'none', 
                              borderRadius: 8, 
                              cursor: regeneratingIndex !== null ? 'not-allowed' : 'pointer', 
                              color: '#6366F1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <RefreshCw 
                              size={16} 
                              style={{ animation: regeneratingIndex === index ? 'spin 1s linear infinite' : 'none' }} 
                            />
                          </button>
                          <button 
                            onClick={() => removeAiQuestion(index)} 
                            style={{ 
                              padding: 8, 
                              background: '#FEE2E2', 
                              border: 'none', 
                              borderRadius: 8, 
                              cursor: 'pointer', 
                              color: '#DC2626',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Manual Tab - Question List */}
          {(activeTab === 'manual' || isEdit) && (
            <div>
              <label style={{ display: 'block', marginBottom: 12, fontWeight: 500, fontSize: 14 }}>
                {isEnglish ? 'Questions' : 'Sorular'} ({questions.length})
              </label>

              {/* Add new question */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addQuestion()}
                  placeholder={isEnglish ? 'Enter a new statement...' : 'Yeni bir ifade girin...'}
                  className="text-input"
                  style={{ flex: 1 }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, whiteSpace: 'nowrap' }}>
                  <input
                    type="checkbox"
                    checked={newQuestionReverse}
                    onChange={(e) => setNewQuestionReverse(e.target.checked)}
                  />
                  {isEnglish ? 'Reverse' : 'Ters'}
                </label>
                <button
                  onClick={addQuestion}
                  disabled={!newQuestion.trim()}
                  style={{
                    padding: '10px 16px',
                    background: newQuestion.trim() ? '#8B5CF6' : '#E5E7EB',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: newQuestion.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Plus size={18} />
                  {isEnglish ? 'Add' : 'Ekle'}
                </button>
              </div>

              {/* Question list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {questions.map((q, index) => (
                  <div
                    key={q.id}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 12, 
                      padding: 12, 
                      background: '#F9FAFB', 
                      borderRadius: 8,
                      border: '1px solid #E5E7EB',
                    }}
                  >
                    {/* Reorder arrows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button
                        onClick={() => moveQuestion(index, 'up')}
                        disabled={index === 0}
                        style={{
                          padding: 2,
                          background: 'transparent',
                          border: 'none',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          color: index === 0 ? '#D1D5DB' : '#6B7280',
                          fontSize: 10,
                          lineHeight: 1,
                        }}
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveQuestion(index, 'down')}
                        disabled={index === questions.length - 1}
                        style={{
                          padding: 2,
                          background: 'transparent',
                          border: 'none',
                          cursor: index === questions.length - 1 ? 'not-allowed' : 'pointer',
                          color: index === questions.length - 1 ? '#D1D5DB' : '#6B7280',
                          fontSize: 10,
                          lineHeight: 1,
                        }}
                      >
                        ▼
                      </button>
                    </div>
                    <span style={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: '50%', 
                      background: '#8B5CF6', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: 12, 
                      fontWeight: 600,
                      flexShrink: 0,
                    }}>
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={q.text}
                      onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                      className="text-input"
                      style={{ flex: 1 }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}>
                      <input
                        type="checkbox"
                        checked={q.isReverseScored}
                        onChange={(e) => updateQuestion(index, 'isReverseScored', e.target.checked)}
                      />
                      {isEnglish ? 'Reverse' : 'Ters'}
                    </label>
                    <button
                      onClick={() => removeQuestion(index)}
                      style={{
                        padding: 6,
                        background: '#FEE2E2',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        color: '#DC2626',
                        display: 'flex',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {questions.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
                  {isEnglish ? 'No questions added yet' : 'Henüz soru eklenmedi'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ fontSize: 13, color: '#6B7280' }}>
            {activeTab === 'ai' && aiQuestions.length > 0 && (
              <span>{aiQuestions.length} {isEnglish ? 'questions ready' : 'soru hazır'}</span>
            )}
            {(activeTab === 'manual' || isEdit) && questions.length > 0 && (
              <span>{questions.length} {isEnglish ? 'questions' : 'soru'}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
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
                background: '#8B5CF6',
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
      </div>
    </div>,
    document.body
  );
};

export default AddEditLikertTestTemplateModal;
