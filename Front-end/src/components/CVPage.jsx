/**
 * CV Management Page (Welcome → Upload)
 * First shows two buttons: "CV Listesi" and "CV Upload". Upload opens existing page content.
 * Supports initialView prop to land directly on 'upload' or 'list' from Dashboard quick actions.
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Upload as UploadIcon, CheckCircle, Download, Mail, Phone, Linkedin, Github, User } from 'lucide-react';
import CVUploader from './CVUploader';
import CandidateList from './CandidateList';
import CVCompareView from './CVCompareView';

const CVPage = ({ departments, initialView = 'welcome' }) => {
  const { t } = useTranslation();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [view, setView] = useState(initialView); // 'welcome' | 'upload' | 'list'
  const [deptId, setDeptId] = useState('');
  const [lang, setLang] = useState(''); // TR/EN/..
  const [search, setSearch] = useState('');
  const [comparePair, setComparePair] = useState(null); // {a,b}
  
  // Session-based uploaded files (cleared on page leave/refresh)
  const [sessionUploads, setSessionUploads] = useState([]);

  // If parent changes initialView (e.g., dashboard quick action), sync it here
  useEffect(() => {
    if (initialView && ['welcome', 'upload', 'list'].includes(initialView)) {
      setView(initialView);
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
            onClick={() => setView('welcome')}
            style={{ padding: '10px 16px', background: 'white', border: '1px solid #D1D5DB', borderRadius: 8, fontWeight: 600, color: '#374151' }}
          >
            ← {t('cvManagement.back')}
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
                onClick={() => setSessionUploads([])}
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
              {sessionUploads.map((file, index) => (
                <div
                  key={index}
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
                    href={`http://localhost:8000${file.filePath}`}
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
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1F2937', marginBottom: 8 }}>{t('cvManagement.cvListTitle')}</h1>
            <p style={{ fontSize: 14, color: '#6B7280' }}>{t('cvManagement.cvListSubtitle')}</p>
          </div>
          <button onClick={() => setView('welcome')} style={{ padding: '10px 16px', background: 'white', border: '1px solid #D1D5DB', borderRadius: 8, fontWeight: 600, color: '#374151' }}>← {t('cvManagement.back')}</button>
        </div>

        {/* Filters */}
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 220px 280px', gap: 12 }}>
          {/* Department select (required) */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 6 }}>{t('cvManagement.selectDepartment')}</label>
            <select value={deptId} onChange={(e) => setDeptId(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8 }}>
              <option value="">{t('cvManagement.selectDepartmentPlaceholder')}</option>
              {(departments || []).map((d) => (
                <option value={d.id} key={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Language select */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 6 }}>{t('cvManagement.cvLanguage')}</label>
            <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8 }}>
              <option value="">{t('cvManagement.all')}</option>
              <option value="TR">TR</option>
              <option value="EN">EN</option>
              <option value="DE">DE</option>
              <option value="FR">FR</option>
              <option value="ES">ES</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 6 }}>{t('cvManagement.search')}</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('cvManagement.searchPlaceholder')} style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8 }} />
          </div>
        </div>

        {/* List or Compare */}
        {deptId ? (
          comparePair ? (
            <div style={{ background: 'white', borderRadius: 12, padding: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <CVCompareView
                candidateId1={comparePair.a}
                candidateId2={comparePair.b}
                onBack={() => setComparePair(null)}
              />
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1F2937', marginBottom: 16 }}>{t('cvManagement.candidateCVs')}</h2>
              <CandidateList
                departmentFilter={deptId}
                statusFilter={null}
                languageFilter={lang}
                searchTerm={search}
                onCompare={(a, b) => setComparePair({ a, b })}
              />
            </div>
          )
        ) : (
          <div style={{ border: '2px dashed #E5E7EB', borderRadius: 12, padding: 24, color: '#9CA3AF', textAlign: 'center' }}>
            {t('cvManagement.selectDepartmentPrompt')}
          </div>
        )}
      </div>
    );
  }

  // Welcome view with two buttons
  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1F2937', marginBottom: 8 }}>{t('cvManagement.title')}</h1>
        <p style={{ fontSize: 16, color: '#6B7280' }}>{t('cvManagement.subtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* CV Listesi Card */}
        <Card
          icon={<FileText size={48} color="#2563EB" />}
          title={t('cvManagement.cvListCard.title')}
          description={t('cvManagement.cvListCard.description')}
          buttonText={t('cvManagement.cvListCard.button')}
          onClick={() => setView('list')}
        />

        {/* CV Upload Card */}
        <Card
          icon={<UploadIcon size={48} color="#10B981" />}
          title={t('cvManagement.cvUploadCard.title')}
          description={t('cvManagement.cvUploadCard.description')}
          buttonText={t('cvManagement.cvUploadCard.button')}
          onClick={() => setView('upload')}
        />
      </div>
    </div>
  );
};

const Card = ({ icon, title, description, buttonText, onClick }) => {
  const [hover, setHover] = useState(false);
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 16,
        padding: 24,
        border: '1px solid #E5E7EB',
        transition: 'all 0.2s ease',
        transform: hover ? 'translateY(-4px)' : 'none',
        boxShadow: hover ? '0 12px 24px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.06)'
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{
        width: 80, height: 80, borderRadius: 16, background: '#F3F4F6',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
      }}>{icon}</div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 16, lineHeight: 1.6 }}>{description}</p>
      <button
        onClick={onClick}
        style={{
          width: '100%', padding: '10px 16px', background: hover ? '#3B82F6' : '#2563EB', color: 'white',
          border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer'
        }}
      >
        {buttonText}
      </button>
    </div>
  );
};

export default CVPage;
