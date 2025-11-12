/**
 * CV Management Page (Welcome → Upload)
 * First shows two buttons: "CV Listesi" and "CV Upload". Upload opens existing page content.
 * Supports initialView prop to land directly on 'upload' or 'list' from Dashboard quick actions.
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Upload as UploadIcon } from 'lucide-react';
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

  // If parent changes initialView (e.g., dashboard quick action), sync it here
  useEffect(() => {
    if (initialView && ['welcome', 'upload', 'list'].includes(initialView)) {
      setView(initialView);
    }
  }, [initialView]);

  const handleUploadComplete = (result) => {
    console.log('Upload complete:', result);
    setRefreshTrigger(prev => prev + 1);
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

        {/* Candidate List Section */}
        <div
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1F2937', marginBottom: 16 }}>
            {t('cvManagement.candidateCVs')}
          </h2>
          <CandidateList 
            departmentFilter={null}
            statusFilter={null}
            onRefresh={refreshTrigger}
          />
        </div>
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
