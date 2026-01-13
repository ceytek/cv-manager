import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client/react';
import { UPDATE_COMPANY_MUTATION } from '../graphql/auth';
import { Building2, Save, Loader2, Upload, X, Image } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const CompanySettingsForm = ({ currentUser }) => {
  const { t } = useTranslation();
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  const [updateCompany, { loading }] = useMutation(UPDATE_COMPANY_MUTATION, {
    onCompleted: () => {
      setMessage({ type: 'success', text: t('settings.companyUpdated') });
      // Reload page after short delay to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message || t('settings.updateFailed') });
    }
  });

  useEffect(() => {
    if (currentUser?.companyName) {
      setCompanyName(currentUser.companyName);
    }
    if (currentUser?.companyLogo) {
      setLogoUrl(currentUser.companyLogo);
      setLogoPreview(currentUser.companyLogo);
    }
  }, [currentUser?.companyName, currentUser?.companyLogo]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 2MB' });
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'logo');

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/upload-logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setLogoUrl(data.url);
      setMessage({ type: 'success', text: 'Logo uploaded successfully' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } catch (error) {
      console.error('Logo upload error:', error);
      setMessage({ type: 'error', text: 'Failed to upload logo' });
      setLogoPreview(logoUrl); // Revert preview
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    setLogoPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setMessage({ type: 'error', text: t('settings.fillAllFields') });
      return;
    }
    
    await updateCompany({
      variables: {
        input: { 
          name: companyName.trim(),
          logoUrl: logoUrl || null
        }
      }
    });
  };

  return (
    <div className="company-settings-form">
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12, 
        marginBottom: 24,
        paddingBottom: 16,
        borderBottom: '1px solid #E5E7EB'
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Building2 size={20} color="white" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1F2937' }}>
            {t('settings.companyInfo')}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
            {t('settings.companyNamePlaceholder')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Logo Upload Section */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: 500, 
            fontSize: 14,
            color: '#374151' 
          }}>
            Logo
          </label>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Logo Preview */}
            <div style={{
              width: 80,
              height: 80,
              borderRadius: 12,
              border: '2px dashed #D1D5DB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              background: '#F9FAFB',
              position: 'relative'
            }}>
              {logoPreview ? (
                <>
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: '#EF4444',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={14} color="white" />
                  </button>
                </>
              ) : (
                <Image size={32} color="#9CA3AF" />
              )}
            </div>

            {/* Upload Button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  background: '#F3F4F6',
                  border: '1px solid #D1D5DB',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#374151',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    {logoPreview ? 'Change Logo' : 'Upload Logo'}
                  </>
                )}
              </button>
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#6B7280' }}>
                PNG, JPG (max 2MB)
              </p>
            </div>
          </div>
        </div>

        {/* Company Name Input */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: 500, 
            fontSize: 14,
            color: '#374151' 
          }}>
            {t('settings.companyName')}
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder={t('settings.companyNamePlaceholder')}
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '1px solid #D1D5DB',
              borderRadius: 8,
              fontSize: 14,
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3B82F6';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#D1D5DB';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {message.text && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 14,
            background: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: message.type === 'success' ? '#059669' : '#DC2626',
            border: `1px solid ${message.type === 'success' ? '#A7F3D0' : '#FECACA'}`
          }}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: '100%',
            padding: '12px 20px',
            background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="spin" />
              {t('settings.updating')}
            </>
          ) : (
            <>
              <Save size={16} />
              {t('common.save')}
            </>
          )}
        </button>
      </form>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default CompanySettingsForm;
