const translations = {
  tr: {
    loading: 'Yükleniyor...'
  },
  en: {
    loading: 'Loading...'
  }
};

const LoadingScreen = ({ language = 'tr' }) => {
  const t = translations[language] || translations.tr;
  
  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <div className="loading-text">{t.loading}</div>
    </div>
  );
};

export default LoadingScreen;

