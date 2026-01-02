import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { 
  GET_INTERVIEW_SESSION, 
  START_INTERVIEW_SESSION, 
  SAVE_INTERVIEW_ANSWER, 
  COMPLETE_INTERVIEW_SESSION,
  ACCEPT_INTERVIEW_AGREEMENT
} from '../../graphql/interview';
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
  }
};

const InterviewPage = ({ token }) => {
  const [step, setStep] = useState('loading');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [language, setLanguage] = useState('tr');
  const [mediaStream, setMediaStream] = useState(null);
  const [globalTimeRemaining, setGlobalTimeRemaining] = useState(null);
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

  const session = data?.interviewSession;
  const job = session?.job;
  const candidate = session?.candidate;
  const questions = session?.questions || [];

  // Handle completing interview (using useCallback to use in useEffect)
  const handleCompleteInterview = useCallback(async () => {
    try {
      await completeSession({ variables: { token } });
      setStep('completed');
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }
    } catch (err) {
      console.error('Error completing interview:', err);
    }
  }, [completeSession, token, mediaStream]);

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
        setStep('interview');
        // Restore global timer if it was in progress
        if (sess.job?.useGlobalTimer && sess.job?.totalDuration) {
          setGlobalTimeRemaining(sess.job.totalDuration);
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

  const handleSaveAnswer = async (questionId, answerText) => {
    console.log('handleSaveAnswer called:', { questionId, answerText, token });
    try {
      const result = await saveAnswer({
        variables: {
          input: {
            sessionToken: token,
            questionId,
            answerText
          }
        }
      });
      console.log('saveAnswer result:', result);
      setAnswers(prev => ({ ...prev, [questionId]: answerText }));
    } catch (err) {
      console.error('Error saving answer:', err);
    }
  };

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
        />
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
