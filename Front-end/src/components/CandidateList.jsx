/**
 * CandidateList Component
 * Displays list of uploaded candidates with their CV information
 */
import React from 'react';
import { useQuery } from '@apollo/client/react';
import { CANDIDATES_QUERY } from '../graphql/cvs';
import { User, Mail, Phone, Calendar, FileText, Contact, Linkedin, Github, X, ExternalLink, Copy, Check, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config/api';

// Contact Card Component
const ContactCard = ({ candidate, onClose, position }) => {
  const cardRef = React.useRef(null);
  const [copiedField, setCopiedField] = React.useState(null);
  
  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Copy to clipboard function
  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Get avatar background color based on name
  const getAvatarColor = (name) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div
      ref={cardRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 9999,
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
        width: 320,
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      {/* Header with gradient */}
      <div style={{
        background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
        padding: '24px 20px 40px',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: 8,
            padding: 6,
            cursor: 'pointer',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>
      
      {/* Avatar - positioned to overlap header and content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: -36,
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: getAvatarColor(candidate.name),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          fontWeight: 700,
          color: 'white',
          border: '4px solid white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          {getInitials(candidate.name)}
        </div>
        <h3 style={{
          margin: '12px 0 4px',
          fontSize: 18,
          fontWeight: 600,
          color: '#1F2937',
        }}>
          {candidate.name || 'İsimsiz Aday'}
        </h3>
        {candidate.location && (
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
            📍 {candidate.location}
          </p>
        )}
      </div>

      {/* Contact Info */}
      <div style={{ padding: '20px' }}>
        {/* Email */}
        <div 
          onClick={() => candidate.email && copyToClipboard(candidate.email, 'email')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 12px',
            marginBottom: 8,
            borderRadius: 10,
            background: '#F3F4F6',
            cursor: candidate.email ? 'pointer' : 'default',
            transition: 'all 0.2s',
            opacity: candidate.email ? 1 : 0.5,
          }}
          onMouseEnter={(e) => candidate.email && (e.currentTarget.style.background = '#E5E7EB')}
          onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
        >
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: '#DBEAFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Mail size={18} color="#2563EB" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>E-posta</div>
            <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {candidate.email || '—'}
            </div>
          </div>
          {candidate.email && (
            copiedField === 'email' ? <Check size={14} color="#10B981" /> : <Copy size={14} color="#9CA3AF" />
          )}
        </div>

        {/* Phone */}
        <div 
          onClick={() => candidate.phone && copyToClipboard(candidate.phone, 'phone')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 12px',
            marginBottom: 8,
            borderRadius: 10,
            background: '#F3F4F6',
            cursor: candidate.phone ? 'pointer' : 'default',
            transition: 'all 0.2s',
            opacity: candidate.phone ? 1 : 0.5,
          }}
          onMouseEnter={(e) => candidate.phone && (e.currentTarget.style.background = '#E5E7EB')}
          onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
        >
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: '#D1FAE5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Phone size={18} color="#059669" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>Telefon</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{candidate.phone || '—'}</div>
          </div>
          {candidate.phone && (
            copiedField === 'phone' ? <Check size={14} color="#10B981" /> : <Copy size={14} color="#9CA3AF" />
          )}
        </div>

        {/* LinkedIn */}
        <div 
          onClick={() => candidate.linkedin && copyToClipboard(candidate.linkedin, 'linkedin')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 12px',
            marginBottom: 8,
            borderRadius: 10,
            background: '#F3F4F6',
            cursor: candidate.linkedin ? 'pointer' : 'default',
            transition: 'all 0.2s',
            opacity: candidate.linkedin ? 1 : 0.5,
          }}
          onMouseEnter={(e) => candidate.linkedin && (e.currentTarget.style.background = '#E5E7EB')}
          onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
        >
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: '#DBEAFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Linkedin size={18} color="#0A66C2" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>LinkedIn</div>
            <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {candidate.linkedin ? candidate.linkedin.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//i, '') : '—'}
            </div>
          </div>
          {candidate.linkedin && (
            copiedField === 'linkedin' ? <Check size={14} color="#10B981" /> : <Copy size={14} color="#9CA3AF" />
          )}
        </div>

        {/* GitHub */}
        <div 
          onClick={() => candidate.github && copyToClipboard(candidate.github, 'github')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 12px',
            marginBottom: 8,
            borderRadius: 10,
            background: '#F3F4F6',
            cursor: candidate.github ? 'pointer' : 'default',
            transition: 'all 0.2s',
            opacity: candidate.github ? 1 : 0.5,
          }}
          onMouseEnter={(e) => candidate.github && (e.currentTarget.style.background = '#E5E7EB')}
          onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
        >
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: '#F3E8FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Github size={18} color="#24292F" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>GitHub</div>
            <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {candidate.github ? candidate.github.replace(/https?:\/\/(www\.)?github\.com\//i, '') : '—'}
            </div>
          </div>
          {candidate.github && (
            copiedField === 'github' ? <Check size={14} color="#10B981" /> : <Copy size={14} color="#9CA3AF" />
          )}
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

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
  
  // Contact card state
  const [contactCard, setContactCard] = React.useState({ open: false, candidate: null, position: { top: 0, left: 0 } });

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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setContactCard({
                      open: true,
                      candidate,
                      position: {
                        top: Math.min(rect.bottom + 8, window.innerHeight - 450),
                        left: Math.min(rect.left, window.innerWidth - 340),
                      }
                    });
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: '1px solid #E5E7EB',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#EFF6FF';
                    e.currentTarget.style.borderColor = '#3B82F6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}
                  title="İletişim Kartı"
                >
                  <Contact size={18} color="#3B82F6" />
                </button>
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
                <a
                  href={`${API_BASE_URL}${candidate.cvFilePath}`}
                  download={candidate.cvFileName}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: candidate.cvFileName?.toLowerCase().endsWith('.pdf') ? '#FEE2E2' : '#DBEAFE',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: 'fit-content',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  title={candidate.cvFileName}
                >
                  {candidate.cvFileName?.toLowerCase().endsWith('.pdf') ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#DC2626"/>
                      <path d="M14 2V8H20" fill="#FCA5A5"/>
                      <text x="12" y="17" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">PDF</text>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#2563EB"/>
                      <path d="M14 2V8H20" fill="#93C5FD"/>
                      <text x="12" y="17" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">DOC</text>
                    </svg>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>
                      {formatFileSize(candidate.cvFileSize)}
                    </span>
                  </div>
                  <Download size={14} color="#6B7280" />
                </a>
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
      
      {/* Contact Card Popup */}
      {contactCard.open && contactCard.candidate && (
        <ContactCard
          candidate={contactCard.candidate}
          position={contactCard.position}
          onClose={() => setContactCard({ open: false, candidate: null, position: { top: 0, left: 0 } })}
        />
      )}
    </div>
  );
};

export default CandidateList;
