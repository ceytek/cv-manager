import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import authService from '../services/authService';
import './LoginPage.css';
import ForgotPasswordModal from './ForgotPasswordModal';
import LanguageSwitcher from './LanguageSwitcher';

const LoginPage = ({ onLogin }) => {
  const { t } = useTranslation();
  const [companyCode, setCompanyCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!companyCode || !email || !password) {
      setError(t('settings.fillAllFields'));
      setLoading(false);
      return;
    }

    const companyCodeUpper = companyCode.toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(companyCodeUpper)) {
      setError(t('login.companyCodeError'));
      setLoading(false);
      return;
    }

    try {
      await authService.login(companyCodeUpper, email, password);
      const user = await authService.getCurrentUser();
      onLogin(user);
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-language-switcher">
        <LanguageSwitcher />
      </div>
      <div className="login-outer-panel">
        <div className="login-container">
          <img
            src="/images/HR_Smart.png"
            alt="HRSMART Logo"
            className="logo-image"
          />
          <h1 className="login-title">{t('login.hrsmartWelcome')}</h1>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="companyCode">{t('login.companyCode')}</label>
              <input
                type="text"
                id="companyCode"
                placeholder={t('login.companyCodePlaceholder')}
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                maxLength={6}
                style={{ textTransform: 'uppercase' }}
                autoComplete="off"
              />
            </div>
            <div className="input-group">
              <label htmlFor="email">{t('login.email')}</label>
              <input
                type="email"
                id="email"
                placeholder={t('login.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label htmlFor="password">{t('login.password')}</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder={t('login.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? t('login.loggingIn') : t('login.loginButton')}
            </button>
            <button
              type="button"
              className="forgot-password"
              onClick={() => setShowForgot(true)}
            >
              {t('login.forgotPassword')}
            </button>
          </form>
          <ForgotPasswordModal
            isOpen={showForgot}
            onClose={() => setShowForgot(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
