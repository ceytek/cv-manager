/**
 * Likert Test Page - Personality/Fit Assessment
 * Multi-step flow: Welcome -> Agreement -> Test -> Completed
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_LIKERT_SESSION, START_LIKERT_SESSION, SAVE_LIKERT_ANSWER, COMPLETE_LIKERT_SESSION } from '../../graphql/likert';
import './LikertPage.css';

// Translations based on template language
const translations = {
  tr: {
    loading: 'Yükleniyor...',
    error: 'Bir hata oluştu',
    notFound: 'Test Bulunamadı',
    notFoundDesc: 'Bu test bağlantısı geçerli değil veya süresi dolmuş olabilir.',
    expired: 'Test Süresi Doldu',
    expiredDesc: 'Bu test bağlantısının süresi dolmuş. Lütfen İK ekibiyle iletişime geçin.',
    alreadyCompleted: 'Test Tamamlandı',
    alreadyCompletedDesc: 'Bu testi daha önce tamamladınız.',
    welcome: 'Hoş Geldiniz',
    personalityTest: 'Kişilik/Uyum Testi',
    position: 'Pozisyon',
    numberOfQuestions: 'Soru Sayısı',
    questions: 'Soru',
    scaleType: 'Ölçek Tipi',
    point: 'Puan',
    estimatedTime: 'Tahmini Süre',
    minutes: 'dakika',
    aboutTest: 'Test Hakkında:',
    aboutTestDesc: 'Bu test, kişilik özelliklerinizi ve pozisyona uygunluğunuzu değerlendirmek için tasarlanmıştır. Her ifade için en uygun seçeneği işaretleyin. Doğru veya yanlış cevap yoktur, lütfen dürüstçe yanıtlayın.',
    startTest: 'Teste Başla',
    privacyAgreement: 'Gizlilik Sözleşmesi',
    pleaseRead: 'Devam etmeden önce aşağıdaki metni okuyun',
    iAgree: 'Yukarıdaki metni okudum ve kabul ediyorum. Verilerimin işlenmesine onay veriyorum.',
    continue: 'Devam',
    progress: 'İlerleme',
    question: 'Soru',
    required: 'Zorunlu',
    completeTest: 'Testi Tamamla',
    congratulations: 'Tebrikler!',
    successMessage: 'Kişilik/Uyum testini başarıyla tamamladınız.',
    nextSteps: 'Sonraki Adımlar',
    nextStep1: 'Yanıtlarınız İK ekibine iletildi',
    nextStep2: 'Değerlendirme sonuçları en kısa sürede paylaşılacak',
    nextStep3: 'Süreç hakkında e-posta ile bilgilendirileceksiniz',
    appliedPosition: 'Başvurulan Pozisyon:',
    stronglyDisagree: 'Kesinlikle Katılmıyorum',
    disagree: 'Katılmıyorum',
    neutral: 'Kararsızım',
    agree: 'Katılıyorum',
    stronglyAgree: 'Kesinlikle Katılıyorum',
    timeRemaining: 'Kalan Süre',
    timeLimit: 'Süre Sınırı',
    timeUp: 'Süre Doldu',
    timeUpDesc: 'Test süresi doldu. Cevaplarınız otomatik olarak kaydedildi.',
  },
  en: {
    loading: 'Loading...',
    error: 'An error occurred',
    notFound: 'Test Not Found',
    notFoundDesc: 'This test link is not valid or may have expired.',
    expired: 'Test Expired',
    expiredDesc: 'This test link has expired. Please contact the HR team.',
    alreadyCompleted: 'Test Completed',
    alreadyCompletedDesc: 'You have already completed this test.',
    welcome: 'Welcome',
    personalityTest: 'Personality/Fit Test',
    position: 'Position',
    numberOfQuestions: 'Number of Questions',
    questions: 'Questions',
    scaleType: 'Scale Type',
    point: 'Point',
    estimatedTime: 'Estimated Time',
    minutes: 'minutes',
    aboutTest: 'About the Test:',
    aboutTestDesc: 'This test is designed to evaluate your personality traits and your fit for the position. Select the most appropriate option for each statement. There are no right or wrong answers, please respond honestly.',
    startTest: 'Start Test',
    privacyAgreement: 'Privacy Agreement',
    pleaseRead: 'Please read the following text before continuing',
    iAgree: 'I have read and accept the above text. I consent to the processing of my data.',
    continue: 'Continue',
    progress: 'Progress',
    question: 'Question',
    required: 'Required',
    completeTest: 'Complete Test',
    congratulations: 'Congratulations!',
    successMessage: 'You have successfully completed the Personality/Fit test.',
    nextSteps: 'Next Steps',
    nextStep1: 'Your answers have been sent to the HR team',
    nextStep2: 'Evaluation results will be shared as soon as possible',
    nextStep3: 'You will be notified via email about the process',
    appliedPosition: 'Applied Position:',
    stronglyDisagree: 'Strongly Disagree',
    disagree: 'Disagree',
    neutral: 'Neutral',
    agree: 'Agree',
    stronglyAgree: 'Strongly Agree',
    timeRemaining: 'Time Remaining',
    timeLimit: 'Time Limit',
    timeUp: 'Time Up',
    timeUpDesc: 'The test time has expired. Your answers have been automatically saved.',
  }
};

const LikertPage = ({ token }) => {
  const [step, setStep] = useState('loading'); // loading, welcome, agreement, test, completed, error, expired, timeup
  const [language, setLanguage] = useState('tr');
  const [answers, setAnswers] = useState({});
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null); // in seconds
  const timerRef = useRef(null);

  const t = translations[language] || translations.tr;

  // Fetch session data
  const { data, loading, error } = useQuery(GET_LIKERT_SESSION, {
    variables: { token },
    skip: !token,
    fetchPolicy: 'network-only',
  });

  // Mutations
  const [startSession] = useMutation(START_LIKERT_SESSION);
  const [saveAnswer] = useMutation(SAVE_LIKERT_ANSWER);
  const [completeSession] = useMutation(COMPLETE_LIKERT_SESSION);

  // Auto-complete when timer runs out
  const handleAutoComplete = useCallback(async () => {
    setSubmitting(true);
    try {
      await completeSession({ variables: { token } });
      setStep('timeup');
    } catch (err) {
      console.error('Auto-complete error:', err);
      setStep('timeup');
    } finally {
      setSubmitting(false);
    }
  }, [completeSession, token]);

  // Timer countdown effect
  useEffect(() => {
    if (step === 'test' && timeRemaining !== null && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [step, timeRemaining, handleAutoComplete]);

  // Format time for display (mm:ss or hh:mm:ss)
  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Handle data changes
  useEffect(() => {
    if (!loading && !error && data?.likertSession) {
      const session = data.likertSession;
      const lang = session.template?.language?.toLowerCase() || 'tr';
      setLanguage(lang === 'english' || lang === 'en' ? 'en' : 'tr');

      if (session.status === 'completed') {
        setStep('completed');
      } else if (session.status === 'expired' || new Date(session.expiresAt) < new Date()) {
        setStep('expired');
      } else if (session.status === 'in_progress') {
        // Calculate remaining time for resumed sessions
        if (session.template?.timeLimit && session.startedAt) {
          const startedTime = new Date(session.startedAt).getTime();
          const currentTime = new Date().getTime();
          const elapsedSeconds = Math.floor((currentTime - startedTime) / 1000);
          const remaining = session.template.timeLimit - elapsedSeconds;
          if (remaining > 0) {
            setTimeRemaining(remaining);
          } else {
            // Time already expired
            setTimeRemaining(0);
          }
        }
        setStep('test');
      } else {
        setStep('welcome');
      }
    } else if (!loading && !error && !data?.likertSession) {
      setStep('error');
    } else if (!loading && error) {
      setStep('error');
    }
  }, [loading, error, data]);

  const session = data?.likertSession;
  const template = session?.template;
  const job = session?.job;
  const candidate = session?.candidate;
  const questions = template?.questions || [];
  const scaleLabels = template?.scaleLabels || [t.stronglyDisagree, t.disagree, t.neutral, t.agree, t.stronglyAgree];
  const scaleType = template?.scaleType || 5;
  const hasAgreement = job?.agreementTemplate?.content;

  // Calculate estimated time (~30 seconds per question)
  const estimatedMinutes = Math.ceil(questions.length * 0.5);

  const handleStartTest = async () => {
    try {
      await startSession({ variables: { token } });
      // Initialize timer if timeLimit exists
      if (template?.timeLimit) {
        setTimeRemaining(template.timeLimit);
      }
      if (hasAgreement) {
        setStep('agreement');
      } else {
        setStep('test');
      }
    } catch (err) {
      console.error('Start session error:', err);
      // Initialize timer even on error
      if (template?.timeLimit) {
        setTimeRemaining(template.timeLimit);
      }
      setStep('test'); // Continue anyway
    }
  };

  const handleAcceptAgreement = () => {
    setStep('test');
  };

  const handleAnswer = async (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    // Save answer to backend
    try {
      await saveAnswer({
        variables: {
          sessionToken: token,
          questionId,
          score: value,
        },
      });
    } catch (err) {
      console.error('Save answer error:', err);
    }
  };

  const handleCompleteTest = async () => {
    setSubmitting(true);
    try {
      await completeSession({ variables: { token } });
      setStep('completed');
    } catch (err) {
      console.error('Complete session error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const allAnswered = questions.every(q => answers[q.id] !== undefined);
  const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  // Loading Screen
  if (loading || step === 'loading') {
    return (
      <div className="likert-page">
        <div className="likert-loading-screen">
          <div className="likert-spinner"></div>
          <p>{t.loading}</p>
        </div>
      </div>
    );
  }

  // Error Screen
  if (step === 'error') {
    return (
      <div className="likert-page">
        <div className="likert-message-screen">
          <div className="likert-message-card">
            <div className="likert-icon likert-icon-error">❌</div>
            <h2>{t.notFound}</h2>
            <p>{error?.message || t.notFoundDesc}</p>
          </div>
        </div>
      </div>
    );
  }

  // Expired Screen
  if (step === 'expired') {
    return (
      <div className="likert-page">
        <div className="likert-message-screen">
          <div className="likert-message-card">
            <div className="likert-icon likert-icon-warning">⏰</div>
            <h2>{t.expired}</h2>
            <p>{t.expiredDesc}</p>
          </div>
        </div>
      </div>
    );
  }

  // Welcome Screen
  if (step === 'welcome') {
    return (
      <div className="likert-page">
        <div className="likert-welcome-screen">
          <div className="likert-welcome-card">
            <h1 className="likert-welcome-title">{t.welcome}, {candidate?.name?.split(' ')[0] || 'User'}!</h1>
            <p className="likert-welcome-subtitle">{t.personalityTest}</p>

            <div className="likert-info-grid">
              <div className="likert-info-card">
                <div className="likert-info-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
                <div className="likert-info-content">
                  <span className="likert-info-label">{t.position}</span>
                  <span className="likert-info-value">{job?.title || '-'}</span>
                </div>
              </div>

              <div className="likert-info-card">
                <div className="likert-info-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="4" y1="9" x2="20" y2="9"></line>
                    <line x1="4" y1="15" x2="20" y2="15"></line>
                    <line x1="10" y1="3" x2="8" y2="21"></line>
                    <line x1="16" y1="3" x2="14" y2="21"></line>
                  </svg>
                </div>
                <div className="likert-info-content">
                  <span className="likert-info-label">{t.numberOfQuestions}</span>
                  <span className="likert-info-value">{questions.length} {t.questions}</span>
                </div>
              </div>

              <div className="likert-info-card">
                <div className="likert-info-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div className="likert-info-content">
                  <span className="likert-info-label">{t.scaleType}</span>
                  <span className="likert-info-value">{scaleType} {t.point}</span>
                </div>
              </div>

              <div className="likert-info-card">
                <div className="likert-info-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div className="likert-info-content">
                  <span className="likert-info-label">
                    {template?.timeLimit ? t.timeLimit : t.estimatedTime}
                  </span>
                  <span className="likert-info-value">
                    {template?.timeLimit 
                      ? `${Math.floor(template.timeLimit / 60)} ${t.minutes}`
                      : `~${estimatedMinutes} ${t.minutes}`
                    }
                  </span>
                </div>
              </div>
            </div>

            {template?.description && (
              <div className="likert-description-box">
                <p>{template.description}</p>
              </div>
            )}

            <div className="likert-about-box">
              <p><strong>📋 {t.aboutTest}</strong> {t.aboutTestDesc}</p>
            </div>

            <button className="likert-start-btn" onClick={handleStartTest}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              {t.startTest}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Agreement Screen
  if (step === 'agreement') {
    return (
      <div className="likert-page">
        <div className="likert-header-bar">
          <div className="likert-header-content">
            <span className="likert-header-icon">📋</span>
            <span className="likert-header-title">{template?.name}</span>
          </div>
          <div className="likert-header-user">
            <span className="likert-header-user-icon">👤</span>
            <span>{candidate?.name}</span>
          </div>
        </div>
        
        <div className="likert-agreement-screen">
          <div className="likert-agreement-card">
            <h2 className="likert-agreement-title">{t.privacyAgreement}</h2>
            <p className="likert-agreement-subtitle">{t.pleaseRead}</p>

            <div className="likert-agreement-content">
              <div className="likert-agreement-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span>{job?.agreementTemplate?.name || 'Agreement'}</span>
              </div>
              <div className="likert-agreement-text">
                {job?.agreementTemplate?.content || ''}
              </div>
            </div>

            <label className="likert-agreement-checkbox">
              <input
                type="checkbox"
                checked={agreementAccepted}
                onChange={(e) => setAgreementAccepted(e.target.checked)}
              />
              <span className="likert-checkbox-mark"></span>
              <span>{t.iAgree}</span>
            </label>

            <button
              className="likert-continue-btn"
              onClick={handleAcceptAgreement}
              disabled={!agreementAccepted}
            >
              {t.continue}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Time Up Screen
  if (step === 'timeup') {
    return (
      <div className="likert-page">
        <div className="likert-message-screen">
          <div className="likert-message-card">
            <div className="likert-icon likert-icon-warning">⏰</div>
            <h2>{t.timeUp}</h2>
            <p>{t.timeUpDesc}</p>
            <div className="likert-applied-position" style={{ marginTop: 24 }}>
              <strong>{t.appliedPosition}</strong> {job?.title || '-'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Test Screen
  if (step === 'test') {
    const hasTimer = timeRemaining !== null && template?.timeLimit;
    const isLowTime = timeRemaining !== null && timeRemaining <= 60; // Last minute warning
    
    return (
      <div className="likert-page">
        <div className="likert-header-bar">
          <div className="likert-header-content">
            <span className="likert-header-icon">📋</span>
            <span className="likert-header-title">{template?.name}</span>
          </div>
          <div className="likert-header-right">
            {/* Timer Display */}
            {hasTimer && (
              <div className={`likert-header-timer ${isLowTime ? 'timer-warning' : ''}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>{formatTime(timeRemaining)}</span>
              </div>
            )}
            <div className="likert-header-user">
              <span className="likert-header-user-icon">👤</span>
              <span>{candidate?.name}</span>
            </div>
            <div className="likert-header-questions">
              <span className="likert-header-hash">#</span>
              <span>{questions.length} {t.questions}</span>
            </div>
          </div>
        </div>
        
        <div className="likert-test-screen">
          <div className="likert-test-container">
            {/* Progress Bar */}
            <div className="likert-progress-card">
              <div className="likert-progress-header">
                <span>{t.progress}</span>
                <span className="likert-progress-count">{answeredCount} / {questions.length} {t.questions.toLowerCase()}</span>
              </div>
              <div className="likert-progress-bar">
                <div className="likert-progress-fill" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>

            {/* Questions */}
            <div className="likert-questions-list">
              {questions.map((question, index) => {
                const isAnswered = answers[question.id] !== undefined;
                return (
                  <div key={question.id} className={`likert-question-card ${isAnswered ? 'answered' : ''}`}>
                    <div className="likert-question-header">
                      <span className="likert-question-number">{t.question} {index + 1}</span>
                      <span className="likert-question-required">{t.required}</span>
                      {isAnswered && (
                        <span className="likert-question-check">✓</span>
                      )}
                    </div>
                    
                    <div className="likert-question-body">
                      <p className="likert-question-text">{question.questionText}</p>
                      
                      <div className="likert-scale-labels">
                        {scaleLabels.map((label, i) => (
                          <span key={i} className="likert-scale-label">{label}</span>
                        ))}
                      </div>
                      
                      <div className="likert-scale-options">
                        {scaleLabels.map((label, i) => {
                          const value = i + 1;
                          const isSelected = answers[question.id] === value;
                          return (
                            <button
                              key={i}
                              className={`likert-scale-option ${isSelected ? 'selected' : ''}`}
                              onClick={() => handleAnswer(question.id, value)}
                            >
                              <span className="likert-option-number">{value}</span>
                              <span className="likert-option-label">{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Complete Button */}
            <div className="likert-complete-section">
              <button
                className="likert-complete-btn"
                onClick={handleCompleteTest}
                disabled={!allAnswered || submitting}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                {submitting ? t.loading : t.completeTest}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Completed Screen
  if (step === 'completed') {
    return (
      <div className="likert-page">
        <div className="likert-header-bar">
          <div className="likert-header-content">
            <span className="likert-header-icon">📋</span>
            <span className="likert-header-title">{template?.name}</span>
          </div>
          <div className="likert-header-right">
            <div className="likert-header-user">
              <span className="likert-header-user-icon">👤</span>
              <span>{candidate?.name}</span>
            </div>
            <div className="likert-header-questions">
              <span className="likert-header-hash">#</span>
              <span>{questions.length} {t.questions}</span>
            </div>
          </div>
        </div>
        
        <div className="likert-completed-screen">
          <div className="likert-completed-card">
            <div className="likert-success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            
            <h2 className="likert-completed-title">{t.congratulations} 🎉</h2>
            <p className="likert-completed-message">{t.successMessage}</p>

            <div className="likert-next-steps">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                {t.nextSteps}
              </h3>
              <ul>
                <li>{t.nextStep1}</li>
                <li>{t.nextStep2}</li>
                <li>{t.nextStep3}</li>
              </ul>
            </div>

            <div className="likert-applied-position">
              <strong>{t.appliedPosition}</strong> {job?.title || '-'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default LikertPage;
