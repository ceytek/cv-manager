import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, FileText } from 'lucide-react';
import authService from '../services/authService';
import './LoginPage.css';
import ForgotPasswordModal from './ForgotPasswordModal';
import LanguageSwitcher from './LanguageSwitcher';

const LoginPage = ({ onLogin }) => {
  const { t } = useTranslation();
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

    if (!email || !password) {
      setError(t('settings.fillAllFields'));
      setLoading(false);
      return;
    }

    try {
      // GraphQL API ile giriş yap
      await authService.login(email, password);
      // Kullanıcı bilgilerini al
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
      <div className="login-container">
        {/* Logo */}
        <div className="logo-circle">
          <FileText size={40} strokeWidth={2} />
        </div>

        {/* Başlık */}
        <h1 className="login-title">
          CV Değerlendirme Uygulamasına Hoş Geldiniz
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
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

          {/* Şifre */}
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

          {/* Error mesajı */}
          {error && <div className="error-message">{error}</div>}

          {/* Giriş butonu */}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? t('login.loggingIn') : t('login.loginButton')}
          </button>
          {/* Şifremi unuttum */}
          <button type="button" className="forgot-password" onClick={() => setShowForgot(true)}>
            {t('login.forgotPassword')}
          </button>
        </form>
        <ForgotPasswordModal isOpen={showForgot} onClose={() => setShowForgot(false)} />
      </div>
    </div>
  );
};

export default LoginPage;
