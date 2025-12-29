/**
 * Add/Edit Interview Template Modal
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@apollo/client/react';
import { X, Plus, Trash2, GripVertical, Globe, Clock } from 'lucide-react';
import { CREATE_INTERVIEW_TEMPLATE, UPDATE_INTERVIEW_TEMPLATE, GET_INTERVIEW_TEMPLATE } from '../graphql/interviewTemplates';

const AddEditInterviewTemplateModal = ({ isOpen, onClose, onSuccess, template }) => {
  const { t } = useTranslation();
  const isEdit = !!template;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [introText, setIntroText] = useState('');
  const [language, setLanguage] = useState('tr');
  const [durationPerQuestion, setDurationPerQuestion] = useState(120);
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
      setDurationPerQuestion(t.durationPerQuestion || 120);
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
      setDurationPerQuestion(120);
      setQuestions([]);
    }
  }, [templateData, template]);

  const addQuestion = () => {
    if (!newQuestion.trim()) return;
    setQuestions([...questions, {
      id: `new-${Date.now()}`,
      text: newQuestion.trim(),
      order: questions.length + 1,
      timeLimit: durationPerQuestion,
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

  const handleSave = async () => {
    if (!name.trim()) {
      setError(t('interviewTemplateModal.nameRequired'));
      return;
    }
    if (questions.length === 0) {
      setError(t('interviewTemplateModal.questionsRequired'));
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
        questions: questions.map((q, i) => ({
          questionText: q.text,
          questionOrder: i + 1,
          timeLimit: q.timeLimit || durationPerQuestion,
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
            {isEdit ? t('interviewTemplateModal.titleEdit') : t('interviewTemplateModal.titleAdd')}
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
              {t('interviewTemplateModal.templateName')} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('interviewTemplateModal.templateNamePlaceholder')}
              className="text-input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              {t('interviewTemplateModal.description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('interviewTemplateModal.descriptionPlaceholder')}
              className="text-input"
              style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          {/* Language & Duration Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                <Globe size={14} style={{ display: 'inline', marginRight: '6px' }} />
                {t('interviewTemplateModal.language')}
              </label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="text-input" style={{ width: '100%' }}>
                <option value="tr">🇹🇷 Türkçe</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                <Clock size={14} style={{ display: 'inline', marginRight: '6px' }} />
                {t('interviewTemplateModal.durationPerQuestion')}
              </label>
              <select value={durationPerQuestion} onChange={(e) => setDurationPerQuestion(e.target.value)} className="text-input" style={{ width: '100%' }}>
                <option value="60">1 dk</option>
                <option value="90">1.5 dk</option>
                <option value="120">2 dk</option>
                <option value="180">3 dk</option>
                <option value="300">5 dk</option>
              </select>
            </div>
          </div>

          {/* Intro Text */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              {t('interviewTemplateModal.introText')}
            </label>
            <textarea
              value={introText}
              onChange={(e) => setIntroText(e.target.value)}
              placeholder={t('interviewTemplateModal.introTextPlaceholder')}
              className="text-input"
              style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          {/* Questions */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              {t('interviewTemplateModal.questions')} ({questions.length})
            </label>

            {/* Question List */}
            <div style={{ marginBottom: '12px' }}>
              {questions.map((q, index) => (
                <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#F9FAFB', borderRadius: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button onClick={() => moveQuestion(index, -1)} disabled={index === 0} style={{ padding: '2px', background: 'transparent', border: 'none', cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.3 : 1 }}>▲</button>
                    <button onClick={() => moveQuestion(index, 1)} disabled={index === questions.length - 1} style={{ padding: '2px', background: 'transparent', border: 'none', cursor: index === questions.length - 1 ? 'default' : 'pointer', opacity: index === questions.length - 1 ? 0.3 : 1 }}>▼</button>
                  </div>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3B82F6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600' }}>
                    {index + 1}
                  </span>
                  <span style={{ flex: 1, fontSize: '14px', color: '#374151' }}>{q.text}</span>
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
                placeholder={t('interviewTemplateModal.addQuestionPlaceholder')}
                className="text-input"
                style={{ flex: 1 }}
              />
              <button onClick={addQuestion} disabled={!newQuestion.trim()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} />
                {t('interviewTemplateModal.addQuestion')}
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
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEditInterviewTemplateModal;

