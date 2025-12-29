import React from 'react';
import { useQuery } from '@apollo/client/react';
import { COMPARE_CANDIDATES_QUERY } from '../graphql/compare';
import { useTranslation } from 'react-i18next';

const Pill = ({ text, color = '#2563EB' }) => (
  <span style={{
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: 999,
    background: `${color}15`,
    color,
    fontSize: 13,
    fontWeight: 600,
    margin: 4,
  }}>{text}</span>
);

const CandidateCard = ({ candidate }) => {
  const { t } = useTranslation();
  if (!candidate) return null;
  return (
    <div style={{
      background: 'white',
      border: '1px solid #E5E7EB',
      borderRadius: 16,
      padding: 24,
      flex: 1,
    }}>
      {/* Header with name */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{candidate.name || t('cvCompare.nameless')}</h3>
        <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
          {candidate.education?.[0]?.department || t('cvCompare.departmentNotSpecified')}
        </div>
      </div>

      {/* Toplam Çalışma Yılı */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6, fontWeight: 600 }}>{t('cvCompare.totalExperience')}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#2563EB' }}>{candidate.totalExperienceYears || '—'}</div>
      </div>

      {/* Dil Bilgisi */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6, fontWeight: 600 }}>{t('cvCompare.languageInfo')}</div>
        {candidate.languages && candidate.languages.length > 0 ? (
          candidate.languages.map((lang, i) => (
            <div key={i} style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>
              <strong>{lang.language}:</strong> {lang.level}
            </div>
          ))
        ) : (
          <div style={{ fontSize: 14, color: '#9CA3AF' }}>{t('cvCompare.languageNotSpecified')}</div>
        )}
      </div>

      {/* Eğitim */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6, fontWeight: 600 }}>{t('cvCompare.education')}</div>
        {candidate.education?.map((edu, i) => (
          <div key={i} style={{ marginBottom: 8, background: '#F9FAFB', borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{edu.school}</div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>{edu.department}, {edu.years}</div>
          </div>
        ))}
      </div>

      {/* Yetenekler */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6, fontWeight: 600 }}>{t('cvCompare.skills')}</div>
        {candidate.skills?.common && candidate.skills.common.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600, marginBottom: 4 }}>{t('cvCompare.commonSkills')}</div>
            {candidate.skills.common.map((s, i) => <Pill key={`c-${i}`} text={s} color="#10B981" />)}
          </div>
        )}
        {candidate.skills?.unique && candidate.skills.unique.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: '#6366F1', fontWeight: 600, marginBottom: 4 }}>{t('cvCompare.uniqueSkills')}</div>
            {candidate.skills.unique.map((s, i) => <Pill key={`u-${i}`} text={s} color="#6366F1" />)}
          </div>
        )}
      </div>

      {/* Yapay Zeka Değerlendirmesi */}
      {candidate.aiEval && (
        <div>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10, fontWeight: 600 }}>{t('cvCompare.aiEvaluation')}</div>
          
          {/* Güçlü Yönler */}
          {candidate.aiEval.strengths && candidate.aiEval.strengths.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 6 }}>{t('cvCompare.strengths')}</div>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#374151', fontSize: 13 }}>
                {candidate.aiEval.strengths.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
              </ul>
            </div>
          )}

          {/* Uygun Pozisyonlar */}
          {candidate.aiEval.suitablePositions && candidate.aiEval.suitablePositions.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 6 }}>{t('cvCompare.suitablePositions')}</div>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#374151', fontSize: 13 }}>
                {candidate.aiEval.suitablePositions.map((p, i) => <li key={i} style={{ marginBottom: 4 }}>{p}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CVCompareView = ({ candidateId1, candidateId2, jobId, onBack }) => {
  const { t, i18n } = useTranslation();
  const { data, loading, error } = useQuery(COMPARE_CANDIDATES_QUERY, {
    variables: { 
      candidateId1, 
      candidateId2, 
      jobId,
      language: i18n.language === 'tr' ? 'turkish' : 'english'
    },
    fetchPolicy: 'network-only'
  });

  const res = data?.compareCandidates;

  if (loading) return <div style={{ padding: 24 }}>{t('cvCompare.loading')}</div>;
  if (error) return <div style={{ padding: 24, color: '#DC2626' }}>{t('cvCompare.error', { message: error.message })}</div>;

  // Debug: Log the response
  console.log('🔍 Compare Response:', res);
  console.log('🔍 CandidateA Languages:', res?.candidateA?.languages);
  console.log('🔍 CandidateA Skills:', res?.candidateA?.skills);
  console.log('🔍 CandidateB Languages:', res?.candidateB?.languages);
  console.log('🔍 CandidateB Skills:', res?.candidateB?.skills);

  // Parse new structure (no scores)
  const candidateA = res?.candidateA ? {
    ...res.candidateA,
    aiEval: res.aiEvaluation?.candidateA,
  } : null;

  const candidateB = res?.candidateB ? {
    ...res.candidateB,
    aiEval: res.aiEvaluation?.candidateB,
  } : null;

  return (
    <div style={{ padding: 24, background: '#F9FAFB', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{t('cvCompare.title', { jobTitle: 'Yazılım Geliştirme Uzmanı' })}</h2>
        <button onClick={onBack} style={{
          padding: '10px 16px',
          border: '1px solid #D1D5DB',
          borderRadius: 8,
          background: 'white',
          cursor: 'pointer',
          fontWeight: 600
        }}>{t('cvCompare.backButton')}</button>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        <CandidateCard candidate={candidateA} />
        <CandidateCard candidate={candidateB} />
      </div>
    </div>
  );
};

export default CVCompareView;
