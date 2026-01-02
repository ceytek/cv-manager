import { useState } from 'react';

const translations = {
  tr: {
    title: 'Sözleşme Onayı',
    checkbox: 'Yukarıdaki sözleşmeyi okudum ve kabul ediyorum.',
    back: 'Geri',
    accept: 'Kabul Et ve Devam Et'
  },
  en: {
    title: 'Agreement Approval',
    checkbox: 'I have read and accept the agreement above.',
    back: 'Back',
    accept: 'Accept and Continue'
  }
};

const AgreementScreen = ({ agreement, language = 'tr', onAccept, onBack }) => {
  const t = translations[language] || translations.tr;
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="agreement-screen">
      <div className="agreement-card">
        <h2 className="agreement-title">{agreement?.name || t.title}</h2>
        
        <div 
          className="agreement-content"
          dangerouslySetInnerHTML={{ __html: agreement?.content || '' }}
        />
        
        <div className="agreement-checkbox">
          <input 
            type="checkbox" 
            id="agreement-accept" 
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <label htmlFor="agreement-accept">{t.checkbox}</label>
        </div>
        
        <div className="agreement-buttons">
          <button className="agreement-back-btn" onClick={onBack}>
            {t.back}
          </button>
          <button 
            className="agreement-accept-btn" 
            onClick={onAccept}
            disabled={!accepted}
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgreementScreen;


