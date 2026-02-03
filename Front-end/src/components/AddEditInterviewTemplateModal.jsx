/**
 * Add/Edit Interview Template Modal
 * With Manual and AI Question Generation tabs
 */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@apollo/client/react';
import { X, Plus, Trash2, Globe, Clock, Timer, Sparkles, Mic, Wand2, FileText, Loader2, RefreshCw } from 'lucide-react';
import { 
  CREATE_INTERVIEW_TEMPLATE, 
  UPDATE_INTERVIEW_TEMPLATE, 
  GET_INTERVIEW_TEMPLATE,
  GENERATE_INTERVIEW_QUESTIONS,
  REGENERATE_SINGLE_QUESTION
} from '../graphql/interviewTemplates';

const AddEditInterviewTemplateModal = ({ isOpen, onClose, onSuccess, template }) => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  const isEdit = !!template;

  // Tab state
  const [activeTab, setActiveTab] = useState('manual');

  // Common fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [introText, setIntroText] = useState('');
  const [language, setLanguage] = useState('tr');
  const [useGlobalTimer, setUseGlobalTimer] = useState(false);
  const [totalDuration, setTotalDuration] = useState(1800);
  const [durationPerQuestion, setDurationPerQuestion] = useState(300); // 5 minutes default
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(true);
  const [voiceResponseEnabled, setVoiceResponseEnabled] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // AI tab specific state
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiQuestions, setAiQuestions] = useState([]); // Array of {id, text, type, timeLimit}
  const [aiQuestionType, setAiQuestionType] = useState('mixed'); // behavioral, situational, technical, conceptual, mixed
  const [aiDifficulty, setAiDifficulty] = useState('intermediate'); // entry, intermediate, advanced
  const [regeneratingIndex, setRegeneratingIndex] = useState(null); // Index of question being regenerated

  // Question type options
  const questionTypeOptions = [
    { value: 'mixed', label: isEnglish ? 'Mixed (All Types)' : 'Karışık (Tüm Tipler)', icon: '🎲' },
    { value: 'behavioral', label: isEnglish ? 'Behavioral' : 'Davranışsal', icon: '🎭' },
    { value: 'situational', label: isEnglish ? 'Situational' : 'Durumsal', icon: '🎯' },
    { value: 'technical', label: isEnglish ? 'Technical' : 'Teknik', icon: '⚙️' },
    { value: 'conceptual', label: isEnglish ? 'Conceptual' : 'Kavramsal', icon: '💡' },
  ];

  // Difficulty options
  const difficultyOptions = [
    { value: 'entry', label: isEnglish ? 'Entry Level' : 'Başlangıç', color: '#10B981' },
    { value: 'intermediate', label: isEnglish ? 'Intermediate' : 'Orta Seviye', color: '#F59E0B' },
    { value: 'advanced', label: isEnglish ? 'Advanced' : 'İleri Seviye', color: '#EF4444' },
  ];

  // Question type badge config
  const questionTypeBadges = {
    behavioral: { icon: '🎭', label: isEnglish ? 'Behavioral' : 'Davranışsal', color: '#8B5CF6' },
    situational: { icon: '🎯', label: isEnglish ? 'Situational' : 'Durumsal', color: '#F59E0B' },
    technical: { icon: '⚙️', label: isEnglish ? 'Technical' : 'Teknik', color: '#3B82F6' },
    conceptual: { icon: '💡', label: isEnglish ? 'Conceptual' : 'Kavramsal', color: '#10B981' },
  };

  // Duration options
  const questionDurationOptions = [
    { value: 60, label: '1 dk' },
    { value: 120, label: '2 dk' },
    { value: 180, label: '3 dk' },
    { value: 300, label: '5 dk' },
    { value: 600, label: '10 dk' },
    { value: 900, label: '15 dk' },
  ];

  const globalDurationOptions = [
    { value: 300, label: '5 dk' },
    { value: 600, label: '10 dk' },
    { value: 900, label: '15 dk' },
    { value: 1200, label: '20 dk' },
    { value: 1800, label: '30 dk' },
    { value: 2700, label: '45 dk' },
    { value: 3600, label: '60 dk' },
  ];

  // Fetch full template if editing
  const { data: templateData } = useQuery(GET_INTERVIEW_TEMPLATE, {
    variables: { id: template?.id },
    skip: !template?.id,
    fetchPolicy: 'network-only',
  });

  const [createTemplate] = useMutation(CREATE_INTERVIEW_TEMPLATE);
  const [updateTemplate] = useMutation(UPDATE_INTERVIEW_TEMPLATE);
  const [generateQuestions] = useMutation(GENERATE_INTERVIEW_QUESTIONS);
  const [regenerateSingleQuestion] = useMutation(REGENERATE_SINGLE_QUESTION);

  useEffect(() => {
    if (templateData?.interviewTemplate) {
      const t = templateData.interviewTemplate;
      setName(t.name || '');
      setDescription(t.description || '');
      setIntroText(t.introText || '');
      setLanguage(t.language || 'tr');
      setUseGlobalTimer(t.useGlobalTimer || false);
      setTotalDuration(t.totalDuration || 1800);
      setDurationPerQuestion(t.durationPerQuestion || 300);
      setAiAnalysisEnabled(t.aiAnalysisEnabled ?? true);
      setVoiceResponseEnabled(t.voiceResponseEnabled ?? true);
      setQuestions(t.questions?.map(q => ({
        id: q.id,
        text: q.questionText,
        order: q.questionOrder,
        timeLimit: q.timeLimit || t.durationPerQuestion || 300,
      })) || []);
    } else if (!template) {
      resetForm();
    }
  }, [templateData, template]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setIntroText('');
    setLanguage('tr');
    setUseGlobalTimer(false);
    setTotalDuration(1800);
    setDurationPerQuestion(300);
    setAiAnalysisEnabled(true);
    setVoiceResponseEnabled(true);
    setQuestions([]);
    setAiQuestions([]);
    setAiQuestionCount(5);
    setActiveTab('manual');
  };

  // Manual tab functions
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

  // AI tab functions
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
            questionType: aiQuestionType,
            difficulty: aiDifficulty,
          }
        }
      });

      if (result.data?.generateInterviewQuestions?.success) {
        const generatedQuestions = result.data.generateInterviewQuestions.questions || [];
        // Convert to array with ids, types and time limits
        setAiQuestions(generatedQuestions.map((q, index) => ({
          id: `ai-${Date.now()}-${index}`,
          text: (q.text || '').replace(/^\d+[\.\)\-]\s*/, '').trim(), // Remove numbering
          type: q.type || aiQuestionType,
          order: index + 1,
          timeLimit: parseInt(durationPerQuestion),
        })));
      } else {
        setError(result.data?.generateInterviewQuestions?.error || 'AI soru üretimi başarısız');
      }
    } catch (err) {
      console.error('AI generation error:', err);
      setError(err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  // AI question management functions
  const updateAiQuestion = (index, newText) => {
    const updated = [...aiQuestions];
    updated[index].text = newText;
    setAiQuestions(updated);
  };

  const updateAiQuestionTimeLimit = (index, timeLimit) => {
    const updated = [...aiQuestions];
    updated[index].timeLimit = parseInt(timeLimit);
    setAiQuestions(updated);
  };

  const removeAiQuestion = (index) => {
    const updated = aiQuestions.filter((_, i) => i !== index);
    updated.forEach((q, i) => q.order = i + 1);
    setAiQuestions(updated);
  };

  // Regenerate a single question
  const handleRegenerateSingle = async (index) => {
    if (regeneratingIndex !== null) return;
    
    const currentQuestion = aiQuestions[index];
    setRegeneratingIndex(index);
    
    try {
      // Get existing questions texts for context (to avoid repetition)
      const existingTexts = aiQuestions.map(q => q.text);
      
      const result = await regenerateSingleQuestion({
        variables: {
          input: {
            description: description.trim(),
            questionType: currentQuestion.type || aiQuestionType,
            difficulty: aiDifficulty,
            language: language,
            existingQuestions: existingTexts,
          }
        }
      });

      if (result.data?.regenerateSingleQuestion?.success) {
        const newQuestion = result.data.regenerateSingleQuestion.question;
        const updated = [...aiQuestions];
        updated[index] = {
          ...updated[index],
          text: (newQuestion.text || '').replace(/^\d+[\.\)\-]\s*/, '').trim(),
          type: newQuestion.type || currentQuestion.type,
        };
        setAiQuestions(updated);
      } else {
        setError(result.data?.regenerateSingleQuestion?.error || 'Soru yenileme başarısız');
      }
    } catch (err) {
      console.error('Regenerate error:', err);
      setError(err.message);
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const moveAiQuestion = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === aiQuestions.length - 1)) return;
    const newQuestions = [...aiQuestions];
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[index + direction];
    newQuestions[index + direction] = temp;
    newQuestions.forEach((q, i) => q.order = i + 1);
    setAiQuestions(newQuestions);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError(isEnglish ? 'Template name is required' : 'Şablon adı gereklidir');
      return;
    }

    // Get questions based on active tab
    let finalQuestions = questions;
    if (activeTab === 'ai') {
      finalQuestions = aiQuestions.filter(q => q.text.trim().length > 0);
    }

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
        introText: introText.trim() || null,
        language,
        durationPerQuestion: parseInt(durationPerQuestion) || 300,
        useGlobalTimer,
        totalDuration: useGlobalTimer ? parseInt(totalDuration) : null,
        aiAnalysisEnabled,
        voiceResponseEnabled,
        isAiGenerated: activeTab === 'ai',
        questions: finalQuestions.map((q, i) => ({
          questionText: q.text,
          questionOrder: i + 1,
          timeLimit: parseInt(q.timeLimit) || parseInt(durationPerQuestion) || 300,
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

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '90%', maxWidth: '750px', maxHeight: '90vh', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            {isEdit ? (isEnglish ? 'Edit Interview Template' : 'Mülakat Şablonunu Düzenle') : (isEnglish ? 'New Interview Template' : 'Yeni Mülakat Şablonu')}
          </h2>
          <button onClick={onClose} style={{ padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={20} color="#6B7280" />
          </button>
        </div>

        {/* Tabs - Only show for new templates */}
        {!isEdit && (
          <div style={{ padding: '0 24px', borderBottom: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setActiveTab('manual')}
                style={{
                  padding: '12px 20px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'manual' ? '3px solid #3B82F6' : '3px solid transparent',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'manual' ? '600' : '500',
                  color: activeTab === 'manual' ? '#3B82F6' : '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                }}
              >
                <FileText size={18} />
                {isEnglish ? 'Manual' : 'Manuel'}
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                style={{
                  padding: '12px 20px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'ai' ? '3px solid #8B5CF6' : '3px solid transparent',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'ai' ? '600' : '500',
                  color: activeTab === 'ai' ? '#8B5CF6' : '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                }}
              >
                <Wand2 size={18} />
                {isEnglish ? 'AI Generate' : 'AI ile Hazırla'}
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {error && activeTab === 'manual' && (
            <div style={{ padding: '12px', background: '#FEE2E2', color: '#DC2626', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {/* Common Fields: Name */}
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

          {/* Description - Common but used for AI generation */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              {isEnglish ? 'Description' : 'Açıklama'}
              {activeTab === 'ai' && <span style={{ color: '#8B5CF6', marginLeft: '8px', fontSize: '12px' }}>
                ({isEnglish ? 'AI will generate questions based on this' : 'AI bu metne göre soru üretecek'})
              </span>}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={activeTab === 'ai' 
                ? (isEnglish ? 'Describe the position, required skills, and what you want to assess...' : 'Pozisyonu, gereken becerileri ve değerlendirmek istediğiniz konuları açıklayın...')
                : (isEnglish ? 'Brief description of this template' : 'Bu şablonun kısa açıklaması')
              }
              className="text-input"
              style={{ width: '100%', minHeight: activeTab === 'ai' ? '100px' : '80px', resize: 'vertical' }}
            />
          </div>

          {/* Language */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              <Globe size={14} style={{ display: 'inline', marginRight: '6px' }} />
              {isEnglish ? 'Interview Language' : 'Mülakat Dili'}
              {activeTab === 'ai' && <span style={{ color: '#8B5CF6', marginLeft: '8px', fontSize: '12px' }}>
                ({isEnglish ? 'Questions will be in this language' : 'Sorular bu dilde olacak'})
              </span>}
            </label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="text-input" style={{ width: '100%' }}>
              <option value="tr">TR - Türkçe</option>
              <option value="en">EN - English</option>
            </select>
          </div>

          {/* AI Tab - Question Settings & Generate Button */}
          {activeTab === 'ai' && !isEdit && (
            <div style={{ marginBottom: '20px', padding: '20px', background: 'linear-gradient(135deg, #F3E8FF 0%, #EDE9FE 100%)', borderRadius: '12px', border: '1px solid #DDD6FE' }}>
              {/* Row 1: Question Type & Difficulty */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                {/* Question Type */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: '#5B21B6' }}>
                    {isEnglish ? 'Question Type' : 'Soru Tipi'}
                  </label>
                  <select 
                    value={aiQuestionType} 
                    onChange={(e) => setAiQuestionType(e.target.value)}
                    className="text-input"
                    style={{ width: '100%' }}
                  >
                    {questionTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Level */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: '#5B21B6' }}>
                    {isEnglish ? 'Difficulty Level' : 'Zorluk Seviyesi'}
                  </label>
                  <select 
                    value={aiDifficulty} 
                    onChange={(e) => setAiDifficulty(e.target.value)}
                    className="text-input"
                    style={{ width: '100%' }}
                  >
                    {difficultyOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Question Count */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: '#5B21B6' }}>
                  {isEnglish ? 'Number of Questions' : 'Soru Sayısı'}
                </label>
                <select 
                  value={aiQuestionCount} 
                  onChange={(e) => setAiQuestionCount(parseInt(e.target.value))}
                  className="text-input"
                  style={{ width: '200px' }}
                >
                  {[...Array(15)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1} {isEnglish ? 'questions' : 'soru'}</option>
                  ))}
                </select>
              </div>

              {/* Generate Button - Separate Row */}
              <button
                onClick={handleGenerateQuestions}
                disabled={aiGenerating || !description.trim()}
                style={{
                  padding: '14px 32px',
                  background: aiGenerating ? '#9CA3AF' : 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '15px',
                  cursor: aiGenerating || !description.trim() ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  whiteSpace: 'nowrap',
                  boxShadow: aiGenerating ? 'none' : '0 4px 14px rgba(139, 92, 246, 0.35)',
                  transition: 'all 0.2s ease',
                }}
              >
                {aiGenerating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    {isEnglish ? 'Generating...' : 'Oluşturuluyor...'}
                  </>
                ) : (
                  <>
                    <Wand2 size={20} />
                    {isEnglish ? 'Generate Questions' : 'Soruları Oluştur'}
                  </>
                )}
              </button>

              {/* Error Message - Below Generate Button */}
              {error && activeTab === 'ai' && (
                <div style={{ 
                  padding: '12px 16px', 
                  background: '#FEF2F2', 
                  border: '1px solid #FECACA',
                  color: '#DC2626', 
                  borderRadius: '10px', 
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span style={{ fontSize: '16px' }}>⚠️</span>
                  {error}
                </div>
              )}

              {/* AI Generated Questions - Individual Editable Cards */}
              {aiQuestions.length > 0 && (
                <div>
                  <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500', fontSize: '14px', color: '#5B21B6' }}>
                    {isEnglish ? 'Generated Questions' : 'Oluşturulan Sorular'} ({aiQuestions.length})
                    <span style={{ fontWeight: '400', marginLeft: '8px', fontSize: '12px', color: '#7C3AED' }}>
                      ({isEnglish ? 'edit as needed' : 'düzenleyebilirsiniz'})
                    </span>
                  </label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {aiQuestions.map((q, index) => (
                      <div 
                        key={q.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: '12px', 
                          padding: '16px', 
                          background: 'white', 
                          borderRadius: '10px',
                          border: '1px solid #DDD6FE',
                        }}
                      >
                        {/* Order controls */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '8px' }}>
                          <button 
                            onClick={() => moveAiQuestion(index, -1)} 
                            disabled={index === 0} 
                            style={{ 
                              padding: '4px', 
                              background: 'transparent', 
                              border: 'none', 
                              cursor: index === 0 ? 'default' : 'pointer', 
                              opacity: index === 0 ? 0.3 : 1,
                              fontSize: '12px',
                            }}
                          >▲</button>
                          <button 
                            onClick={() => moveAiQuestion(index, 1)} 
                            disabled={index === aiQuestions.length - 1} 
                            style={{ 
                              padding: '4px', 
                              background: 'transparent', 
                              border: 'none', 
                              cursor: index === aiQuestions.length - 1 ? 'default' : 'pointer', 
                              opacity: index === aiQuestions.length - 1 ? 0.3 : 1,
                              fontSize: '12px',
                            }}
                          >▼</button>
                        </div>
                        
                        {/* Question number & Type badge */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <span style={{ 
                            width: '28px', 
                            height: '28px', 
                            borderRadius: '50%', 
                            background: '#8B5CF6', 
                            color: 'white', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '13px', 
                            fontWeight: '600',
                          }}>
                            {index + 1}
                          </span>
                          {/* Question type badge */}
                          {q.type && questionTypeBadges[q.type] && (
                            <span style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              background: `${questionTypeBadges[q.type].color}15`,
                              color: questionTypeBadges[q.type].color,
                              borderRadius: '12px',
                              fontSize: '10px',
                              fontWeight: '600',
                              whiteSpace: 'nowrap',
                            }}>
                              <span>{questionTypeBadges[q.type].icon}</span>
                              {questionTypeBadges[q.type].label}
                            </span>
                          )}
                        </div>
                        
                        {/* Editable question textarea */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <textarea
                            value={q.text}
                            onChange={(e) => updateAiQuestion(index, e.target.value)}
                            rows={Math.max(2, Math.ceil(q.text.length / 60) + (q.text.match(/\n/g) || []).length)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px',
                              fontSize: '14px',
                              lineHeight: '1.5',
                              resize: 'vertical',
                              fontFamily: 'inherit',
                            }}
                            placeholder={isEnglish ? 'Edit question...' : 'Soruyu düzenleyin...'}
                          />
                        </div>
                        
                        {/* Time limit selector */}
                        {!useGlobalTimer && (
                          <select
                            value={q.timeLimit}
                            onChange={(e) => updateAiQuestionTimeLimit(index, e.target.value)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #E5E7EB',
                              fontSize: '13px',
                              background: 'white',
                              cursor: 'pointer',
                              flexShrink: 0,
                            }}
                          >
                            {questionDurationOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                          {/* Regenerate button */}
                          <button 
                            onClick={() => handleRegenerateSingle(index)}
                            disabled={regeneratingIndex !== null}
                            title={isEnglish ? 'Regenerate this question' : 'Bu soruyu yeniden oluştur'}
                            style={{ 
                              padding: '8px', 
                              background: regeneratingIndex === index ? '#E5E7EB' : '#EEF2FF', 
                              border: 'none', 
                              borderRadius: '8px', 
                              cursor: regeneratingIndex !== null ? 'not-allowed' : 'pointer', 
                              color: '#6366F1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <RefreshCw 
                              size={16} 
                              style={{ 
                                animation: regeneratingIndex === index ? 'spin 1s linear infinite' : 'none' 
                              }} 
                            />
                          </button>
                          
                          {/* Delete button */}
                          <button 
                            onClick={() => removeAiQuestion(index)} 
                            style={{ 
                              padding: '8px', 
                              background: '#FEE2E2', 
                              border: 'none', 
                              borderRadius: '8px', 
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
              )}
            </div>
          )}

          {/* Timer Settings */}
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
                    ? 'A single timer will run for the entire interview.' 
                    : 'Tüm mülakat için tek bir süre işleyecek. Sorular geçtikçe süre devam edecek.')
                : (isEnglish 
                    ? 'Each question will have its own time limit.' 
                    : 'Her soru için ayrı süre belirlenecek. Sonraki soruya geçildiğinde süre sıfırlanacak.')
              }
            </p>

            {useGlobalTimer ? (
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
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                  <Clock size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  {isEnglish ? 'Duration Per Question' : 'Soru Başına Süre'}
                </label>
                <select 
                  value={durationPerQuestion} 
                  onChange={(e) => {
                    const newDuration = parseInt(e.target.value);
                    setDurationPerQuestion(newDuration);
                    setQuestions(questions.map(q => ({ ...q, timeLimit: newDuration })));
                  }} 
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

          {/* AI Analysis & Voice Response */}
          <div style={{ marginBottom: '20px', display: 'flex', gap: '16px' }}>
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
                {isEnglish ? 'AI will analyze answers and score' : 'AI cevapları analiz edip puan verecek'}
              </p>
            </div>

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
                {isEnglish ? 'Candidates can respond with voice' : 'Adaylar sesli yanıt verebilir (Konuşma-Metin)'}
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

          {/* Manual Questions - Only for Manual tab or Edit mode */}
          {(activeTab === 'manual' || isEdit) && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                {isEnglish ? 'Questions' : 'Sorular'} ({questions.length})
              </label>

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
          )}
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

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default AddEditInterviewTemplateModal;
