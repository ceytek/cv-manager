import { useState } from 'react';
import authService from '../services/authService';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSend = async () => {
    setError(''); setMessage(''); setLoading(true);
    try {
      await authService.forgotPassword(email);
      setMessage('Eğer kayıtlıysa, e-posta adresine bir kod gönderdik.');
      setStep(2);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setError(''); setMessage(''); setLoading(true);
    try {
      await authService.resetPassword(email, token, newPassword);
      setMessage('Şifren başarıyla güncellendi. Giriş yapabilirsin.');
      setTimeout(onClose, 1200);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={{ marginBottom: 16 }}>Şifremi Unuttum</h3>
        {step === 1 ? (
          <>
            <label style={styles.label}>E-Posta</label>
            <input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@mail.com" />
            {error && <div style={styles.error}>{error}</div>}
            {message && <div style={styles.info}>{message}</div>}
            <div style={styles.row}>
              <button style={styles.secondary} onClick={onClose}>Vazgeç</button>
              <button style={styles.primary} onClick={handleSend} disabled={loading || !email}>
                {loading ? 'Gönderiliyor...' : 'Kod Gönder'}
              </button>
            </div>
          </>
        ) : (
          <>
            <label style={styles.label}>E-Posta</label>
            <input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled />
            <label style={styles.label}>Doğrulama Kodu</label>
            <input style={styles.input} value={token} onChange={(e) => setToken(e.target.value)} placeholder="6 haneli kod" />
            <label style={styles.label}>Yeni Şifre</label>
            <input style={styles.input} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
            {error && <div style={styles.error}>{error}</div>}
            {message && <div style={styles.info}>{message}</div>}
            <div style={styles.row}>
              <button style={styles.secondary} onClick={onClose}>Kapat</button>
              <button style={styles.primary} onClick={handleReset} disabled={loading || !token || !newPassword}>
                {loading ? 'Güncelleniyor...' : 'Şifreyi Sıfırla'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
  },
  modal: {
    background: '#fff', borderRadius: 12, padding: 20, width: 360, boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
  },
  label: { fontSize: 14, color: '#374151', marginBottom: 6, display: 'block' },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', marginBottom: 12 },
  row: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 },
  primary: { background: '#3B82F6', color: '#fff', border: 0, padding: '10px 16px', borderRadius: 8, cursor: 'pointer' },
  secondary: { background: '#F3F4F6', color: '#374151', border: 0, padding: '10px 16px', borderRadius: 8, cursor: 'pointer' },
  error: { color: '#B91C1C', fontSize: 13, marginTop: 4, marginBottom: 4 },
  info: { color: '#065F46', fontSize: 13, marginTop: 4, marginBottom: 4 },
};

export default ForgotPasswordModal;
