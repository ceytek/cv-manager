import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import '../styles/CVUploadProgressModal.css';

const CVUploadProgressModal = ({ 
  isOpen, 
  currentFile, 
  totalFiles, 
  processedFiles,
  currentFileName,
  status // 'processing', 'success', 'error'
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const progress = totalFiles > 0 ? (processedFiles / totalFiles) * 100 : 0;

  return (
    <div className="cv-upload-modal-overlay">
      <div className="cv-upload-modal-content">
        {/* Animated Icon */}
        <div className="modal-icon-container">
          {status === 'processing' && (
            <div className="loading-spinner">
              <Loader size={48} className="spinner-icon" />
            </div>
          )}
          {status === 'success' && (
            <CheckCircle size={48} className="success-icon" />
          )}
          {status === 'error' && (
            <AlertCircle size={48} className="error-icon" />
          )}
        </div>

        {/* Title */}
        <h2 className="modal-title">
          {t('cvUploadProgress.title')}
        </h2>

        {/* Description */}
        <p className="modal-description">
          {t('cvUploadProgress.description')}
        </p>

        {/* Progress Info */}
        <div className="progress-info">
          <div className="progress-counter">
            <span className="current-count">{processedFiles}</span>
            <span className="separator">/</span>
            <span className="total-count">{totalFiles}</span>
          </div>
          <p className="progress-label">
            {t('cvUploadProgress.totalCV')}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          >
            <div className="progress-bar-shine"></div>
          </div>
        </div>

        {/* Current File Info */}
        {currentFileName && status === 'processing' && (
          <div className="current-file-info">
            <FileText size={16} className="file-icon" />
            <p className="current-file-name">
              {t('cvUploadProgress.processing')}: <strong>{currentFileName}</strong>
            </p>
          </div>
        )}

        {/* Status Message */}
        <div className="status-message">
          {status === 'processing' && (
            <p className="status-text processing">
              {t('cvUploadProgress.aiProcessing')}
            </p>
          )}
          {status === 'success' && (
            <p className="status-text success">
              {t('cvUploadProgress.completed')}
            </p>
          )}
          {status === 'error' && (
            <p className="status-text error">
              {t('cvUploadProgress.error')}
            </p>
          )}
        </div>

        {/* Wait message */}
        {status === 'processing' && (
          <p className="wait-message">
            {t('cvUploadProgress.pleaseWait')}
          </p>
        )}
      </div>
    </div>
  );
};

export default CVUploadProgressModal;
