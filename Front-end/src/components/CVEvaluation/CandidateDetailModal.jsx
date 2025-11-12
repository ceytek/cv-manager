/**
 * Candidate Detail Modal/Page Component
 * Displays detailed CV information and AI analysis results
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Briefcase, GraduationCap, Award, MapPin, Mail, Phone, Linkedin, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const CandidateDetailModal = ({ candidate, onClose }) => {
  const { t } = useTranslation();
  // Build real detail object from props (selectedCandidate from list)
  const detail = useMemo(() => {
    const cand = candidate?.candidate || {};
    const parsed = cand?.parsedData || {};
    const analysis = candidate?.analysisData || {};

  const name = cand?.name || candidate?.candidateName || t('candidateDetail.unknown');
    const title = parsed?.experience?.[0]?.title || parsed?.personal?.title || '—';
  const location = cand?.location || parsed?.personal?.location || parsed?.personal?.address || '—';
  // birthYear field stores the birth year; compute actual age for display
  let birthYear = typeof cand?.birthYear === 'number' ? cand.birthYear : null;
  if (!birthYear && parsed?.personal?.birth_year) birthYear = parsed.personal.birth_year;
  const age = birthYear ? (new Date().getFullYear() - Number(birthYear)) : (parsed?.personal?.age || null);
  const expMonths = typeof cand?.experienceMonths === 'number' ? cand.experienceMonths : null;
    const email = cand?.email || '—';
    const phone = cand?.phone || '—';
    const linkedin = parsed?.personal?.linkedin || null;
    const photo = cand?.cvPhotoPath || null;

    const summary = analysis?.summary 
      || parsed?.summary 
      || parsed?.personal?.summary 
      || t('candidateDetail.summaryNotFound');

    // Experience mapping
    const experience = Array.isArray(parsed?.experience) ? parsed.experience.map((e) => {
      const start = e?.start_date || e?.start || e?.from;
      const end = e?.end_date || e?.end || e?.to;
      const period = [start, end || t('common.present')].filter(Boolean).join(' - ');
      return {
        title: e?.title || e?.role || '—',
        company: e?.company || e?.organization || '—',
        period,
        description: e?.description || e?.summary || '',
        isCurrent: !end || String(end).toLowerCase() === 'present',
      };
    }) : [];

    // Education mapping
    const education = Array.isArray(parsed?.education) ? parsed.education.map((ed) => {
      const period = [ed?.start_year || ed?.from, ed?.end_year || ed?.to].filter(Boolean).join(' - ');
      return {
        degree: ed?.degree || ed?.qualification || '—',
        institution: ed?.institution || ed?.school || '—',
        period,
        gpa: ed?.gpa || null,
      };
    }) : [];

    // Skills mapping from analysis and parsed
    const matchedSkills = analysis?.matched_skills
      || analysis?.matchedSkills
      || analysis?.keyword_matches
      || analysis?.matched_keywords
      || [];
    const missingSkills = analysis?.missing_skills
      || analysis?.unmatched_skills
      || analysis?.missingKeywords
      || [];
    const languageBadges = Array.isArray(parsed?.languages)
      ? parsed.languages.map((l) => ({ name: t('candidateDetail.languageLevel'), level: typeof l === 'string' ? l : (l?.name && l?.level ? `${l.name} (${l.level})` : (l?.name || l?.level || t('candidateDetail.language'))), color: '#FCD34D' }))
      : [];

    const skills = {
      matching: (Array.isArray(matchedSkills) ? matchedSkills : []).map((s) => ({ name: typeof s === 'string' ? s : (s?.name || String(s)), status: 'match' })),
      notMatching: (Array.isArray(missingSkills) ? missingSkills : []).map((s) => ({ name: typeof s === 'string' ? s : (s?.name || String(s)), status: 'missing' })),
      additional: languageBadges,
    };

    // AI analysis panel
    const score = candidate?.score ?? analysis?.overall_score ?? 0;
    const strengths = Array.isArray(analysis?.strengths) && analysis.strengths.length > 0
      ? analysis.strengths
      : [summary].filter(Boolean);
  const keywordMatches = Array.isArray(analysis?.keyword_matches)
      ? analysis.keyword_matches
      : (Array.isArray(matchedSkills) ? matchedSkills : []);

    const aiAnalysis = {
      overallScore: Number(score) || 0,
      jobMatch: t('candidateDetail.jobMatchLabel', { score: Number(score) || 0 }),
      strengths,
      weaknesses: Array.isArray(analysis?.weaknesses) ? analysis.weaknesses : [],
      keywordMatches: keywordMatches.map((k) => (typeof k === 'string' ? k : (k?.name || String(k)))),
  locationMatch: analysis?.location_match || null,
  locationScore: (analysis?.breakdown && typeof analysis.breakdown.location_score !== 'undefined') ? analysis.breakdown.location_score : null,
    };

    // Language match visualization data
    const languageMatches = Array.isArray(analysis?.language_matches) ? analysis.language_matches : [];

    return {
      id: candidate?.id,
      name,
      title,
      location,
      email,
      phone,
      linkedin,
      photo,
      summary,
  age,
  expMonths,
      experience,
      education,
      skills,
      aiAnalysis: { ...aiAnalysis, languageMatches },
      cvFilePath: cand?.cvFilePath,
    };
  }, [candidate]);

  if (!candidate) return null;

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
      padding: 20,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        maxWidth: 900,
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }}>
        {/* Header */}
        <div style={{
          padding: 24,
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
            {t('candidateDetail.breadcrumb', { name: detail.name })}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={24} color="#6B7280" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 24,
        }}>
          {/* Profile Section */}
          <div style={{
            display: 'flex',
            gap: 24,
            marginBottom: 32,
            paddingBottom: 32,
            borderBottom: '1px solid #E5E7EB',
          }}>
            {/* Avatar */}
            <div style={{
              width: 100,
              height: 100,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              fontWeight: 700,
              color: 'white',
            }}>
              {String(detail.name || '')?.split(' ')?.map(n => n?.[0])?.join('')}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>
                {detail.name}
              </h1>
              <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 12 }}>
                {detail.title}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 14, color: '#4B5563' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={16} />
                  {detail.location}
                </div>
        {typeof detail.age === 'number' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F3F4F6', padding: '2px 8px', borderRadius: 12 }}>
                    <span style={{ color: '#6B7280' }}>{t('candidateDetail.age')}</span>
          <strong>{detail.age}</strong>
                  </div>
                )}
        {typeof detail.expMonths === 'number' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F3F4F6', padding: '2px 8px', borderRadius: 12 }}>
                    <span style={{ color: '#6B7280' }}>{t('candidateDetail.experience')}</span>
          <strong>{Math.floor(detail.expMonths / 12)}{t('candidateDetail.years')} {detail.expMonths % 12}{t('candidateDetail.months')}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={16} />
                  {detail.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={16} />
                  {detail.phone}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href={detail.cvFilePath || '#'} download style={{
                padding: '10px 20px',
                background: 'white',
                color: '#3B82F6',
                border: '1px solid #3B82F6',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'none',
                textAlign: 'center',
              }}
              onClick={(e) => { if (!detail.cvFilePath) e.preventDefault(); }}
              >
                {t('candidateDetail.downloadCV')}
              </a>
              <button style={{
                padding: '10px 20px',
                background: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}>
                {t('candidateDetail.contact')}
              </button>
            </div>
          </div>

          {/* Two Column Layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 420px',
            gap: 32,
          }}>
            {/* Left Column */}
            <div>
              {/* Summary */}
        <Section title={t('candidateDetail.summary')}>
                <p style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.6 }}>
          {detail.summary}
                </p>
              </Section>

              {/* Experience */}
              <Section title={t('candidateDetail.experienceSection')}>
                {detail.experience.map((exp, index) => (
                  <ExperienceItem key={index} experience={exp} />
                ))}
              </Section>

              {/* Education */}
              <Section title={t('candidateDetail.educationSection')}>
                {detail.education.map((edu, index) => (
                  <EducationItem key={index} education={edu} />
                ))}
              </Section>

              {/* Skills */}
              <Section title={t('candidateDetail.skillsSection')}>
                <SkillsSection skills={detail.skills} />
              </Section>
            </div>

            {/* Right Column - AI Analysis */}
            <div>
              <AIAnalysisPanel analysis={detail.aiAnalysis} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Section Component
const Section = ({ title, children }) => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{
      fontSize: 18,
      fontWeight: 700,
      color: '#1F2937',
      marginBottom: 16,
    }}>
      {title}
    </h2>
    {children}
  </div>
);

// Experience Item Component
const ExperienceItem = ({ experience }) => (
  <div style={{
    marginBottom: 20,
    paddingLeft: 16,
    borderLeft: '2px solid #E5E7EB',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <Briefcase size={16} color="#3B82F6" />
      <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1F2937' }}>
        {experience.title}
      </h3>
    </div>
    <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>
      {experience.company}
    </div>
    <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 8 }}>
      {experience.period}
    </div>
    {experience.description && (
      <p style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.5 }}>
        {experience.description}
      </p>
    )}
  </div>
);

// Education Item Component
const EducationItem = ({ education }) => (
  <div style={{
    marginBottom: 20,
    paddingLeft: 16,
    borderLeft: '2px solid #E5E7EB',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <GraduationCap size={16} color="#3B82F6" />
      <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1F2937' }}>
        {education.degree}
      </h3>
    </div>
    <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>
      {education.institution}
    </div>
    <div style={{ fontSize: 13, color: '#9CA3AF' }}>
      {education.period}
    </div>
  </div>
);

// Skills Section Component
const SkillsSection = ({ skills }) => {
  const { t } = useTranslation();
  
  return (
  <div>
    {/* Matching Skills */}
    <div style={{ marginBottom: 16 }}>
      <h4 style={{ fontSize: 13, fontWeight: 600, color: '#10B981', marginBottom: 8 }}>
        {t('candidateDetail.matchingSkills')}
      </h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {skills.matching.map((skill, index) => (
          <span key={index} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: '#D1FAE5',
            color: '#065F46',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
          }}>
            <CheckCircle2 size={14} />
            {skill.name}
          </span>
        ))}
      </div>
    </div>

    {/* Not Matching Skills */}
    <div style={{ marginBottom: 16 }}>
      <h4 style={{ fontSize: 13, fontWeight: 600, color: '#EF4444', marginBottom: 8 }}>
        {t('candidateDetail.notMatchingSkills')}
      </h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {skills.notMatching.map((skill, index) => (
          <span key={index} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: '#FEE2E2',
            color: '#991B1B',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
          }}>
            <XCircle size={14} />
            {skill.name}
          </span>
        ))}
      </div>
    </div>

    {/* Additional Info */}
    <div>
      <h4 style={{ fontSize: 13, fontWeight: 600, color: '#F59E0B', marginBottom: 8 }}>
        {t('candidateDetail.additionalInfo')}
      </h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {skills.additional.map((item, index) => (
          <span key={index} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: '#FEF3C7',
            color: '#92400E',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
          }}>
            <AlertCircle size={14} />
            {item.level}
          </span>
        ))}
      </div>
    </div>
  </div>
  );
};

// AI Analysis Panel Component
const AIAnalysisPanel = ({ analysis }) => {
  const { t } = useTranslation();
  
  return (
  <div style={{
    background: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    border: '1px solid #E5E7EB',
    position: 'sticky',
    top: 0,
  }}>
    <h2 style={{
      fontSize: 16,
      fontWeight: 700,
      color: '#1F2937',
      marginBottom: 16,
    }}>
      {t('candidateDetail.compatibilityAnalysis')}
    </h2>

    {/* Overall Score */}
    <div style={{
      background: 'white',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>
        {analysis.jobMatch}
      </div>
      <div style={{
        fontSize: 48,
        fontWeight: 700,
        color: '#10B981',
        lineHeight: 1,
      }}>
        {analysis.overallScore}%
      </div>
      <div style={{
        height: 8,
        background: '#E5E7EB',
        borderRadius: 4,
        marginTop: 12,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${analysis.overallScore}%`,
          background: '#10B981',
        }} />
      </div>
    </div>

    {/* AI Evaluation */}
    <div style={{ marginBottom: 16 }}>
      <h3 style={{
        fontSize: 14,
        fontWeight: 600,
        color: '#1F2937',
        marginBottom: 8,
      }}>
        {t('candidateDetail.aiEvaluation')}
      </h3>
      <div style={{
        background: 'white',
        borderRadius: 8,
        padding: 12,
        fontSize: 13,
        color: '#4B5563',
        lineHeight: 1.6,
      }}>
        {analysis.strengths.map((strength, index) => (
          <p key={index} style={{ marginBottom: 8 }}>
            • {strength}
          </p>
        ))}
      </div>
    </div>

    {/* Keyword Matches */}
    <div>
      <h3 style={{
        fontSize: 14,
        fontWeight: 600,
        color: '#1F2937',
        marginBottom: 8,
      }}>
        {t('candidateDetail.keywordMatch')}
      </h3>
      <div style={{
        background: 'white',
        borderRadius: 8,
        padding: 12,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
      }}>
        {analysis.keywordMatches.map((keyword, index) => (
          <span key={index} style={{
            padding: '4px 10px',
            background: '#DBEAFE',
            color: '#1E40AF',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 500,
          }}>
            {keyword}
          </span>
        ))}
      </div>
    </div>

    {/* Language requirement comparison */}
    {Array.isArray(analysis.languageMatches) && analysis.languageMatches.length > 0 && (
      <div style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>
          {t('candidateDetail.languageMatch')}
        </h3>
        <div style={{ background: 'white', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {analysis.languageMatches.map((m, i) => {
            const status = (m?.status || '').toLowerCase();
            const colors = status === 'exceeds' ? { bg: '#D1FAE5', color: '#065F46' } : status === 'meets' ? { bg: '#DBEAFE', color: '#1E3A8A' } : status === 'insufficient' ? { bg: '#FEF3C7', color: '#92400E' } : { bg: '#FEE2E2', color: '#991B1B' };
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: '#374151', fontSize: 13 }}>
                  {m.language}: {t('candidateDetail.languageRequired')} {m.required_level || '-'}, {t('candidateDetail.languageCandidate')} {m.candidate_level || '-'}
                </div>
                <span style={{ background: colors.bg, color: colors.color, padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
                  {status || 'missing'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    )}

    {/* Location match */}
    {analysis.locationMatch && (
      <div style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>
          {t('candidateDetail.locationMatch')}
        </h3>
        <div style={{ background: 'white', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#374151', fontSize: 13 }}>
            <div>
              {t('candidateDetail.jobCity')}: <strong>{analysis.locationMatch.job_city || '-'}</strong>
            </div>
            <div>
              {t('candidateDetail.candidateCity')}: <strong>{analysis.locationMatch.candidate_city || '-'}</strong>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#374151', fontSize: 13 }}>
            <div>
              {t('candidateDetail.distance')}: <strong>{typeof analysis.locationMatch.distance_km === 'number' ? `${analysis.locationMatch.distance_km} km` : '-'}</strong>
            </div>
            <div>
              {t('candidateDetail.proximity')}: <span style={{ background: '#EFF6FF', color: '#1E3A8A', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                {analysis.locationMatch.category || '-'}
              </span>
            </div>
          </div>
          {typeof analysis.locationScore === 'number' && (
            <div style={{ marginTop: 6, color: '#6B7280', fontSize: 12 }}>
              {t('candidateDetail.locationScore')}: {analysis.locationScore}/10
            </div>
          )}
        </div>
      </div>
    )}
  </div>
  );
};

export default CandidateDetailModal;
