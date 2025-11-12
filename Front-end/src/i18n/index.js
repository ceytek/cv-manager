import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationTR from './locales/tr.json';
import translationEN from './locales/en.json';

// Dil kaynaklarını tanımla
const resources = {
  tr: {
    translation: translationTR
  },
  en: {
    translation: translationEN
  }
};

// localStorage'dan kaydedilmiş dil tercihini al, yoksa varsayılan olarak Türkçe kullan
const savedLanguage = localStorage.getItem('language') || 'tr';

i18n
  .use(initReactI18next) // React i18next'i kullan
  .init({
    resources,
    lng: savedLanguage, // Varsayılan dil
    fallbackLng: 'tr', // Çeviri bulunamazsa geri dönülecek dil
    interpolation: {
      escapeValue: false // React zaten XSS koruması sağlıyor
    }
  });

export default i18n;
