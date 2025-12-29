import { useState } from 'react';
import usersService from '../services/usersService';

const AddUserModal = ({ isOpen, onClose, onSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCreate = async () => {
    setError('');
    if (!fullName || !email || !password) {
      setError('Lütfen tüm alanları doldurunuz');
      return;
    }
    setLoading(true);
    try {
  await usersService.createUser({ email, password, fullName, role });
      onSuccess?.();
      onClose();
    } catch (e) {
      setError(e.message || 'Kullanıcı oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={{ marginBottom: 16 }}>Yeni Kullanıcı Ekle</h3>
        <label style={styles.label}>Ad Soyad</label>
        <input style={styles.input} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Test User" />
        <label style={styles.label}>E-posta</label>
        <input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@mail.com" />
        <label style={styles.label}>Şifre</label>
        <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        <label style={styles.label}>Rol</label>
        <select style={styles.input} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="user">Kullanıcı</option>
          <option value="admin">Admin</option>
        </select>
        {error && <div style={styles.error}>{error}</div>}
        <div style={styles.row}>
          <button style={styles.secondary} onClick={onClose}>Vazgeç</button>
          <button style={styles.primary} onClick={handleCreate} disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Oluştur'}
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
