import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/ApplicationModal.css';

function ApplicationModal({ job, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    cv_file: null
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = t('publicCareers.errors.nameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('publicCareers.errors.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('publicCareers.errors.emailInvalid');
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t('publicCareers.errors.phoneRequired');
    }

    if (!formData.cv_file) {
      newErrors.cv_file = t('publicCareers.errors.cvRequired');
    } else {
      const file = formData.cv_file;
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        newErrors.cv_file = t('publicCareers.errors.cvInvalidType');
      } else if (file.size > maxSize) {
        newErrors.cv_file = t('publicCareers.errors.cvTooLarge');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      cv_file: file
    }));
    // Clear error for this field
    if (errors.cv_file) {
      setErrors(prev => ({
        ...prev,
        cv_file: null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('job_id', job.id);
      formDataToSend.append('full_name', formData.full_name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('cv_file', formData.cv_file);

      const response = await fetch('http://localhost:8000/api/public/apply', {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || t('publicCareers.errors.submitFailed'));
      }

      // Success
      onSuccess(data);
    } catch (err) {
      console.error('Application error:', err);
      setSubmitError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('publicCareers.applyFor')} {job.title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="application-form">
          {submitError && (
            <div className="error-alert">
              {submitError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="full_name">
              {t('publicCareers.fullName')} <span className="required">*</span>
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              className={errors.full_name ? 'error' : ''}
              disabled={loading}
            />
            {errors.full_name && <span className="error-text">{errors.full_name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">
              {t('publicCareers.email')} <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={errors.email ? 'error' : ''}
              disabled={loading}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              {t('publicCareers.phone')} <span className="required">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={errors.phone ? 'error' : ''}
              placeholder="+90 5XX XXX XX XX"
              disabled={loading}
            />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="cv_file">
              {t('publicCareers.cvFile')} <span className="required">*</span>
            </label>
            <input
              type="file"
              id="cv_file"
              name="cv_file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              className={errors.cv_file ? 'error' : ''}
              disabled={loading}
            />
            <small className="help-text">
              {t('publicCareers.cvFileHelp')}
            </small>
            {errors.cv_file && <span className="error-text">{errors.cv_file}</span>}
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn-secondary"
              disabled={loading}
            >
              {t('common.cancel')}
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? t('common.submitting') : t('publicCareers.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ApplicationModal;
