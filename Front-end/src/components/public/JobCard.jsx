import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/JobCard.css';

function JobCard({ job, onApply }) {
  const { t, i18n } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  // Convert kebab-case to camelCase for translation keys
  const toTranslationKey = (value) => {
    if (!value) return '';
    // full-time -> fullTime, part-time -> partTime
    return value.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  };

  // Get label for employment type
  const getEmploymentTypeLabel = (type) => {
    const key = toTranslationKey(type);
    return t(`job.${key}`, type);
  };

  // Get label for experience level
  const getExperienceLevelLabel = (level) => {
    return t(`job.${level}`, level);
  };

  // Get label for remote policy
  const getRemotePolicyLabel = (policy) => {
    return t(`job.${policy}`, policy);
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const getDescriptionPreview = (description) => {
    const plainText = job.description_plain || stripHtml(description);
    if (plainText.length <= 150) return plainText;
    return plainText.substring(0, 150) + '...';
  };

  return (
    <div className={`job-card ${isExpanded ? 'expanded' : ''}`}>
      <div className="job-card-header">
        <h3>{job.title}</h3>
        <div className="job-badges">
          <span className="badge badge-type">{getEmploymentTypeLabel(job.employment_type)}</span>
          <span className="badge badge-level">{getExperienceLevelLabel(job.experience_level)}</span>
        </div>
      </div>

      <div className="job-card-body">
        <div className="job-info">
          <span className="job-location">
            📍 {job.location}
            {job.remote_policy !== 'office' && ` (${getRemotePolicyLabel(job.remote_policy)})`}
          </span>
        </div>

        <div className="job-description">
          {isExpanded ? (
            <>
              {/* Intro Text */}
              {job.intro_text && (
                <div className="job-intro" style={{
                  background: 'linear-gradient(135deg, #EEF2FF 0%, #F3E8FF 100%)',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  borderLeft: '3px solid #6366F1'
                }}>
                  <h4 style={{ color: '#4F46E5', marginBottom: '8px' }}>📝 {t('publicJob.introduction', 'Giriş')}</h4>
                  <div dangerouslySetInnerHTML={{ __html: job.intro_text }} />
                </div>
              )}

              {/* Company About */}
              {job.company?.about && (
                <div className="job-company-about" style={{
                  background: '#F9FAFB',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  border: '1px solid #E5E7EB'
                }}>
                  <h4 style={{ color: '#059669', marginBottom: '8px' }}>🏢 {t('publicJob.aboutCompany', 'Hakkımızda')}</h4>
                  <div dangerouslySetInnerHTML={{ __html: job.company.about }} />
                </div>
              )}

              {/* Job Description */}
              <div 
                dangerouslySetInnerHTML={{ __html: job.description }} 
                className="job-description-full"
              />

              {/* Requirements */}
              {job.requirements && (
                <div className="job-requirements">
                  <h4>{t('publicCareers.requirements')}</h4>
                  <div dangerouslySetInnerHTML={{ __html: job.requirements }} />
                </div>
              )}

              {/* Outro Text (What We Offer) */}
              {job.outro_text && (
                <div className="job-outro" style={{
                  background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)',
                  padding: '16px',
                  borderRadius: '8px',
                  marginTop: '16px',
                  borderLeft: '3px solid #10B981'
                }}>
                  <h4 style={{ color: '#059669', marginBottom: '8px' }}>🎁 {t('publicJob.whatWeOffer', 'Neler Sunuyoruz')}</h4>
                  <div dangerouslySetInnerHTML={{ __html: job.outro_text }} />
                </div>
              )}
            </>
          ) : (
            <p>{getDescriptionPreview(job.description)}</p>
          )}
        </div>

        {job.keywords && job.keywords.length > 0 && (
          <div className="job-keywords">
            {job.keywords.slice(0, isExpanded ? job.keywords.length : 5).map((keyword, index) => (
              <span key={index} className="keyword-tag">{keyword}</span>
            ))}
          </div>
        )}

        {job.required_languages && Object.keys(job.required_languages).length > 0 && (
          <div className="job-languages">
            <strong>{t('publicCareers.languages')}: </strong>
            {Object.entries(job.required_languages).map(([lang, level], index) => (
              <span key={index}>
                {lang} ({t(`job.${level}`)})
                {index < Object.keys(job.required_languages).length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        )}

      </div>

      <div className="job-card-footer">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn-secondary"
        >
          {isExpanded ? t('common.showLess') : t('common.showMore')}
        </button>
        <button 
          onClick={onApply}
          className="btn-primary"
        >
          {t('publicCareers.applyNow')}
        </button>
      </div>

      <div className="job-posted-date">
        {t('publicCareers.postedOn')} {formatDate(job.created_at)}
      </div>
    </div>
  );
}

export default JobCard;
