/**
 * CV Analysis Progress Modal Component
 * Shows AI-powered analysis progress with animations
 * Displays: Current candidate being analyzed, total progress, status
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader, CheckCircle, AlertCircle, Sparkles, FileText } from 'lucide-react';
import '../styles/CVAnalysisProgressModal.css';

const CVAnalysisProgressModal = ({
  isOpen,
  currentCandidate,
  totalCandidates,
  processedCandidates,
  currentCandidateName,
  status = 'analyzing', // 'analyzing' | 'success' | 'error'
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'analyzing':
        return <Loader className="modal-icon analyzing-icon" size={64} />;
      case 'success':
        return <CheckCircle className="modal-icon success-icon" size={64} />;
      case 'error':
        return <AlertCircle className="modal-icon error-icon" size={64} />;
      default:
        return <Loader className="modal-icon analyzing-icon" size={64} />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'analyzing':
        return t('cvAnalysisProgress.analyzing');
      case 'success':
        return t('cvAnalysisProgress.completed');
      case 'error':
        return t('cvAnalysisProgress.error');
      default:
        return t('cvAnalysisProgress.analyzing');
    }
  };

  const progressPercentage = totalCandidates > 0
    ? Math.round((processedCandidates / totalCandidates) * 100)
    : 0;

  return (
    <div className="analysis-modal-overlay">
      <div className="analysis-modal-container">
        {/* Animated AI Icon */}
        <div className="ai-icon-wrapper">
          <Sparkles className="ai-sparkles" size={48} />
        </div>

        {/* Title */}
        <h2 className="analysis-modal-title">
          {t('cvAnalysisProgress.title')}
        </h2>

        {/* Description */}
        <p className="analysis-modal-description">
          {t('cvAnalysisProgress.description')}
        </p>

        {/* Status Icon */}
        <div className="analysis-status-icon-wrapper">
          {getStatusIcon()}
        </div>

        {/* Status Message */}
        <div className={`analysis-status-message status-${status}`}>
          {getStatusText()}
        </div>

        {/* AI Processing Message */}
        {status === 'analyzing' && (
          <p className="analysis-ai-message">
            {t('cvAnalysisProgress.aiProcessing')}
          </p>
        )}

        {/* Please Wait */}
        {status === 'analyzing' && (
          <p className="analysis-wait-message">
            {t('cvAnalysisProgress.pleaseWait')}
          </p>
        )}
      </div>
    </div>
  );
};

export default CVAnalysisProgressModal;
