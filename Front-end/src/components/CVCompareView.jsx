import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { COMPARE_CANDIDATES_QUERY } from '../graphql/compare';
import { useTranslation } from 'react-i18next';

/* ───────── AI Loading Animation ───────── */
const aiLoadingKeyframes = `
@keyframes cvCompare-pulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.15); }
}
@keyframes cvCompare-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}
@keyframes cvCompare-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes cvCompare-orbit {
  0% { transform: rotate(0deg) translateX(60px) rotate(0deg); }
  100% { transform: rotate(360deg) translateX(60px) rotate(-360deg); }
}
@keyframes cvCompare-fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes cvCompare-progressBar {
  0% { width: 0%; }
  20% { width: 25%; }
  50% { width: 55%; }
  70% { width: 70%; }
  90% { width: 85%; }
  100% { width: 95%; }
}
`;

const LoadingScreen = ({ candidateName1, candidateName2 }) => {
  const { t } = useTranslation();
  const [tipIndex, setTipIndex] = useState(0);

  const tips = [
    t('cvCompare.loadingTip1', 'CV bilgileri analiz ediliyor...'),
    t('cvCompare.loadingTip2', 'Yetkinlikler karşılaştırılıyor...'),
    t('cvCompare.loadingTip3', 'Deneyimler değerlendiriliyor...'),
    t('cvCompare.loadingTip4', 'AI raporu oluşturuluyor...'),
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % tips.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [tips.length]);

  const name1 = candidateName1 ? candidateName1.split(' ')[0] : '?';
  const name2 = candidateName2 ? candidateName2.split(' ')[0] : '?';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 24px',
      minHeight: 420,
      background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 50%, #F0F9FF 100%)',
      borderRadius: 20,
    }}>
      <style>{aiLoadingKeyframes}</style>

      {/* AI Brain Icon with orbiting dots */}
      <div style={{ position: 'relative', width: 140, height: 140, marginBottom: 32 }}>
        {/* Center brain/sparkle icon */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 64, height: 64,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6, #A78BFA)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 40px rgba(99, 102, 241, 0.3), 0 0 80px rgba(139, 92, 246, 0.15)',
          animation: 'cvCompare-float 2.5s ease-in-out infinite',
        }}>
          <span style={{ fontSize: 30 }}>🧠</span>
        </div>

        {/* Orbiting dots */}
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: 10, height: 10,
            marginTop: -5, marginLeft: -5,
            borderRadius: '50%',
            background: ['#6366F1', '#8B5CF6', '#3B82F6', '#A78BFA'][i],
            animation: `cvCompare-orbit ${3 + i * 0.4}s linear infinite`,
            animationDelay: `${i * -0.75}s`,
            opacity: 0.8,
          }} />
        ))}
      </div>

      {/* Main title */}
      <h3 style={{
        margin: 0,
        fontSize: 20,
        fontWeight: 700,
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 8,
        animation: 'cvCompare-fadeIn 0.5s ease-out',
      }}>
        {t('cvCompare.aiEvaluating', '✨ Yapay Zeka Adayları Değerlendiriyor')}
      </h3>

      {/* VS Names */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 28,
        animation: 'cvCompare-fadeIn 0.7s ease-out',
      }}>
        <div style={{
          padding: '8px 18px',
          borderRadius: 12,
          background: 'linear-gradient(135deg, #6366F1, #818CF8)',
          color: 'white',
          fontWeight: 700,
          fontSize: 15,
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
        }}>
          {name1}
        </div>
        <span style={{
          fontSize: 18,
          fontWeight: 800,
          color: '#94A3B8',
          fontStyle: 'italic',
        }}>vs</span>
        <div style={{
          padding: '8px 18px',
          borderRadius: 12,
          background: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
          color: 'white',
          fontWeight: 700,
          fontSize: 15,
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
        }}>
          {name2}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        width: 280,
        height: 6,
        borderRadius: 99,
        background: '#E2E8F0',
        overflow: 'hidden',
        marginBottom: 20,
      }}>
        <div style={{
          height: '100%',
          borderRadius: 99,
          background: 'linear-gradient(90deg, #6366F1, #8B5CF6, #3B82F6)',
          backgroundSize: '200% 100%',
          animation: 'cvCompare-progressBar 12s ease-out forwards, cvCompare-shimmer 1.5s linear infinite',
        }} />
      </div>

      {/* Rotating tips */}
      <div style={{
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span
          key={tipIndex}
          style={{
            fontSize: 14,
            color: '#64748B',
            fontWeight: 500,
            animation: 'cvCompare-fadeIn 0.4s ease-out',
          }}
        >
          {tips[tipIndex]}
        </span>
      </div>

      {/* Pulsing dots */}
      <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8, height: 8,
            borderRadius: '50%',
            background: '#6366F1',
            animation: 'cvCompare-pulse 1.4s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  );
};

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

const CVCompareView = ({ candidateId1, candidateId2, candidateName1, candidateName2, jobId, onBack }) => {
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

  if (loading) return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button onClick={onBack} style={{
          padding: '10px 20px',
          border: 'none',
          borderRadius: 8,
          background: '#1F2937',
          color: 'white',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>✕ {t('common.close', 'Kapat')}</button>
      </div>
      <LoadingScreen candidateName1={candidateName1} candidateName2={candidateName2} />
    </div>
  );
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
    <div style={{ padding: 24, background: '#F9FAFB', borderRadius: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{t('cvCompare.title', { jobTitle: t('cvCompare.comparison', 'Aday Karşılaştırması') })}</h2>
        <button onClick={onBack} style={{
          padding: '10px 20px',
          border: 'none',
          borderRadius: 8,
          background: '#1F2937',
          color: 'white',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>✕ {t('common.close', 'Kapat')}</button>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        <CandidateCard candidate={candidateA} />
        <CandidateCard candidate={candidateB} />
      </div>
    </div>
  );
};

export default CVCompareView;
