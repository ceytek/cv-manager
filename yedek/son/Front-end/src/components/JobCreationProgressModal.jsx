/**
 * AI-Powered Job Creation Progress Modal
 * Shows progress and confirmation when creating a job posting
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import '../styles/JobCreationProgressModal.css';

const JobCreationProgressModal = ({
  isOpen,
  status = 'creating', // 'creating' | 'success' | 'error'
  jobTitle = '',
  onClose,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'creating':
        return <Loader className="modal-icon creating-icon" size={64} />;
      case 'success':
        return <CheckCircle className="modal-icon success-icon" size={64} />;
      case 'error':
        return <AlertCircle className="modal-icon error-icon" size={64} />;
      default:
        return <Loader className="modal-icon creating-icon" size={64} />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'creating':
        return t('jobCreation.creating');
      case 'success':
        return t('jobCreation.success');
      case 'error':
        return t('jobCreation.error');
      default:
        return t('jobCreation.creating');
    }
  };

  return (
    <div className="job-creation-modal-overlay">
      <div className="job-creation-modal-container">
        {/* AI Icon */}
        <div className="ai-icon-wrapper">
          <Sparkles className="ai-sparkles" size={48} />
        </div>

        {/* Title */}
        <h2 className="job-creation-modal-title">
          {t('jobCreation.title')}
        </h2>

        {/* Description */}
        <p className="job-creation-modal-description">
          {t('jobCreation.description')}
        </p>

        {/* Status Icon */}
        <div className="job-creation-status-icon-wrapper">
          {getStatusIcon()}
        </div>

        {/* Job Title */}
        {jobTitle && (
          <div className="job-title-display">
            <span>{jobTitle}</span>
          </div>
        )}

        {/* Status Message */}
        <div className={`job-creation-status-message status-${status}`}>
          {getStatusText()}
        </div>

        {/* Creating Message */}
        {status === 'creating' && (
          <p className="job-creation-ai-message">
            {t('jobCreation.aiProcessing')}
          </p>
        )}

        {/* Please Wait */}
        {status === 'creating' && (
          <p className="job-creation-wait-message">
            {t('jobCreation.pleaseWait')}
          </p>
        )}

        {/* Close Button (only show on success or error) */}
        {(status === 'success' || status === 'error') && (
          <button
            onClick={onClose}
            className="btn-primary"
            style={{ marginTop: '24px', width: '160px' }}
          >
            {t('common.close')}
          </button>
        )}
      </div>
    </div>
  );
};

export default JobCreationProgressModal;
