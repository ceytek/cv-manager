const translations = {
  tr: {
    badge: 'AI Video Mülakat',
    greeting: 'Merhaba',
    welcome: 'mülakata hoş geldiniz.',
    questionCount: 'SORU SAYISI',
    questions: 'Soru',
    timePerQuestion: 'SORU BAŞINA SÜRE',
    totalTime: 'TOPLAM SÜRE',
    minutes: 'dakika',
    language: 'MÜLAKAT DİLİ',
    turkish: 'Türkçe',
    english: 'İngilizce',
    importantInfo: 'Önemli Bilgi',
    startButton: 'Mülakata Başla'
  },
  en: {
    badge: 'AI Video Interview',
    greeting: 'Hello',
    welcome: 'welcome to the interview.',
    questionCount: 'NUMBER OF QUESTIONS',
    questions: 'Questions',
    timePerQuestion: 'TIME PER QUESTION',
    totalTime: 'TOTAL TIME',
    minutes: 'minutes',
    language: 'INTERVIEW LANGUAGE',
    turkish: 'Turkish',
    english: 'English',
    importantInfo: 'Important Information',
    startButton: 'Start Interview'
  }
};

const WelcomeScreen = ({ job, candidate, questions, language = 'tr', onStart }) => {
  const t = translations[language] || translations.tr;
  
  const questionCount = questions?.length || 0;
  // Field names from GraphQL: useGlobalTimer, totalDuration (no 'interview' prefix)
  const useGlobalTimer = job?.useGlobalTimer || false;
  
  // Default time per question (fallback)
  const defaultTimePerQuestion = job?.interviewDurationPerQuestion || 120;
  
  // Calculate total duration based on mode
  let totalDurationSeconds = 0;
  if (useGlobalTimer) {
    // Global timer mode: use the total duration from job
    totalDurationSeconds = job?.totalDuration || 0;
  } else {
    // Per-question mode: sum up each question's actual time limit
    totalDurationSeconds = questions?.reduce((sum, q) => {
      return sum + (q.timeLimit || defaultTimePerQuestion);
    }, 0) || 0;
  }
  const totalDurationMinutes = Math.round(totalDurationSeconds / 60);
  
  const interviewLanguage = job?.interviewLanguage?.toLowerCase();
  const introText = job?.interviewIntroText;
  
  const displayLanguage = interviewLanguage === 'english' || interviewLanguage === 'en' 
    ? t.english 
    : t.turkish;

  return (
    <div className="welcome-screen">
      <div className="welcome-header">
        <span className="welcome-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          {t.badge}
        </span>
      </div>
      
      <div className="welcome-content">
        <h1 className="welcome-title">{job?.title}</h1>
        <p className="welcome-subtitle">
          {t.greeting} <strong>{candidate?.name}</strong>, {t.welcome}
        </p>
        
        <div className="welcome-info-card">
          <div className="welcome-info-row">
            <div className="welcome-info-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </div>
            <div className="welcome-info-content">
              <div className="welcome-info-label">{t.questionCount}</div>
              <div className="welcome-info-value">{questionCount} {t.questions}</div>
            </div>
          </div>
          
          <div className="welcome-info-row">
            <div className="welcome-info-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="welcome-info-content">
              <div className="welcome-info-label">{t.totalTime}</div>
              <div className="welcome-info-value">
                {totalDurationMinutes} {t.minutes}
              </div>
            </div>
          </div>
          
          <div className="welcome-info-row">
            <div className="welcome-info-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <div className="welcome-info-content">
              <div className="welcome-info-label">{t.language}</div>
              <div className="welcome-info-value">{displayLanguage}</div>
            </div>
          </div>
        </div>
        
        {introText && (
          <div className="welcome-note">
            <div className="welcome-note-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              {t.importantInfo}
            </div>
            <div className="welcome-note-text">{introText}</div>
          </div>
        )}
        
        <button className="welcome-start-button" onClick={onStart}>
          {t.startButton}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
