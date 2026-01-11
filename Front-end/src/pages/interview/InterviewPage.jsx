import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { 
  GET_INTERVIEW_SESSION, 
  START_INTERVIEW_SESSION, 
  SAVE_INTERVIEW_ANSWER, 
  COMPLETE_INTERVIEW_SESSION,
  ACCEPT_INTERVIEW_AGREEMENT,
  UPDATE_BROWSER_STT_SUPPORT
} from '../../graphql/interview';
import { API_BASE_URL } from '../../config/api';
import WelcomeScreen from './components/WelcomeScreen';
import CameraTestScreen from './components/CameraTestScreen';
import AgreementScreen from './components/AgreementScreen';
import InterviewScreen from './components/InterviewScreen';
import CompletedScreen from './components/CompletedScreen';
import LoadingScreen from './components/LoadingScreen';
import ErrorScreen from './components/ErrorScreen';
import ExpiredScreen from './components/ExpiredScreen';
import './InterviewPage.css';

// Multi-language text definitions
const translations = {
  tr: {
    loading: 'Yükleniyor...',
    error: 'Bir hata oluştu',
    expired: 'Mülakat Süresi Doldu',
    expiredDesc: 'Bu mülakat bağlantısının süresi dolmuş. Lütfen İK ekibiyle iletişime geçin.',
    completed: 'Mülakat Tamamlandı',
    completedDesc: 'Mülakatınızı daha önce tamamladınız. Teşekkür ederiz!',
    notFound: 'Mülakat Bulunamadı',
    notFoundDesc: 'Bu mülakat bağlantısı geçerli değil.',
    saving: 'Cevaplarınız Kaydediliyor',
    savingDesc: 'Lütfen bekleyin, video ve cevaplarınız kaydediliyor...',
  },
  en: {
    loading: 'Loading...',
    error: 'An error occurred',
    expired: 'Interview Expired',
    expiredDesc: 'This interview link has expired. Please contact the HR team.',
    completed: 'Interview Completed',
    completedDesc: 'You have already completed this interview. Thank you!',
    notFound: 'Interview Not Found',
    notFoundDesc: 'This interview link is not valid.',
    saving: 'Saving Your Answers',
    savingDesc: 'Please wait, your video and answers are being saved...',
  }
};

const InterviewPage = ({ token }) => {
  const [step, setStep] = useState('loading');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [language, setLanguage] = useState('tr');
  const [mediaStream, setMediaStream] = useState(null);
  const [globalTimeRemaining, setGlobalTimeRemaining] = useState(null);
  const [browserUnsupportedFeatures, setBrowserUnsupportedFeatures] = useState([]);
  const globalTimerRef = useRef(null);
  
  const t = translations[language] || translations.tr;

  // Fetch interview session
  const { data, loading, error } = useQuery(GET_INTERVIEW_SESSION, {
    variables: { token },
    skip: !token,
    fetchPolicy: 'network-only',
  });

  // Mutations
  const [startSession] = useMutation(START_INTERVIEW_SESSION);
  const [saveAnswer] = useMutation(SAVE_INTERVIEW_ANSWER);
  const [completeSession] = useMutation(COMPLETE_INTERVIEW_SESSION);
  const [acceptAgreement] = useMutation(ACCEPT_INTERVIEW_AGREEMENT);
  const [updateBrowserSttSupport] = useMutation(UPDATE_BROWSER_STT_SUPPORT);

  const session = data?.interviewSession;
  const template = session?.template;
  const job = session?.job;
  const candidate = session?.candidate;
  const questions = session?.questions || [];

  // Handle completing interview (using useCallback to use in useEffect)
  // Can be called with or without final answer data
  const handleCompleteInterview = useCallback(async (finalQuestionId, finalAnswerText, finalVideoBlob) => {
    try {
      // Show saving screen first
      setStep('saving');
      
      // If we have final answer data, save it first
      if (finalQuestionId) {
        console.log('Saving final answer before completing...');
        
        // Upload video if exists
        let videoUrl = null;
        if (finalVideoBlob && finalVideoBlob.size > 0) {
          try {
            console.log('Uploading final video:', finalVideoBlob.size, 'bytes');
            const formData = new FormData();
            formData.append('video', finalVideoBlob, `interview_${token}_${finalQuestionId}.webm`);
            formData.append('token', token);
            formData.append('questionId', finalQuestionId);
            
            const uploadResponse = await fetch(`${API_BASE_URL}/upload-interview-video`, {
              method: 'POST',
              body: formData,
            });
            
            if (uploadResponse.ok) {
              const result = await uploadResponse.json();
              videoUrl = result.videoUrl;
              console.log('Final video uploaded:', videoUrl);
            }
          } catch (uploadErr) {
            console.error('Final video upload error:', uploadErr);
          }
        }
        
        // Save the final answer
        await saveAnswer({
          variables: {
            input: {
              sessionToken: token,
              questionId: finalQuestionId,
              answerText: finalAnswerText || '',
              videoUrl: videoUrl,
            }
          }
        });
        console.log('Final answer saved');
      }
      
      // Complete the session
      await completeSession({ variables: { token } });
      
      // Stop camera
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }
      
      // Show completed screen
      setStep('completed');
    } catch (err) {
      console.error('Error completing interview:', err);
      // Still show completed even if there's an error
      setStep('completed');
    }
  }, [completeSession, saveAnswer, token, mediaStream]);

  // Handle data changes with useEffect
  useEffect(() => {
    if (data?.interviewSession) {
      const sess = data.interviewSession;
      console.log('InterviewPage: Session loaded:', sess.status);
      
      const lang = sess.job?.interviewLanguage?.toLowerCase() || 'tr';
      setLanguage(lang === 'english' || lang === 'en' ? 'en' : 'tr');
      
      if (sess.status === 'completed') {
        setStep('completed');
      } else if (sess.status === 'expired' || new Date(sess.expiresAt) < new Date()) {
        setStep('expired');
      } else if (sess.status === 'in_progress') {
        // Calculate remaining time for global timer
        if (sess.job?.useGlobalTimer && sess.job?.totalDuration && sess.startedAt) {
          const startTime = new Date(sess.startedAt).getTime();
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - startTime) / 1000);
          const remaining = Math.max(0, sess.job.totalDuration - elapsedSeconds);
          setGlobalTimeRemaining(remaining);
        } else if (sess.job?.useGlobalTimer && sess.job?.totalDuration) {
          setGlobalTimeRemaining(sess.job.totalDuration);
        }
        
        // If already in progress but no camera, go to camera test first
        if (!mediaStream) {
          setStep('camera-test');
        } else {
          setStep('interview');
        }
      } else {
        setStep('welcome');
      }
    }
  }, [data]);

  // Cleanup media stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaStream]);

  // Global timer countdown effect - must be before any early returns
  useEffect(() => {
    // Clear any existing timer
    if (globalTimerRef.current) {
      clearInterval(globalTimerRef.current);
      globalTimerRef.current = null;
    }

    // Only run timer during interview with global timer mode
    if (step !== 'interview' || !job?.useGlobalTimer || globalTimeRemaining === null || globalTimeRemaining <= 0) {
      return;
    }
    
    globalTimerRef.current = setInterval(() => {
      setGlobalTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(globalTimerRef.current);
          globalTimerRef.current = null;
          handleCompleteInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (globalTimerRef.current) {
        clearInterval(globalTimerRef.current);
        globalTimerRef.current = null;
      }
    };
  }, [step, job?.useGlobalTimer, globalTimeRemaining, handleCompleteInterview]);

  // Handler functions
  const handleStartClick = () => {
    setStep('camera-test');
  };

  const handleCameraReady = (stream) => {
    setMediaStream(stream);
    if (job?.agreementTemplate && !session?.agreementAcceptedAt) {
      setStep('agreement');
    } else {
      handleStartInterview();
    }
  };

  const handleAcceptAgreement = async () => {
    try {
      await acceptAgreement({ variables: { token } });
      handleStartInterview();
    } catch (err) {
      console.error('Error accepting agreement:', err);
    }
  };

  const handleStartInterview = async () => {
    try {
      if (session?.status === 'pending') {
        await startSession({ variables: { token } });
      }
      
      // Initialize global timer if using global timer mode
      if (job?.useGlobalTimer && job?.totalDuration) {
        setGlobalTimeRemaining(job.totalDuration);
      }
      
      setStep('interview');
    } catch (err) {
      console.error('Error starting interview:', err);
    }
  };

  // Upload video blob and return URL
  const uploadVideoBlob = async (videoBlob, questionId) => {
    if (!videoBlob) return null;
    
    try {
      const formData = new FormData();
      formData.append('video', videoBlob, `interview_${token}_q${questionId}.webm`);
      formData.append('token', token);
      formData.append('questionId', questionId);
      
      const response = await fetch(`${API_BASE_URL}/upload-interview-video`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        console.error('Video upload failed:', response.status);
        return null;
      }
      
      const data = await response.json();
      return data.videoUrl;
    } catch (err) {
      console.error('Error uploading video:', err);
      return null;
    }
  };

  const handleSaveAnswer = async (questionId, answerText, videoBlob) => {
    console.log('handleSaveAnswer called:', { questionId, answerText, hasVideo: !!videoBlob, token });
    try {
      // Upload video if exists
      let videoUrl = null;
      if (videoBlob) {
        videoUrl = await uploadVideoBlob(videoBlob, questionId);
      }
      
      const result = await saveAnswer({
        variables: {
          input: {
            sessionToken: token,
            questionId,
            answerText,
            videoUrl
          }
        }
      });
      console.log('saveAnswer result:', result);
      setAnswers(prev => ({ ...prev, [questionId]: answerText }));
    } catch (err) {
      console.error('Error saving answer:', err);
    }
  };

  // Handle browser support update
  const handleBrowserSupportUpdate = useCallback(async (unsupportedFeatures) => {
    setBrowserUnsupportedFeatures(unsupportedFeatures);
    
    // Update backend about STT support
    const sttSupported = !unsupportedFeatures.includes('SpeechRecognition');
    try {
      await updateBrowserSttSupport({
        variables: { token, supported: sttSupported }
      });
    } catch (err) {
      console.error('Error updating browser STT support:', err);
    }
  }, [token, updateBrowserSttSupport]);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Handle loading state - AFTER all hooks
  if (loading) {
    return <LoadingScreen language={language} />;
  }

  // Handle error state
  if (error) {
    return <ErrorScreen message={t.error} details={error.message} language={language} />;
  }

  // Handle not found
  if (!session) {
    return <ErrorScreen message={t.notFound} details={t.notFoundDesc} language={language} />;
  }

  // Render based on step
  switch (step) {
    case 'welcome':
      return (
        <WelcomeScreen
          job={job}
          candidate={candidate}
          questions={questions}
          language={language}
          onStart={handleStartClick}
        />
      );
    
    case 'camera-test':
      return (
        <CameraTestScreen
          language={language}
          onReady={handleCameraReady}
          onBack={() => setStep('welcome')}
          voiceEnabled={template?.voiceResponseEnabled || false}
        />
      );
    
    case 'agreement':
      return (
        <AgreementScreen
          agreement={job?.agreementTemplate}
          language={language}
          onAccept={handleAcceptAgreement}
          onBack={() => setStep('camera-test')}
        />
      );
    
    case 'interview':
      return (
        <InterviewScreen
          job={job}
          candidate={candidate}
          questions={questions}
          currentQuestionIndex={currentQuestionIndex}
          answers={answers}
          mediaStream={mediaStream}
          language={language}
          onSaveAnswer={handleSaveAnswer}
          onNext={handleNextQuestion}
          onPrev={handlePrevQuestion}
          onComplete={handleCompleteInterview}
          sessionToken={token}
          globalTimeRemaining={globalTimeRemaining}
          template={template}
          onBrowserSupportUpdate={handleBrowserSupportUpdate}
        />
      );
    
    case 'saving':
      return (
        <div className="interview-page saving-screen">
          <div className="saving-container">
            <div className="saving-spinner"></div>
            <h2>{t.saving}</h2>
            <p>{t.savingDesc}</p>
          </div>
        </div>
      );
    
    case 'completed':
      return (
        <CompletedScreen
          job={job}
          language={language}
        />
      );
    
    case 'expired':
      return (
        <ExpiredScreen
          language={language}
        />
      );
    
    default:
      return <LoadingScreen language={language} />;
  }
};

export default InterviewPage;
