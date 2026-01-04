import { useState, useEffect, useRef, useCallback } from 'react';

const translations = {
  tr: {
    liveFeed: 'CANLI YAYIN',
    recording: 'KAYIT YAPILIYOR',
    candidate: 'Aday:',
    question: 'SORU',
    questionProgress: 'Soru',
    yourAnswer: 'CEVABINIZ',
    answerPlaceholder: 'Cevabınızı buraya yazın...',
    speakPlaceholder: 'Konuşmaya başlamak için mikrofon butonuna tıklayın...',
    remainingTime: 'Kalan Süre',
    totalTime: 'Toplam Süre',
    prevQuestion: 'Önceki Soru',
    nextQuestion: 'Sonraki Soru',
    completeInterview: 'Mülakatı Tamamla',
    currentSession: 'MEVCUT OTURUM',
    sessionId: 'ID:',
    startRecording: 'Kayda Başla',
    stopRecording: 'Kaydı Durdur',
    listening: 'Dinleniyor...',
    microphoneActive: 'Mikrofon Aktif',
    speechNotSupported: 'Tarayıcınız sesli yanıt özelliğini desteklemiyor. Yazarak yanıt verebilirsiniz.',
    recordingNotSupported: 'Tarayıcınız video kaydı özelliğini desteklemiyor.',
    permissionDenied: 'Kamera/mikrofon izni reddedildi.',
  },
  en: {
    liveFeed: 'LIVE FEED',
    recording: 'RECORDING',
    candidate: 'Candidate:',
    question: 'QUESTION',
    questionProgress: 'Question',
    yourAnswer: 'YOUR ANSWER',
    answerPlaceholder: 'Type your answer here...',
    speakPlaceholder: 'Click the microphone button to start speaking...',
    remainingTime: 'Remaining Time',
    totalTime: 'Total Time',
    prevQuestion: 'Previous Question',
    nextQuestion: 'Next Question',
    completeInterview: 'Complete Interview',
    currentSession: 'CURRENT SESSION',
    sessionId: 'ID:',
    startRecording: 'Start Recording',
    stopRecording: 'Stop Recording',
    listening: 'Listening...',
    microphoneActive: 'Microphone Active',
    speechNotSupported: 'Your browser does not support voice response. You can type your answer instead.',
    recordingNotSupported: 'Your browser does not support video recording.',
    permissionDenied: 'Camera/microphone permission denied.',
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
  globalTimeRemaining,
  template, // Template with voiceResponseEnabled
  onBrowserSupportUpdate, // Callback to update browser support status
}) => {
  const t = translations[language] || translations.tr;
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const recordedChunksRef = useRef([]);
  
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sttSupported, setSttSupported] = useState(true);
  const [recordingSupported, setRecordingSupported] = useState(true);
  const [videoBlobs, setVideoBlobs] = useState({}); // Store video blobs per question
  
  const timerRef = useRef(null);
  
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  const useGlobalTimer = job?.useGlobalTimer || false;
  const voiceResponseEnabled = template?.voiceResponseEnabled || false;
  
  const sessionId = sessionToken ? `#${sessionToken.substring(0, 8).toUpperCase()}` : '';

  // Check browser support on mount
  useEffect(() => {
    const speechSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const mediaRecorderSupported = 'MediaRecorder' in window;
    
    setSttSupported(speechSupported);
    setRecordingSupported(mediaRecorderSupported);
    
    // Notify parent about browser support
    if (onBrowserSupportUpdate) {
      const unsupportedFeatures = [];
      if (!speechSupported) unsupportedFeatures.push('SpeechRecognition');
      if (!mediaRecorderSupported) unsupportedFeatures.push('MediaRecorder');
      onBrowserSupportUpdate(unsupportedFeatures);
    }
  }, [onBrowserSupportUpdate]);

  // Initialize video stream
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!voiceResponseEnabled || !sttSupported) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === 'en' ? 'en-US' : 'tr-TR';
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript = transcript;
        }
      }
      
      if (finalTranscript) {
        setCurrentAnswer(prev => prev + finalTranscript);
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setSttSupported(false);
      }
      setIsListening(false);
    };
    
    recognition.onend = () => {
      // Restart if still supposed to be listening
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.log('Recognition restart failed:', e);
        }
      }
    };
    
    recognitionRef.current = recognition;
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [voiceResponseEnabled, sttSupported, language, isListening]);

  // Start/stop video recording when question changes
  useEffect(() => {
    if (!recordingSupported || !mediaStream) return;
    
    // Stop previous recording if exists
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Start new recording for this question
    recordedChunksRef.current = [];
    
    try {
      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        if (recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          setVideoBlobs(prev => ({
            ...prev,
            [currentQuestion?.id]: blob
          }));
        }
      };
      
      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (e) {
      console.error('Failed to start recording:', e);
      setRecordingSupported(false);
    }
    
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [currentQuestionIndex, mediaStream, recordingSupported]);

  // Initialize answer and timer when question changes
  useEffect(() => {
    if (currentQuestion) {
      setCurrentAnswer(answers[currentQuestion.id] || '');
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (!useGlobalTimer) {
        const timeLimit = currentQuestion.timeLimit || job?.interviewDurationPerQuestion || 120;
        setQuestionTimeRemaining(timeLimit);
        
        timerRef.current = setInterval(() => {
          setQuestionTimeRemaining(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              timerRef.current = null;
              setTimeout(() => {
                if (currentQuestionIndex < questions.length - 1) {
                  handleSaveAndNext();
                }
              }, 0);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentQuestionIndex, useGlobalTimer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleAnswerChange = (e) => {
    setCurrentAnswer(e.target.value);
  };

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  }, [isListening]);

  // Helper function to stop recording and get the video blob
  const stopRecordingAndGetBlob = () => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        resolve(null);
        return;
      }
      
      const currentRecorder = mediaRecorderRef.current;
      const originalOnStop = currentRecorder.onstop;
      
      currentRecorder.onstop = () => {
        // Call original onstop to save blob to state
        if (originalOnStop) originalOnStop.call(currentRecorder);
        
        // Create blob and resolve
        if (recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          resolve(blob);
        } else {
          resolve(null);
        }
      };
      
      currentRecorder.stop();
    });
  };

  const handleSaveAndNext = async () => {
    // Stop listening
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
      setIsListening(false);
    }
    
    // Stop recording and wait for blob
    const videoBlob = await stopRecordingAndGetBlob();
    
    // Save answer with video blob
    if (currentQuestion) {
      await onSaveAnswer(currentQuestion.id, currentAnswer || '', videoBlob);
    }
    
    if (!isLastQuestion) {
      onNext();
    }
  };

  const handleSaveAndPrev = async () => {
    // Stop listening
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
      setIsListening(false);
    }
    
    // Stop recording and wait for blob
    const videoBlob = await stopRecordingAndGetBlob();
    
    if (currentQuestion) {
      await onSaveAnswer(currentQuestion.id, currentAnswer || '', videoBlob);
    }
    onPrev();
  };

  const handleComplete = async () => {
    // Stop listening
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
      setIsListening(false);
    }
    
    // Stop recording and wait for blob
    const videoBlob = await stopRecordingAndGetBlob();
    
    if (currentQuestion) {
      await onSaveAnswer(currentQuestion.id, currentAnswer || '', videoBlob);
    }
    onComplete();
  };

  const displayTime = useGlobalTimer ? (globalTimeRemaining || 0) : questionTimeRemaining;
  const timerLabel = useGlobalTimer ? t.totalTime : t.remainingTime;
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
            <div className="live-badge" style={{ 
              background: isRecording ? 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)' : undefined 
            }}>
              <span className="live-dot" style={{ 
                background: isRecording ? '#FEE2E2' : undefined,
                animation: isRecording ? 'pulse 1s infinite' : undefined
              }} />
              {isRecording ? t.recording : t.liveFeed}
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
              <div className="audio-bar" style={{ height: isListening ? '20px' : '12px', background: isListening ? '#10B981' : undefined }} />
              <div className="audio-bar" style={{ height: isListening ? '28px' : '18px', background: isListening ? '#10B981' : undefined }} />
              <div className="audio-bar" style={{ height: isListening ? '36px' : '24px', background: isListening ? '#10B981' : undefined }} />
              <div className="audio-bar" style={{ height: isListening ? '24px' : '16px', background: isListening ? '#10B981' : undefined }} />
              <div className="audio-bar" style={{ height: isListening ? '32px' : '20px', background: isListening ? '#10B981' : undefined }} />
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="answer-label">{t.yourAnswer}</label>
                
                {/* Voice Response Controls */}
                {voiceResponseEnabled && sttSupported && (
                  <button
                    onClick={toggleListening}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 16px',
                      background: isListening 
                        ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' 
                        : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isListening ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                    {isListening ? t.listening : t.microphoneActive}
                  </button>
                )}
              </div>
              
              {/* Warning for unsupported STT */}
              {voiceResponseEnabled && !sttSupported && (
                <div style={{
                  background: '#FEF3C7',
                  color: '#92400E',
                  padding: '12px 16px',
                  borderRadius: 8,
                  marginBottom: 12,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  {t.speechNotSupported}
                </div>
              )}
              
              <textarea
                className="answer-textarea"
                value={currentAnswer}
                onChange={handleAnswerChange}
                placeholder={voiceResponseEnabled && sttSupported ? t.speakPlaceholder : t.answerPlaceholder}
                style={{
                  borderColor: isListening ? '#10B981' : undefined,
                  boxShadow: isListening ? '0 0 0 3px rgba(16, 185, 129, 0.1)' : undefined,
                }}
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
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default InterviewScreen;
