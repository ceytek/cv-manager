/**
 * CV Management Page (Welcome → Upload)
 * First shows two buttons: "CV Listesi" and "CV Upload". Upload opens existing page content.
 * Supports initialView prop to land directly on 'upload' or 'list' from Dashboard quick actions.
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Upload as UploadIcon, CheckCircle, Download, Mail, Phone, Linkedin, Github, User, List, LayoutGrid, ArrowUpDown, ArrowUp, ArrowDown, Star } from 'lucide-react';
import CVUploader from './CVUploader';
import CandidateList from './CandidateList';
import CVCompareView from './CVCompareView';
import { API_BASE_URL } from '../config/api';

// Pagination settings for session uploads
const SESSION_UPLOADS_PER_PAGE = 5;

const CVPage = ({ departments, initialView = 'list' }) => {
  const { t } = useTranslation();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // Convert 'welcome' to 'list' for backwards compatibility
  const [view, setView] = useState(initialView === 'welcome' ? 'list' : initialView); // 'upload' | 'list'
  const [deptId, setDeptId] = useState('');
  const [lang, setLang] = useState(''); // TR/EN/..
  const [search, setSearch] = useState('');
  const [talentPoolFilter, setTalentPoolFilter] = useState(false); // Filter by talent pool
  const [comparePair, setComparePair] = useState(null); // {a,b}
  
  // Session-based uploaded files (cleared on page leave/refresh)
  const [sessionUploads, setSessionUploads] = useState([]);
  
  // Pagination for session uploads
  const [sessionPage, setSessionPage] = useState(1);
  const sessionTotalPages = Math.ceil(sessionUploads.length / SESSION_UPLOADS_PER_PAGE);
  const sessionStartIndex = (sessionPage - 1) * SESSION_UPLOADS_PER_PAGE;
  const paginatedSessionUploads = sessionUploads.slice(sessionStartIndex, sessionStartIndex + SESSION_UPLOADS_PER_PAGE);
  
  // View mode for candidates list (cards or list/table)
  const [candidateViewMode, setCandidateViewMode] = useState('cards');

  // If parent changes initialView (e.g., dashboard quick action), sync it here
  useEffect(() => {
    if (initialView) {
      // Convert 'welcome' to 'list' for backwards compatibility
      const targetView = initialView === 'welcome' ? 'list' : initialView;
      if (['upload', 'list'].includes(targetView)) {
        setView(targetView);
      }
    }
  }, [initialView]);
  
  // Clear session uploads when leaving upload view
  useEffect(() => {
    if (view !== 'upload') {
      setSessionUploads([]);
    }
  }, [view]);

  const handleUploadComplete = (result) => {
    console.log('Upload complete:', result);
    // Add successful uploads to session list
    if (result.successful && result.successful.length > 0) {
      const newUploads = result.successful.map(file => ({
        ...file,
        uploadedAt: new Date().toISOString(),
      }));
      setSessionUploads(prev => [...newUploads, ...prev]);
    }
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (view === 'upload') {
    return (
      <div style={{ padding: 24 }}>
        {/* Header */}
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1F2937', marginBottom: 8 }}>
              {t('cvManagement.title')}
            </h1>
            <p style={{ fontSize: 14, color: '#6B7280' }}>
              {t('cvManagement.viewManageSubtitle')}
            </p>
          </div>
          <button
            onClick={() => setView('list')}
            style={{ padding: '10px 16px', background: 'white', border: '1px solid #D1D5DB', borderRadius: 8, fontWeight: 600, color: '#374151', cursor: 'pointer' }}
          >
            ← {t('cvManagement.backToList')}
          </button>
        </div>

        {/* Upload Section */}
        <div
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: 32,
          }}
        >
          <CVUploader onUploadComplete={handleUploadComplete} departments={departments} />
        </div>

        {/* Session Upload List - Only shows CVs uploaded in this session */}
        {sessionUploads.length > 0 && (
          <div
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 24,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1F2937' }}>
                {t('cvManagement.uploadedInSession')} ({sessionUploads.length})
              </h2>
              <button
                onClick={() => { setSessionUploads([]); setSessionPage(1); }}
                style={{
                  padding: '6px 12px',
                  background: '#F3F4F6',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  color: '#6B7280',
                  cursor: 'pointer',
                }}
              >
                {t('cvManagement.clearList')}
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {paginatedSessionUploads.map((file, index) => (
                <div
                  key={sessionStartIndex + index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <CheckCircle size={24} color="#22C55E" />
                    
                    {/* File Icon */}
                    {file.fileName?.toLowerCase().endsWith('.pdf') ? (
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#DC2626"/>
                        <path d="M14 2V8H20" fill="#FCA5A5"/>
                        <text x="12" y="17" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">PDF</text>
                      </svg>
                    ) : (
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#2563EB"/>
                        <path d="M14 2V8H20" fill="#93C5FD"/>
                        <text x="12" y="17" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">DOC</text>
                      </svg>
                    )}
                    
                    {/* Candidate Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {/* Name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <User size={16} color="#374151" />
                        <span style={{ fontSize: 15, fontWeight: 600, color: '#1F2937' }}>
                          {file.candidateName || file.fileName}
                        </span>
                      </div>
                      
                      {/* Contact Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        {file.candidateEmail && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Mail size={12} color="#6B7280" />
                            <span style={{ fontSize: 12, color: '#6B7280' }}>{file.candidateEmail}</span>
                          </div>
                        )}
                        {file.candidatePhone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Phone size={12} color="#6B7280" />
                            <span style={{ fontSize: 12, color: '#6B7280' }}>{file.candidatePhone}</span>
                          </div>
                        )}
                        {file.candidateLinkedin && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Linkedin size={12} color="#0A66C2" />
                            <span style={{ fontSize: 12, color: '#0A66C2' }}>LinkedIn</span>
                          </div>
                        )}
                        {file.candidateGithub && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Github size={12} color="#24292F" />
                            <span style={{ fontSize: 12, color: '#24292F' }}>GitHub</span>
                          </div>
                        )}
                      </div>
                      
                      {/* File info */}
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                        {formatFileSize(file.fileSize)} • {new Date(file.uploadedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  
                  <a
                    href={`${API_BASE_URL}${file.filePath}`}
                    download={file.fileName}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      background: 'white',
                      border: '1px solid #D1D5DB',
                      borderRadius: 8,
                      textDecoration: 'none',
                      color: '#374151',
                      fontSize: 13,
                      fontWeight: 500,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F3F4F6';
                      e.currentTarget.style.borderColor = '#9CA3AF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderColor = '#D1D5DB';
                    }}
                  >
                    <Download size={16} />
                    {t('cvManagement.download')}
                  </a>
                </div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {sessionTotalPages > 1 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: 8, 
                marginTop: 20,
                paddingTop: 16,
                borderTop: '1px solid #E5E7EB',
              }}>
                <button
                  onClick={() => setSessionPage(p => Math.max(1, p - 1))}
                  disabled={sessionPage === 1}
                  style={{
                    padding: '8px 14px',
                    background: sessionPage === 1 ? '#F3F4F6' : 'white',
                    border: '1px solid #D1D5DB',
                    borderRadius: 8,
                    cursor: sessionPage === 1 ? 'not-allowed' : 'pointer',
                    color: sessionPage === 1 ? '#9CA3AF' : '#374151',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  ← {t('cvManagement.previous') || 'Önceki'}
                </button>
                
                <span style={{ fontSize: 14, color: '#6B7280', padding: '0 12px' }}>
                  {sessionPage} / {sessionTotalPages}
                </span>
                
                <button
                  onClick={() => setSessionPage(p => Math.min(sessionTotalPages, p + 1))}
                  disabled={sessionPage === sessionTotalPages}
                  style={{
                    padding: '8px 14px',
                    background: sessionPage === sessionTotalPages ? '#F3F4F6' : 'white',
                    border: '1px solid #D1D5DB',
                    borderRadius: 8,
                    cursor: sessionPage === sessionTotalPages ? 'not-allowed' : 'pointer',
                    color: sessionPage === sessionTotalPages ? '#9CA3AF' : '#374151',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {t('cvManagement.next') || 'Sonraki'} →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div style={{ padding: 24 }}>
        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1F2937', marginBottom: 8 }}>{t('cvManagement.title')}</h1>
            <p style={{ fontSize: 14, color: '#6B7280' }}>{t('cvManagement.cvListSubtitle')}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* View Mode Toggle */}
            <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 8, padding: 4 }}>
              <button
                onClick={() => setCandidateViewMode('list')}
                style={{
                  padding: '8px 14px',
                  background: candidateViewMode === 'list' ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  color: candidateViewMode === 'list' ? '#111827' : '#6B7280',
                  boxShadow: candidateViewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <List size={16} />
                {t('cvManagement.listView', 'Liste')}
              </button>
              <button
                onClick={() => setCandidateViewMode('cards')}
                style={{
                  padding: '8px 14px',
                  background: candidateViewMode === 'cards' ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  color: candidateViewMode === 'cards' ? '#111827' : '#6B7280',
                  boxShadow: candidateViewMode === 'cards' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <LayoutGrid size={16} />
                {t('cvManagement.cardView', 'Kart')}
              </button>
            </div>
            
            {/* Upload Button */}
            <button 
              onClick={() => setView('upload')} 
              style={{ 
                padding: '12px 20px', 
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', 
                border: 'none', 
                borderRadius: 10, 
                fontWeight: 600, 
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }}
            >
              <UploadIcon size={18} />
              {t('cvManagement.uploadNewCV')}
            </button>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div style={{ 
          background: 'white', 
          borderRadius: 24, 
          padding: '12px 20px',
          marginBottom: 24, 
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #E5E7EB',
        }}>
          {/* Search Input */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder={t('cvManagement.searchCandidates')} 
              style={{ 
                flex: 1,
                border: 'none', 
                outline: 'none',
                fontSize: 15,
                color: '#1F2937',
                background: 'transparent',
              }} 
            />
          </div>
          
          {/* Filters Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderLeft: '1px solid #E5E7EB', paddingLeft: 16 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
              <line x1="4" y1="21" x2="4" y2="14"/>
              <line x1="4" y1="10" x2="4" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12" y2="3"/>
              <line x1="20" y1="21" x2="20" y2="16"/>
              <line x1="20" y1="12" x2="20" y2="3"/>
              <line x1="1" y1="14" x2="7" y2="14"/>
              <line x1="9" y1="8" x2="15" y2="8"/>
              <line x1="17" y1="16" x2="23" y2="16"/>
            </svg>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>{t('cvManagement.filters')}</span>
          </div>
        </div>

        {/* Filter Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          <button
            onClick={() => setDeptId('')}
            style={{
              padding: '8px 16px',
              borderRadius: 20,
              border: deptId === '' ? '2px solid #1F2937' : '1px solid #E5E7EB',
              background: deptId === '' ? '#1F2937' : 'white',
              color: deptId === '' ? 'white' : '#374151',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {t('cvManagement.allCandidates')}
          </button>
          {(departments || []).map((d) => (
            <button
              key={d.id}
              onClick={() => setDeptId(d.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: deptId === d.id ? '2px solid #1F2937' : '1px solid #E5E7EB',
                background: deptId === d.id ? '#1F2937' : 'white',
                color: deptId === d.id ? 'white' : '#374151',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: d.color || '#6B7280',
                flexShrink: 0,
              }} />
              {d.name}
            </button>
          ))}
          
          {/* Talent Pool Filter */}
          <button
            onClick={() => setTalentPoolFilter(!talentPoolFilter)}
            style={{
              padding: '8px 14px',
              borderRadius: 20,
              border: talentPoolFilter ? '2px solid #F59E0B' : '1px solid #E5E7EB',
              background: talentPoolFilter ? '#FEF3C7' : 'white',
              color: talentPoolFilter ? '#D97706' : '#6B7280',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Star size={14} fill={talentPoolFilter ? '#D97706' : 'none'} />
            {t('talentPool.inPool')}
          </button>
          
          {/* Language Filter */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {['', 'TR', 'EN', 'DE'].map((l) => (
              <button
                key={l || 'all'}
                onClick={() => setLang(l)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 20,
                  border: lang === l ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                  background: lang === l ? '#EFF6FF' : 'white',
                  color: lang === l ? '#1D4ED8' : '#6B7280',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {l || t('cvManagement.allLang')}
              </button>
            ))}
          </div>
        </div>

        {/* Candidate List - always visible */}
        <CandidateList
          departmentFilter={deptId || null}
          statusFilter={null}
          languageFilter={lang}
          searchTerm={search}
          talentPoolFilter={talentPoolFilter}
          onCompare={(a, b, nameA, nameB) => setComparePair({ a, b, nameA, nameB })}
          viewMode={candidateViewMode}
        />

        {/* Compare Modal Overlay */}
        {comparePair && (
          <div
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setComparePair(null); }}
          >
            <div style={{
              background: 'white',
              borderRadius: 20,
              width: '100%',
              maxWidth: 1200,
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            }}>
              <CVCompareView
                candidateId1={comparePair.a}
                candidateId2={comparePair.b}
                candidateName1={comparePair.nameA}
                candidateName2={comparePair.nameB}
                onBack={() => setComparePair(null)}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default - should not reach here, but return list view
  return null;
};

export default CVPage;
