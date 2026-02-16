import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Building2, Mail, Lock } from 'lucide-react';
import authService from '../services/authService';
import './LoginPage.css';
import ForgotPasswordModal from './ForgotPasswordModal';
import LanguageSwitcher from './LanguageSwitcher';

const LoginPage = ({ onLogin }) => {
  const { t } = useTranslation();
  const [companyCode, setCompanyCode] = useState(() => {
    return localStorage.getItem('lastCompanyCode') || '';
  });
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
      localStorage.setItem('lastCompanyCode', companyCodeUpper);
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
      {/* Language Switcher */}
      <div className="login-language-switcher">
        <LanguageSwitcher />
      </div>

      {/* Left Panel - Branding */}
      <div className="login-left-panel">
        {/* Decorative circles */}
        <div className="login-circle login-circle-1" />
        <div className="login-circle login-circle-2" />
        <div className="login-circle login-circle-3" />

        {/* Logo */}
        <img
          src="/images/logohrsmart.png"
          alt="HRSMART"
          className="login-brand-logo"
        />

        {/* Description */}
        <p className="login-brand-desc">
          {t('login.brandDescription', 'Yapay zeka destekli İnsan Kaynakları yönetim platformu. CV analizi, mülakat yönetimi, yetenek havuzu ve işe alım süreçlerinizi tek bir yerden akıllıca yönetin.')}
        </p>
      </div>

      {/* Right Panel - Form */}
      <div className="login-right-panel">
        <div className="login-form-container">
          {/* Logo in form */}
          <img
            src="/images/logohrsmart.png"
            alt="HRSMART"
            className="login-form-logo"
          />
          <form onSubmit={handleSubmit}>
            {/* Company Code */}
            <div className="login-field">
              <label>{t('login.companyCode')}</label>
              <div className="login-input-wrap">
                <Building2 size={18} className="login-input-icon" />
                <input
                  type="text"
                  placeholder={t('login.companyCodePlaceholder', 'ör. ABC123')}
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  style={{ textTransform: 'uppercase' }}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Email */}
            <div className="login-field">
              <label>{t('login.email')}</label>
              <div className="login-input-wrap">
                <Mail size={18} className="login-input-icon" />
                <input
                  type="email"
                  placeholder={t('login.emailPlaceholder', 'admin@sirket.com')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field">
              <label>{t('login.password')}</label>
              <div className="login-input-wrap">
                <Lock size={18} className="login-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && <div className="login-error">{error}</div>}

            {/* Submit */}
            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? t('login.loggingIn') : t('login.loginButton')}
            </button>

            {/* Forgot Password */}
            <button
              type="button"
              className="login-forgot-btn"
              onClick={() => setShowForgot(true)}
            >
              {t('login.forgotPassword')}
            </button>
          </form>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={showForgot}
        onClose={() => setShowForgot(false)}
      />
    </div>
  );
};

export default LoginPage;
