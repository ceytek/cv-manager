/**
 * Usage Session Detail Modal Component
 * Shows detailed view of candidates/applications from a batch
 */
import React from 'react';
import { X, FileText, Target, Calendar, MapPin, Mail, Award } from 'lucide-react';
import { formatDate } from '../../utils/periodCalculator';

const UsageSessionDetailModal = ({ session, onClose, loading }) => {
  if (!session) return null;

  const isUpload = session.resourceType === 'cv_upload';
  const isAnalysis = session.resourceType === 'ai_analysis';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        maxWidth: 1000,
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#1F2937',
              marginBottom: 4
            }}>
              Oturum Detayları
            </h2>
            <div style={{
              display: 'flex',
              gap: 16,
              fontSize: 14,
              color: '#6B7280',
              marginTop: 8
            }}>
              <span>Batch: {session.batchNumber}</span>
              <span>•</span>
              <span>{formatDate(session.createdAt)}</span>
              <span>•</span>
              <span>{session.count} kayıt</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: 8,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#F3F4F6'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            <X size={24} color="#6B7280" />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: 24,
          overflowY: 'auto',
          flex: 1
        }}>
          {/* Loading State */}
          {loading && (
            <div style={{
              textAlign: 'center',
              padding: 40,
              color: '#9CA3AF'
            }}>
              <div className="spinner" style={{
                width: 40,
                height: 40,
                border: '4px solid #F3F4F6',
                borderTop: '4px solid #3B82F6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }} />
              <p>Yükleniyor...</p>
            </div>
          )}

          {/* CV Uploads */}
          {!loading && isUpload && session.candidates && session.candidates.length > 0 && (
            <div>
              <h3 style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#1F2937',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <FileText size={20} color="#3B82F6" />
                Yüklenen CV'ler ({session.candidates.length})
              </h3>
              
              <div style={{
                display: 'grid',
                gap: 12
              }}>
                {session.candidates.map((candidate) => (
                  <CandidateCard key={candidate.id} candidate={candidate} />
                ))}
              </div>
            </div>
          )}

          {/* AI Analyses */}
          {!loading && isAnalysis && session.applications && session.applications.length > 0 && (
            <div>
              <h3 style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#1F2937',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <Target size={20} color="#7C3AED" />
                Yapılan Analizler ({session.applications.length})
              </h3>
              
              <div style={{
                display: 'grid',
                gap: 12
              }}>
                {session.applications.map((application) => (
                  <ApplicationCard key={application.id} application={application} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && (!session.candidates || session.candidates.length === 0) && 
           (!session.applications || session.applications.length === 0) && (
            <div style={{
              textAlign: 'center',
              padding: 40,
              color: '#9CA3AF'
            }}>
              <FileText size={48} style={{ margin: '0 auto 16px' }} />
              <p>Bu oturumda kayıt bulunamadı</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#2563EB'}
            onMouseLeave={(e) => e.target.style.background = '#3B82F6'}
          >
            Kapat
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Candidate Card Component
const CandidateCard = ({ candidate }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'archived': return '#6B7280';
      default: return '#3B82F6';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'archived': return 'Arşivlendi';
      default: return status;
    }
  };

  return (
    <div style={{
      padding: 16,
      border: '1px solid #E5E7EB',
      borderRadius: 8,
      background: 'white',
      transition: 'all 0.2s'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'start',
        marginBottom: 12
      }}>
        <div>
          <h4 style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#1F2937',
            marginBottom: 4
          }}>
            {candidate.name || 'İsimsiz'}
          </h4>
          <div style={{
            fontSize: 13,
            color: '#6B7280',
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}>
            {candidate.email && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={14} />
                {candidate.email}
              </span>
            )}
            {candidate.location && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} />
                {candidate.location}
              </span>
            )}
          </div>
        </div>
        <span style={{
          padding: '4px 12px',
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          background: `${getStatusColor(candidate.status)}20`,
          color: getStatusColor(candidate.status)
        }}>
          {getStatusLabel(candidate.status)}
        </span>
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        color: '#6B7280'
      }}>
        <FileText size={14} />
        <span>{candidate.cvFileName}</span>
      </div>
    </div>
  );
};

// Application Card Component
const ApplicationCard = ({ application }) => {
  const getScoreColor = (score) => {
    if (!score) return '#9CA3AF';
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div style={{
      padding: 16,
      border: '1px solid #E5E7EB',
      borderRadius: 8,
      background: 'white',
      transition: 'all 0.2s'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'start',
        marginBottom: 12
      }}>
        <div style={{ flex: 1 }}>
          <h4 style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#1F2937',
            marginBottom: 4
          }}>
            {application.candidateName || 'İsimsiz Aday'}
          </h4>
          <div style={{
            fontSize: 13,
            color: '#6B7280',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 4
          }}>
            <Target size={14} />
            <span>{application.jobTitle || 'İlan Bulunamadı'}</span>
          </div>
        </div>
        
        {application.overallScore && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 8,
            background: `${getScoreColor(application.overallScore)}20`,
            color: getScoreColor(application.overallScore)
          }}>
            <Award size={16} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              {application.overallScore}
            </span>
          </div>
        )}
      </div>
      
      {application.analyzedAt && (
        <div style={{
          fontSize: 12,
          color: '#9CA3AF',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <Calendar size={12} />
          <span>{formatDate(application.analyzedAt)}</span>
        </div>
      )}
    </div>
  );
};

export default UsageSessionDetailModal;
