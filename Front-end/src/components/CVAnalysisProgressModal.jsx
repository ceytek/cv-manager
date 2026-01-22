/**
 * CV Analysis Progress Modal Component
 * Shows AI-powered analysis progress with animations
 * Displays: Current batch being analyzed, total progress, status
 * Supports batch processing to prevent timeout errors
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader, CheckCircle, AlertCircle, Sparkles, AlertTriangle } from 'lucide-react';
import '../styles/CVAnalysisProgressModal.css';

const CVAnalysisProgressModal = ({
  isOpen,
  currentCandidate,
  totalCandidates,
  processedCandidates,
  currentCandidateName,
  currentBatch = 0,
  totalBatches = 0,
  successCount = 0,
  errorCount = 0,
  status = 'analyzing', // 'analyzing' | 'success' | 'error' | 'partial'
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
      case 'partial':
        return <AlertTriangle className="modal-icon partial-icon" size={64} />;
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
      case 'partial':
        return t('cvAnalysisProgress.partialComplete');
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

        {/* Progress Bar */}
        {status === 'analyzing' && totalCandidates > 0 && (
          <div style={{ width: '100%', marginBottom: 16 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8,
              fontSize: 14,
              color: '#6B7280'
            }}>
              <span>{t('cvAnalysisProgress.progress')}</span>
              <span>{processedCandidates} / {totalCandidates} ({progressPercentage}%)</span>
            </div>
            <div style={{
              width: '100%',
              height: 8,
              background: '#E5E7EB',
              borderRadius: 4,
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progressPercentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
                borderRadius: 4,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}

        {/* Batch Info */}
        {status === 'analyzing' && totalBatches > 1 && (
          <p style={{
            fontSize: 13,
            color: '#9CA3AF',
            marginBottom: 12,
            textAlign: 'center'
          }}>
            {t('cvAnalysisProgress.batchProgress', { current: currentBatch, total: totalBatches })}
          </p>
        )}

        {/* Current Candidate Names */}
        {status === 'analyzing' && currentCandidateName && (
          <div style={{
            background: '#F3F4F6',
            padding: '10px 16px',
            borderRadius: 8,
            marginBottom: 16,
            maxWidth: '100%',
            overflow: 'hidden'
          }}>
            <p style={{
              fontSize: 12,
              color: '#6B7280',
              marginBottom: 4
            }}>
              {t('cvAnalysisProgress.currentlyAnalyzing')}
            </p>
            <p style={{
              fontSize: 14,
              color: '#1F2937',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {currentCandidateName}
            </p>
          </div>
        )}

        {/* Status Icon */}
        <div className="analysis-status-icon-wrapper">
          {getStatusIcon()}
        </div>

        {/* Status Message */}
        <div className={`analysis-status-message status-${status}`}>
          {getStatusText()}
        </div>

        {/* Partial Success Info */}
        {status === 'partial' && (
          <p style={{
            fontSize: 14,
            color: '#F59E0B',
            marginTop: 8,
            textAlign: 'center'
          }}>
            {t('cvAnalysisProgress.partialInfo', { success: successCount, error: errorCount })}
          </p>
        )}

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
