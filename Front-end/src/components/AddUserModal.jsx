import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import usersService from '../services/usersService';

const AddUserModal = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCreate = async () => {
    setError('');
    if (!fullName || !email || !password || !confirmPassword) {
      setError(t('settings.fillAllFields'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('settings.passwordMismatch'));
      return;
    }
    if (password.length < 6) {
      setError(t('settings.passwordMinLength'));
      return;
    }
    setLoading(true);
    try {
      await usersService.createUser({ email, password, fullName, role });
      onSuccess?.();
      onClose();
      // Reset form
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRole('user');
    } catch (e) {
      setError(e.message || t('addUser.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={{ marginBottom: 16 }}>{t('addUser.title')}</h3>
        <label style={styles.label}>{t('users.fullName')}</label>
        <input style={styles.input} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Test User" />
        <label style={styles.label}>{t('users.email')}</label>
        <input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@mail.com" />
        <label style={styles.label}>{t('addUser.password')}</label>
        <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        <label style={styles.label}>{t('addUser.confirmPassword')}</label>
        <input style={styles.input} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
        <label style={styles.label}>{t('users.role')}</label>
        <select style={styles.input} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="user">{t('addUser.roleUser')}</option>
          <option value="admin">{t('addUser.roleAdmin')}</option>
        </select>
        {error && <div style={styles.error}>{error}</div>}
        <div style={styles.row}>
          <button style={styles.secondary} onClick={onClose}>{t('common.cancel')}</button>
          <button style={styles.primary} onClick={handleCreate} disabled={loading}>
            {loading ? t('addUser.saving') : t('addUser.create')}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  modal: { background: '#fff', borderRadius: 12, padding: 20, width: 380, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' },
  label: { fontSize: 14, color: '#374151', marginBottom: 6, display: 'block' },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', marginBottom: 12 },
  row: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 },
  primary: { background: '#10B981', color: '#fff', border: 0, padding: '10px 16px', borderRadius: 8, cursor: 'pointer' },
  secondary: { background: '#F3F4F6', color: '#374151', border: 0, padding: '10px 16px', borderRadius: 8, cursor: 'pointer' },
  error: { color: '#B91C1C', fontSize: 13, marginTop: 4, marginBottom: 4 },
};

export default AddUserModal;
