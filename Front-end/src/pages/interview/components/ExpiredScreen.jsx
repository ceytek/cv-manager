const translations = {
  tr: {
    title: 'Mülakat Süresi Doldu',
    message: 'Bu mülakat bağlantısının süresi dolmuş. Lütfen İK ekibiyle iletişime geçin.'
  },
  en: {
    title: 'Interview Expired',
    message: 'This interview link has expired. Please contact the HR team.'
  }
};

const ExpiredScreen = ({ language = 'tr' }) => {
  const t = translations[language] || translations.tr;
  
  return (
    <div className="expired-screen">
      <div className="expired-card">
        <div className="expired-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h2 className="expired-title">{t.title}</h2>
        <p className="expired-message">{t.message}</p>
      </div>
    </div>
  );
};

export default ExpiredScreen;


