const translations = {
  tr: {
    title: 'Tebrikler!',
    message: 'pozisyonu için mülakatınızı başarıyla tamamladınız. Cevaplarınız İK ekibine iletildi.',
    note: 'Değerlendirme sonuçları hakkında sizinle iletişime geçilecektir.'
  },
  en: {
    title: 'Congratulations!',
    message: 'You have successfully completed your interview for the position. Your answers have been submitted to the HR team.',
    note: 'You will be contacted regarding the evaluation results.'
  }
};

const CompletedScreen = ({ job, language = 'tr' }) => {
  const t = translations[language] || translations.tr;

  return (
    <div className="completed-screen">
      <div className="completed-card">
        <div className="completed-icon">
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        
        <h2 className="completed-title">{t.title}</h2>
        
        <p className="completed-message">
          <strong>{job?.title}</strong> {t.message}
        </p>
        
        <div className="completed-note">
          <span>📧 {t.note}</span>
        </div>
      </div>
    </div>
  );
};

export default CompletedScreen;

