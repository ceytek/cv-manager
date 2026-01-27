/**
 * CandidateList Component
 * Displays list of uploaded candidates with their CV information
 */
import React from 'react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react';
import { CANDIDATES_QUERY, CANDIDATE_HAS_ANALYSIS_QUERY, DELETE_CANDIDATE_MUTATION } from '../graphql/cvs';
import { User, Mail, Phone, Calendar, FileText, Contact, Linkedin, Github, X, ExternalLink, Copy, Check, Download, Trash2, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown, Sparkles, Star } from 'lucide-react';
import AddToTalentPoolModal from './AddToTalentPoolModal';
import EditTalentPoolEntryModal from './EditTalentPoolEntryModal';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config/api';
import { getInitials } from '../utils/nameUtils';

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
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for HTTP connections
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
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

const CandidateList = ({ departmentFilter, statusFilter, languageFilter, searchTerm, talentPoolFilter, onRefresh, onCompare, viewMode = 'table' }) => {
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
  
  // Sorting state for table view
  const [sortConfig, setSortConfig] = React.useState({ key: 'uploadedAt', direction: 'desc' });
  
  // Contact card state
  const [contactCard, setContactCard] = React.useState({ open: false, candidate: null, position: { top: 0, left: 0 } });
  
  // Delete modal states
  const [deleteConfirmCandidate, setDeleteConfirmCandidate] = React.useState(null);
  const [deleteWarningCandidate, setDeleteWarningCandidate] = React.useState(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  
  // Talent Pool modal state
  const [talentPoolModal, setTalentPoolModal] = React.useState({ open: false, candidates: [] });
  
  // Edit Talent Pool Entry modal state
  const [editTalentPoolModal, setEditTalentPoolModal] = React.useState({ 
    open: false, 
    entryId: null, 
    candidateName: null 
  });
  
  // Debug: Log talent pool modal state changes
  React.useEffect(() => {
    console.log('talentPoolModal state changed:', talentPoolModal);
  }, [talentPoolModal]);
  
  // Force state update with a key
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  
  // Debug: Log when modal state changes
  React.useEffect(() => {
    console.log('deleteConfirmCandidate state changed:', deleteConfirmCandidate);
  }, [deleteConfirmCandidate]);
  
  // Delete mutation and analysis check query
  const [checkAnalysis] = useLazyQuery(CANDIDATE_HAS_ANALYSIS_QUERY);
  const [deleteCandidate] = useMutation(DELETE_CANDIDATE_MUTATION, {
    onCompleted: () => {
      refetch();
      setDeleteConfirmCandidate(null);
      setDeleteWarningCandidate(null);
      setIsDeleting(false);
    },
    onError: (error) => {
      alert(error.message);
      setIsDeleting(false);
    }
  });
  
  // Handle delete button click
  const handleDeleteClick = async (candidate, e) => {
    e.stopPropagation();
    
    try {
      // Check if candidate has analysis
      const result = await checkAnalysis({ variables: { candidateId: candidate.id } });
      console.log('Analysis check result:', result);
      console.log('Setting deleteConfirmCandidate to:', candidate);
      
      if (result?.data?.candidateHasAnalysis) {
        // Has analysis - show warning modal
        console.log('Has analysis, showing warning modal');
        setDeleteWarningCandidate(candidate);
        forceUpdate();
      } else {
        // No analysis - show simple confirm modal
        console.log('No analysis, showing confirm modal');
        setDeleteConfirmCandidate(candidate);
        forceUpdate();
      }
    } catch (error) {
      console.error('Error checking analysis:', error);
      // If error, show simple confirm modal anyway
      setDeleteConfirmCandidate(candidate);
      forceUpdate();
    }
  };
  
  // Confirm delete
  const confirmDelete = async () => {
    console.log('confirmDelete called');
    console.log('deleteConfirmCandidate:', deleteConfirmCandidate);
    console.log('deleteWarningCandidate:', deleteWarningCandidate);
    
    const candidateToDelete = deleteConfirmCandidate || deleteWarningCandidate;
    console.log('candidateToDelete:', candidateToDelete);
    
    if (!candidateToDelete) {
      console.error('No candidate to delete!');
      return;
    }
    
    setIsDeleting(true);
    console.log('Calling deleteCandidate mutation with id:', candidateToDelete.id);
    
    try {
      const result = await deleteCandidate({ variables: { id: candidateToDelete.id } });
      console.log('Delete result:', result);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

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
  
  // Apply talent pool filter
  if (talentPoolFilter) {
    candidates = candidates.filter(c => c.inTalentPool === true);
  }

  // Apply sorting for table view
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Sort candidates
  const sortedCandidates = React.useMemo(() => {
    if (!sortConfig.key) return candidates;
    
    return [...candidates].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortConfig.key) {
        case 'name':
          aVal = (a.name || '').toLowerCase();
          bVal = (b.name || '').toLowerCase();
          break;
        case 'email':
          aVal = (a.email || '').toLowerCase();
          bVal = (b.email || '').toLowerCase();
          break;
        case 'department':
          aVal = (a.department?.name || '').toLowerCase();
          bVal = (b.department?.name || '').toLowerCase();
          break;
        case 'cvLanguage':
          aVal = (a.cvLanguage || '').toLowerCase();
          bVal = (b.cvLanguage || '').toLowerCase();
          break;
        case 'cvFileSize':
          aVal = a.cvFileSize || 0;
          bVal = b.cvFileSize || 0;
          break;
        case 'uploadedAt':
          aVal = new Date(a.uploadedAt).getTime();
          bVal = new Date(b.uploadedAt).getTime();
          break;
        case 'status':
          aVal = (a.status || '').toLowerCase();
          bVal = (b.status || '').toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [candidates, sortConfig]);

  // Get sort icon for column header
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown size={14} color="#9CA3AF" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} color="#3B82F6" /> 
      : <ArrowDown size={14} color="#3B82F6" />;
  };

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

  // Get avatar background color based on name
  const getAvatarColor = (name) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1'];
    if (!name) return colors[0];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // Format relative time
  const getRelativeTime = (isoDate) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} ${t('candidateList.minutesAgo')}`;
    if (diffHours < 24) return `${diffHours} ${t('candidateList.hoursAgo')}`;
    if (diffDays < 7) return `${diffDays} ${t('candidateList.daysAgo')}`;
    return date.toLocaleDateString('tr-TR');
  };

  // Card View (Kaggle Style)
  if (viewMode === 'cards') {
    return (
      <div>
        {/* Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {sortedCandidates.map((candidate) => (
            <div
              key={candidate.id}
              onClick={(e) => {
                // Don't open card if clicking on action buttons
                if (e.target.closest('button') || e.target.closest('a')) return;
                
                const rect = e.currentTarget.getBoundingClientRect();
                setContactCard({
                  open: true,
                  candidate,
                  position: {
                    top: Math.min(rect.top + 50, window.innerHeight - 450),
                    left: Math.min(rect.left + rect.width / 2 - 160, window.innerWidth - 340),
                  }
                });
              }}
              style={{
                background: 'white',
                borderRadius: 12,
                border: '1px solid #E5E7EB',
                overflow: 'hidden',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                e.currentTarget.style.borderColor = '#D1D5DB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#E5E7EB';
              }}
            >
              {/* Card Header with Avatar */}
              <div style={{ 
                padding: '20px 20px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
              }}>
                {/* Avatar */}
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: getAvatarColor(candidate.name),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'white',
                  flexShrink: 0,
                }}>
                  {getInitials(candidate.name)}
                </div>

                {/* Name & Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#1F2937',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {candidate.name || t('candidateList.unnamed')}
                  </h3>
                  
                  {/* Email */}
                  {candidate.email && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 6,
                      color: '#6B7280',
                      fontSize: 13,
                    }}>
                      <Mail size={14} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {candidate.email}
                      </span>
                    </div>
                  )}
                  
                  {/* Phone */}
                  {candidate.phone && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 4,
                      color: '#6B7280',
                      fontSize: 13,
                    }}>
                      <Phone size={14} />
                      <span>{candidate.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Department & Language Tags */}
              <div style={{
                padding: '0 20px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}>
                {candidate.department?.name && (
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: '#F3F4F6',
                    color: '#4B5563',
                    fontSize: 12,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: candidate.department.color || '#6B7280',
                      flexShrink: 0,
                    }} />
                    {candidate.department.name}
                  </span>
                )}
                {getLanguageBadge(candidate.cvLanguage)}
              </div>

              {/* Footer */}
              <div style={{
                padding: '12px 20px',
                borderTop: '1px solid #F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                {/* Time & File info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#9CA3AF', fontSize: 12 }}>
                  <span>{t('candidateList.uploaded')} {getRelativeTime(candidate.uploadedAt)}</span>
                  <span>•</span>
                  <span>{formatFileSize(candidate.cvFileSize)}</span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {/* Talent Pool Button - Shows different state if already in pool */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (candidate.inTalentPool && candidate.talentPoolEntryId) {
                        // Already in pool - open edit modal
                        setEditTalentPoolModal({
                          open: true,
                          entryId: candidate.talentPoolEntryId,
                          candidateName: candidate.name,
                        });
                      } else {
                        // Not in pool - open add modal
                        setTalentPoolModal({ open: true, candidates: [candidate] });
                      }
                    }}
                    title={candidate.inTalentPool ? t('talentPool.editEntry') : t('talentPool.addToPool')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: candidate.inTalentPool ? '#FEF3C7' : '#EEF2FF',
                      border: candidate.inTalentPool ? '2px solid #F59E0B' : 'none',
                      color: candidate.inTalentPool ? '#D97706' : '#6366F1',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (candidate.inTalentPool) {
                        e.currentTarget.style.background = '#F59E0B';
                        e.currentTarget.style.color = 'white';
                      } else {
                        e.currentTarget.style.background = '#6366F1';
                        e.currentTarget.style.color = 'white';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (candidate.inTalentPool) {
                        e.currentTarget.style.background = '#FEF3C7';
                        e.currentTarget.style.color = '#D97706';
                      } else {
                        e.currentTarget.style.background = '#EEF2FF';
                        e.currentTarget.style.color = '#6366F1';
                      }
                    }}
                  >
                    {candidate.inTalentPool ? <Star size={16} fill="currentColor" /> : <Sparkles size={16} />}
                  </button>
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDeleteClick(candidate, e)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: '#FEE2E2',
                      border: 'none',
                      color: '#DC2626',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#DC2626';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#FEE2E2';
                      e.currentTarget.style.color = '#DC2626';
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                  
                  {/* Download Button */}
                  <a
                    href={`${API_BASE_URL}${candidate.cvFilePath?.replace('/app', '') || ''}`}
                    download={candidate.cvFileName}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: '#F3F4F6',
                      textDecoration: 'none',
                      color: '#374151',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#3B82F6';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#F3F4F6';
                      e.currentTarget.style.color = '#374151';
                    }}
                    title={t('candidateList.downloadCV')}
                  >
                    <Download size={18} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Compare Footer */}
        {sortedCandidates.length > 0 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginTop: 32,
            padding: '16px 0',
            borderTop: '1px solid #E5E7EB',
          }}>
            <span style={{ color: '#9CA3AF', fontSize: 14 }}>
              {t('candidateList.totalCandidates', { count: sortedCandidates.length })}
            </span>
          </div>
        )}
        
        {/* Contact Card Popup */}
        {contactCard.open && contactCard.candidate && (
          <ContactCard
            candidate={contactCard.candidate}
            position={contactCard.position}
            onClose={() => setContactCard({ open: false, candidate: null, position: { top: 0, left: 0 } })}
          />
        )}
        
        {/* Delete Confirmation Modal (No Analysis) - Card View */}
        {deleteConfirmCandidate && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}>
            <div style={{
              background: 'white',
              borderRadius: 16,
              padding: 24,
              maxWidth: 400,
              width: '90%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Trash2 size={24} color="#DC2626" />
                </div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1F2937' }}>
                  {t('candidateList.deleteTitle')}
                </h3>
              </div>
              <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
                <strong>"{deleteConfirmCandidate.name}"</strong> {t('candidateList.deleteConfirm')}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setDeleteConfirmCandidate(null)}
                  disabled={isDeleting}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: '1px solid #D1D5DB',
                    background: 'white',
                    color: '#374151',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#DC2626',
                    color: 'white',
                    fontWeight: 600,
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    opacity: isDeleting ? 0.7 : 1,
                  }}
                >
                  {isDeleting ? t('common.deleting') : t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete Warning Modal (Has Analysis) - Card View */}
        {deleteWarningCandidate && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}>
            <div style={{
              background: 'white',
              borderRadius: 16,
              padding: 24,
              maxWidth: 450,
              width: '90%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#FEF3C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <AlertTriangle size={24} color="#D97706" />
                </div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1F2937' }}>
                  {t('candidateList.deleteWarning')}
                </h3>
              </div>
              <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
                <strong>"{deleteWarningCandidate.name}"</strong> {t('candidateList.deleteWarningMessage')}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setDeleteWarningCandidate(null)}
                  disabled={isDeleting}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: '1px solid #D1D5DB',
                    background: 'white',
                    color: '#374151',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#DC2626',
                    color: 'white',
                    fontWeight: 600,
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    opacity: isDeleting ? 0.7 : 1,
                  }}
                >
                {isDeleting ? t('common.deleting') : t('candidateList.deleteAnyway')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add to Talent Pool Modal - Card View */}
      <AddToTalentPoolModal
        isOpen={talentPoolModal.open}
        onClose={() => setTalentPoolModal({ open: false, candidates: [] })}
        onSuccess={() => {
          setTalentPoolModal({ open: false, candidates: [] });
          refetch(); // Refresh to update inTalentPool status
        }}
        candidates={talentPoolModal.candidates}
      />
      
      {/* Edit Talent Pool Entry Modal - Card View */}
      <EditTalentPoolEntryModal
        isOpen={editTalentPoolModal.open}
        onClose={() => setEditTalentPoolModal({ open: false, entryId: null, candidateName: null })}
        onSuccess={(action) => {
          setEditTalentPoolModal({ open: false, entryId: null, candidateName: null });
          refetch(); // Refresh to update inTalentPool status
        }}
        entryId={editTalentPoolModal.entryId}
        candidateName={editTalentPoolModal.candidateName}
      />
    </div>
  );
}

  // Table View (Original)
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>
            <th style={{ padding: 12, width: 40 }}></th>
            <th 
              onClick={() => handleSort('name')}
              style={{ 
                padding: 12, 
                textAlign: 'left', 
                fontWeight: 600, 
                color: sortConfig.key === 'name' ? '#3B82F6' : '#374151',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'color 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {t('candidateList.candidateName')}
                {getSortIcon('name')}
              </div>
            </th>
            <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151', width: 60 }}>
              {t('candidateList.contact')}
            </th>
            <th 
              onClick={() => handleSort('department')}
              style={{ 
                padding: 12, 
                textAlign: 'left', 
                fontWeight: 600, 
                color: sortConfig.key === 'department' ? '#3B82F6' : '#374151',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'color 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {t('candidateList.department')}
                {getSortIcon('department')}
              </div>
            </th>
            <th 
              onClick={() => handleSort('cvLanguage')}
              style={{ 
                padding: 12, 
                textAlign: 'left', 
                fontWeight: 600, 
                color: sortConfig.key === 'cvLanguage' ? '#3B82F6' : '#374151',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'color 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {t('candidateList.cvLanguage')}
                {getSortIcon('cvLanguage')}
              </div>
            </th>
            <th 
              onClick={() => handleSort('cvFileSize')}
              style={{ 
                padding: 12, 
                textAlign: 'left', 
                fontWeight: 600, 
                color: sortConfig.key === 'cvFileSize' ? '#3B82F6' : '#374151',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'color 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {t('candidateList.cvFile')}
                {getSortIcon('cvFileSize')}
              </div>
            </th>
            <th 
              onClick={() => handleSort('uploadedAt')}
              style={{ 
                padding: 12, 
                textAlign: 'left', 
                fontWeight: 600, 
                color: sortConfig.key === 'uploadedAt' ? '#3B82F6' : '#374151',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'color 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {t('candidateList.uploadDate')}
                {getSortIcon('uploadedAt')}
              </div>
            </th>
            <th 
              onClick={() => handleSort('status')}
              style={{ 
                padding: 12, 
                textAlign: 'left', 
                fontWeight: 600, 
                color: sortConfig.key === 'status' ? '#3B82F6' : '#374151',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'color 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {t('candidateList.status')}
                {getSortIcon('status')}
              </div>
            </th>
            <th style={{ padding: 12, width: 60 }}></th>
          </tr>
        </thead>
        <tbody>
          {sortedCandidates.map((candidate) => (
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
                <span style={{ fontSize: 13, color: '#4B5563', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {candidate.department && (
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: candidate.department.color || '#6B7280',
                      flexShrink: 0,
                    }} />
                  )}
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
                  href={`${API_BASE_URL}${candidate.cvFilePath?.replace('/app', '') || ''}`}
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

              {/* Actions */}
              <td style={{ padding: 12 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {/* Talent Pool Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (candidate.inTalentPool && candidate.talentPoolEntryId) {
                        setEditTalentPoolModal({
                          open: true,
                          entryId: candidate.talentPoolEntryId,
                          candidateName: candidate.name,
                        });
                      } else {
                        setTalentPoolModal({ open: true, candidates: [candidate] });
                      }
                    }}
                    title={candidate.inTalentPool ? t('talentPool.editEntry') : t('talentPool.addToPool')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: candidate.inTalentPool ? '#FEF3C7' : '#EEF2FF',
                      border: candidate.inTalentPool ? '2px solid #F59E0B' : 'none',
                      color: candidate.inTalentPool ? '#D97706' : '#6366F1',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (candidate.inTalentPool) {
                        e.currentTarget.style.background = '#F59E0B';
                        e.currentTarget.style.color = 'white';
                      } else {
                        e.currentTarget.style.background = '#6366F1';
                        e.currentTarget.style.color = 'white';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (candidate.inTalentPool) {
                        e.currentTarget.style.background = '#FEF3C7';
                        e.currentTarget.style.color = '#D97706';
                      } else {
                        e.currentTarget.style.background = '#EEF2FF';
                        e.currentTarget.style.color = '#6366F1';
                      }
                    }}
                  >
                    {candidate.inTalentPool ? <Star size={14} fill="currentColor" /> : <Sparkles size={14} />}
                  </button>
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDeleteClick(candidate, e)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: '#FEE2E2',
                      border: 'none',
                      color: '#DC2626',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#DC2626';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#FEE2E2';
                      e.currentTarget.style.color = '#DC2626';
                    }}
                    title={t('common.delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        {/* Bulk Add to Talent Pool Button */}
        {selected.length > 0 && (
          <button
            onClick={() => {
              const selectedCandidates = candidates.filter(c => selected.includes(c.id));
              setTalentPoolModal({ open: true, candidates: selectedCandidates });
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#6366F1',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Sparkles size={16} />
            {t('talentPool.addToPool')} ({selected.length})
          </button>
        )}
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
      
      {/* Delete Confirmation Modal (No Analysis) */}
      {deleteConfirmCandidate && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 24,
            maxWidth: 400,
            width: '90%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Trash2 size={24} color="#DC2626" />
              </div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1F2937' }}>
                {t('candidateList.deleteTitle')}
              </h3>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
              <strong>"{deleteConfirmCandidate.name}"</strong> {t('candidateList.deleteConfirm')}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirmCandidate(null)}
                disabled={isDeleting}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: '1px solid #D1D5DB',
                  background: 'white',
                  color: '#374151',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#DC2626',
                  color: 'white',
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                {isDeleting ? t('common.deleting') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Warning Modal (Has Analysis) */}
      {deleteWarningCandidate && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 24,
            maxWidth: 450,
            width: '90%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <AlertTriangle size={24} color="#D97706" />
              </div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1F2937' }}>
                {t('candidateList.deleteWarningTitle')}
              </h3>
            </div>
            <div style={{
              padding: 16,
              background: '#FEF3C7',
              borderRadius: 12,
              marginBottom: 20,
            }}>
              <p style={{ margin: 0, fontSize: 14, color: '#92400E', lineHeight: 1.6 }}>
                <strong>"{deleteWarningCandidate.name}"</strong> {t('candidateList.deleteWarningMessage')}
              </p>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6B7280' }}>
              {t('candidateList.deleteWarningConfirm')}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteWarningCandidate(null)}
                disabled={isDeleting}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: '1px solid #D1D5DB',
                  background: 'white',
                  color: '#374151',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#DC2626',
                  color: 'white',
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                {isDeleting ? t('common.deleting') : t('candidateList.deleteAnyway')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add to Talent Pool Modal */}
      <AddToTalentPoolModal
        isOpen={talentPoolModal.open}
        onClose={() => setTalentPoolModal({ open: false, candidates: [] })}
        onSuccess={() => {
          setTalentPoolModal({ open: false, candidates: [] });
          refetch(); // Refresh to update inTalentPool status
        }}
        candidates={talentPoolModal.candidates}
      />
      
      {/* Edit Talent Pool Entry Modal - Table View */}
      <EditTalentPoolEntryModal
        isOpen={editTalentPoolModal.open}
        onClose={() => setEditTalentPoolModal({ open: false, entryId: null, candidateName: null })}
        onSuccess={(action) => {
          setEditTalentPoolModal({ open: false, entryId: null, candidateName: null });
          refetch(); // Refresh to update inTalentPool status
        }}
        entryId={editTalentPoolModal.entryId}
        candidateName={editTalentPoolModal.candidateName}
      />
    </div>
  );
};

export default CandidateList;
