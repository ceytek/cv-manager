import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng); // Tercihi kaydet
  };

  return (
    <div className="language-switcher">
      <button
        className={`lang-btn ${i18n.language === 'tr' ? 'active' : ''}`}
        onClick={() => changeLanguage('tr')}
        title="Türkçe"
      >
        TR
      </button>
      <button
        className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
        onClick={() => changeLanguage('en')}
        title="English"
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
