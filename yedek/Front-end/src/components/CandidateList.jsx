/**
 * CandidateList Component
 * Displays list of uploaded candidates with their CV information
 */
import React from 'react';
import { useQuery } from '@apollo/client/react';
import { CANDIDATES_QUERY } from '../graphql/cvs';
import { User, Mail, Phone, Calendar, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CandidateList = ({ departmentFilter, statusFilter, languageFilter, searchTerm, onRefresh, onCompare }) => {
  const { t } = useTranslation();
  const { data, loading, error, refetch } = useQuery(CANDIDATES_QUERY, {
    variables: {
      departmentId: departmentFilter || null,
      status: statusFilter || null,
    },
    fetchPolicy: 'network-only',
  });

  // Selection state MUST be declared before any conditional returns to keep hook order stable
  const [selected, setSelected] = React.useState([]);

  // Refetch when onRefresh changes
  React.useEffect(() => {
    if (onRefresh) {
      refetch();
    }
  }, [onRefresh, refetch]);

  // Keep selection consistent with current list
  React.useEffect(() => {
    if (!data?.candidates) return;
    const ids = new Set((data.candidates || []).map(c => c.id));
    setSelected(prev => prev.filter(id => ids.has(id)).slice(0, 2));
  }, [data]);

  let candidates = data?.candidates || [];

  // Apply optional language and search filters (within selected department scope)
  if (languageFilter) {
    const lang = String(languageFilter).toUpperCase();
    candidates = candidates.filter(c => String(c.cvLanguage || '').toUpperCase() === lang);
  }
  if (searchTerm && searchTerm.trim()) {
    const q = searchTerm.trim().toLowerCase();
    candidates = candidates.filter(c => (
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.cvFileName || '').toLowerCase().includes(q)
    ));
  }

  // Language badge colors
  const getLanguageBadge = (language) => {
    if (!language) {
      return <span style={{ fontSize: 13, color: '#9CA3AF' }}>—</span>;
    }

    const langStyles = {
      TR: { bg: '#FEE2E2', color: '#991B1B', text: 'TR' },
      EN: { bg: '#DBEAFE', color: '#1E40AF', text: 'EN' },
      DE: { bg: '#FEF3C7', color: '#92400E', text: 'DE' },
      FR: { bg: '#E0E7FF', color: '#3730A3', text: 'FR' },
      ES: { bg: '#FCE7F3', color: '#831843', text: 'ES' },
    };

    const style = langStyles[language?.toUpperCase()] || { 
      bg: '#F3F4F6', 
      color: '#4B5563', 
      text: language?.toUpperCase() 
    };

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 10px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 700,
          background: style.bg,
          color: style.color,
          letterSpacing: '0.5px',
        }}
      >
        {style.text}
      </span>
    );
  };

  // Status badge colors
  const getStatusBadge = (status) => {
    const styles = {
      new: { bg: '#DBEAFE', color: '#1E40AF', text: t('candidateList.statusNew') },
      reviewing: { bg: '#FEF3C7', color: '#92400E', text: t('candidateList.statusReviewing') },
      interviewed: { bg: '#E0E7FF', color: '#3730A3', text: t('candidateList.statusInterviewed') },
      accepted: { bg: '#D1FAE5', color: '#065F46', text: t('candidateList.statusAccepted') },
      rejected: { bg: '#FEE2E2', color: '#991B1B', text: t('candidateList.statusRejected') },
    };

    const style = styles[status] || styles.new;

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          background: style.bg,
          color: style.color,
        }}
      >
        {style.text}
      </span>
    );
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
        <p>{t('candidateList.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#EF4444' }}>
        <p>❌ {t('candidateList.error', { message: error.message })}</p>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: 40,
          color: '#9CA3AF',
          border: '2px dashed #E5E7EB',
          borderRadius: 8,
        }}
      >
        <FileText size={48} color="#D1D5DB" style={{ margin: '0 auto 16px' }} />
        <p style={{ fontSize: 14, marginBottom: 8 }}>{t('candidateList.noCV')}</p>
        <p style={{ fontSize: 12 }}>{t('candidateList.uploadToStart')}</p>
      </div>
    );
  }

  const toggle = (id) => {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return Array.from(s).slice(0, 2); // keep max 2
    });
  };

  const canCompare = selected.length === 2;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>
            <th style={{ padding: 12 }}></th>
            <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              {t('candidateList.candidateName')}
            </th>
            <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              {t('candidateList.contact')}
            </th>
            <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              {t('candidateList.department')}
            </th>
            <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              {t('candidateList.cvLanguage')}
            </th>
            <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              {t('candidateList.cvFile')}
            </th>
            <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              {t('candidateList.uploadDate')}
            </th>
            <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              {t('candidateList.status')}
            </th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => (
            <tr
              key={candidate.id}
              style={{
                borderBottom: '1px solid #E5E7EB',
                transition: 'background 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
            >
              {/* Select */}
              <td style={{ padding: 12 }}>
                <input
                  type="checkbox"
                  checked={selected.includes(candidate.id)}
                  onChange={() => toggle(candidate.id)}
                />
              </td>
              {/* Aday Adı */}
              <td style={{ padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <User size={16} color="#6B7280" />
                  <span style={{ fontWeight: 500, color: '#1F2937' }}>
                    {candidate.name || '—'}
                  </span>
                </div>
              </td>

              {/* İletişim */}
              <td style={{ padding: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {candidate.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Mail size={14} color="#6B7280" />
                      <span style={{ fontSize: 13, color: '#4B5563' }}>{candidate.email}</span>
                    </div>
                  )}
                  {candidate.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={14} color="#6B7280" />
                      <span style={{ fontSize: 13, color: '#4B5563' }}>{candidate.phone}</span>
                    </div>
                  )}
                  {!candidate.email && !candidate.phone && (
                    <span style={{ fontSize: 13, color: '#9CA3AF' }}>—</span>
                  )}
                </div>
              </td>

              {/* Departman */}
              <td style={{ padding: 12 }}>
                <span style={{ fontSize: 13, color: '#4B5563' }}>
                  {candidate.department?.name || '—'}
                </span>
              </td>

              {/* CV Dili */}
              <td style={{ padding: 12 }}>
                {getLanguageBadge(candidate.cvLanguage)}
              </td>

              {/* CV Dosyası */}
              <td style={{ padding: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13, color: '#1F2937', fontWeight: 500 }}>
                    {candidate.cvFileName}
                  </span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                    {formatFileSize(candidate.cvFileSize)}
                  </span>
                </div>
              </td>

              {/* Yüklenme Tarihi */}
              <td style={{ padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={14} color="#6B7280" />
                  <span style={{ fontSize: 13, color: '#4B5563' }}>
                    {formatDate(candidate.uploadedAt)}
                  </span>
                </div>
              </td>

              {/* Durum */}
              <td style={{ padding: 12 }}>{getStatusBadge(candidate.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        <button
          onClick={() => onCompare && canCompare && onCompare(selected[0], selected[1])}
          disabled={!canCompare}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            background: canCompare ? '#2563EB' : '#E5E7EB',
            color: canCompare ? 'white' : '#9CA3AF',
            fontWeight: 700,
            cursor: canCompare ? 'pointer' : 'not-allowed'
          }}
        >
          {t('candidateList.compare')}
        </button>
      </div>
    </div>
  );
};

export default CandidateList;
