import { useState, useEffect, useRef } from 'react';

const translations = {
  tr: {
    liveFeed: 'LIVE FEED',
    candidate: 'Aday:',
    question: 'SORU',
    questionProgress: 'Soru',
    yourAnswer: 'CEVABINIZ',
    answerPlaceholder: 'Cevabınızı buraya yazın...',
    remainingTime: 'Kalan Süre',
    totalTime: 'Toplam Süre',
    prevQuestion: 'Önceki Soru',
    nextQuestion: 'Sonraki Soru',
    completeInterview: 'Mülakatı Tamamla',
    currentSession: 'MEVCUT OTURUM',
    sessionId: 'ID:'
  },
  en: {
    liveFeed: 'LIVE FEED',
    candidate: 'Candidate:',
    question: 'QUESTION',
    questionProgress: 'Question',
    yourAnswer: 'YOUR ANSWER',
    answerPlaceholder: 'Type your answer here...',
    remainingTime: 'Remaining Time',
    totalTime: 'Total Time',
    prevQuestion: 'Previous Question',
    nextQuestion: 'Next Question',
    completeInterview: 'Complete Interview',
    currentSession: 'CURRENT SESSION',
    sessionId: 'ID:'
  }
};

const InterviewScreen = ({
  job,
  candidate,
  questions,
  currentQuestionIndex,
  answers,
  mediaStream,
  language = 'tr',
  onSaveAnswer,
  onNext,
  onPrev,
  onComplete,
  sessionToken,
  globalTimeRemaining,  // Global timer (passed from parent when useGlobalTimer is true)
  onGlobalTimerEnd,     // Callback when global timer runs out
}) => {
  const t = translations[language] || translations.tr;
  const videoRef = useRef(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState(0);
  const timerRef = useRef(null);
  
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  // Check if using global timer (field names from GraphQL: useGlobalTimer, totalDuration)
  const useGlobalTimer = job?.useGlobalTimer || false;
  
  // Session ID for display (shortened token)
  const sessionId = sessionToken ? `#${sessionToken.substring(0, 8).toUpperCase()}` : '';

  // Initialize video stream
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  // Initialize answer and timer when question changes
  useEffect(() => {
    if (currentQuestion) {
      setCurrentAnswer(answers[currentQuestion.id] || '');
      
      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Only set and start question timer if NOT using global timer
      if (!useGlobalTimer) {
        const timeLimit = currentQuestion.timeLimit || job?.interviewDurationPerQuestion || 120;
        setQuestionTimeRemaining(timeLimit);
        
        // Start the countdown timer immediately
        timerRef.current = setInterval(() => {
          setQuestionTimeRemaining(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              timerRef.current = null;
              // Auto-advance when time runs out
              setTimeout(() => {
                if (currentQuestionIndex < questions.length - 1) {
                  onSaveAnswer(currentQuestion.id, '');
                  onNext();
                }
              }, 0);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
    
    // Cleanup on unmount or question change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentQuestionIndex, useGlobalTimer]); // Only depend on question index and global timer mode

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleAnswerChange = (e) => {
    setCurrentAnswer(e.target.value);
  };

  const handleSaveAndNext = () => {
    // Save answer (even if empty, to track question was viewed)
    if (currentQuestion) {
      onSaveAnswer(currentQuestion.id, currentAnswer || '');
    }
    
    if (!isLastQuestion) {
      onNext();
    }
  };

  const handleSaveAndPrev = () => {
    if (currentQuestion) {
      onSaveAnswer(currentQuestion.id, currentAnswer || '');
    }
    onPrev();
  };

  const handleComplete = () => {
    if (currentQuestion) {
      onSaveAnswer(currentQuestion.id, currentAnswer || '');
    }
    onComplete();
  };

  // Get the time to display (global or per-question)
  const displayTime = useGlobalTimer ? (globalTimeRemaining || 0) : questionTimeRemaining;
  const timerLabel = useGlobalTimer ? t.totalTime : t.remainingTime;
  
  // Timer color - turns red when low
  const isTimeLow = displayTime < 60;

  return (
    <div className="interview-screen">
      {/* Header */}
      <header className="interview-header">
        <div className="interview-header-left">
          <div className="interview-header-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <span className="interview-header-title">AI Mülakat Sistemi</span>
        </div>
        
        <div className="interview-header-center">
          <span className="interview-progress-text">
            {t.questionProgress} {currentQuestionIndex + 1} / {questions.length}
          </span>
          <div className="interview-progress-bar">
            <div className="interview-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span>{Math.round(progress)}%</span>
        </div>
        
        <div className="interview-header-right">
          <span className="session-id">{t.currentSession}</span>
          <span className="session-id" style={{ fontWeight: 600 }}>{t.sessionId} {sessionId}</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="interview-screen-content">
        {/* Left Panel - Video and Timer */}
        <div className="interview-left-panel">
          <div className="interview-card interview-job-info">
            <h2 className="interview-job-title">{job?.title}</h2>
            <div className="interview-candidate-name">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {t.candidate} {candidate?.name}
            </div>
          </div>
          
          <div className="interview-video-card">
            <div className="live-badge">
              <span className="live-dot" />
              {t.liveFeed}
            </div>
            <video 
              ref={videoRef}
              className="interview-video"
              autoPlay 
              playsInline 
              muted
              style={{ transform: 'scaleX(-1)' }}
            />
            <div className="audio-indicator">
              <div className="audio-bar" style={{ height: '12px' }} />
              <div className="audio-bar" style={{ height: '18px' }} />
              <div className="audio-bar" style={{ height: '24px' }} />
              <div className="audio-bar" style={{ height: '16px' }} />
              <div className="audio-bar" style={{ height: '20px' }} />
            </div>
          </div>
          
          <div className="interview-timer-card" style={{ 
            background: isTimeLow ? 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)' : undefined 
          }}>
            <div>
              <div className="timer-label" style={{ color: isTimeLow ? '#DC2626' : undefined }}>
                {timerLabel}
              </div>
              <div className="timer-value" style={{ color: isTimeLow ? '#DC2626' : undefined }}>
                {formatTime(displayTime)}
              </div>
            </div>
            <div className="timer-icon" style={{ color: isTimeLow ? '#DC2626' : undefined }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Panel - Question and Answer */}
        <div className="interview-right-panel">
          <div className="interview-question-card">
            <div className="question-header">
              <span className="question-badge">
                📝 {t.question}
              </span>
            </div>
            
            <div className="question-content">
              <p className="question-text">{currentQuestion?.questionText}</p>
            </div>
            
            <div className="answer-section">
              <label className="answer-label">{t.yourAnswer}</label>
              <textarea
                className="answer-textarea"
                value={currentAnswer}
                onChange={handleAnswerChange}
                placeholder={t.answerPlaceholder}
              />
            </div>
          </div>
          
          <div className="interview-nav">
            <button 
              className="interview-nav-btn prev"
              onClick={handleSaveAndPrev}
              disabled={isFirstQuestion}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              {t.prevQuestion}
            </button>
            
            {isLastQuestion ? (
              <button 
                className="interview-nav-btn complete"
                onClick={handleComplete}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
                {t.completeInterview}
              </button>
            ) : (
              <button 
                className="interview-nav-btn next"
                onClick={handleSaveAndNext}
              >
                {t.nextQuestion}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewScreen;
