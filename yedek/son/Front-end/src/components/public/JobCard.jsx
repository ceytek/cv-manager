import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/JobCard.css';

function JobCard({ job, onApply }) {
  const { t, i18n } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

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
          <span className="badge badge-type">{t(`job.${job.employment_type}`)}</span>
          <span className="badge badge-level">{t(`job.${job.experience_level}`)}</span>
        </div>
      </div>

      <div className="job-card-body">
        <div className="job-info">
          <span className="job-location">
            📍 {job.location}
            {job.remote_policy !== 'office' && ` (${t(`job.${job.remote_policy}`)})`}
          </span>
          {job.salary_min && job.salary_max && (
            <span className="job-salary">
              💰 {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()} {job.salary_currency}
            </span>
          )}
        </div>

        <div className="job-description">
          {isExpanded ? (
            <>
              <div 
                dangerouslySetInnerHTML={{ __html: job.description }} 
                className="job-description-full"
              />
              {job.requirements && (
                <div className="job-requirements">
                  <h4>{t('publicCareers.requirements')}</h4>
                  <div dangerouslySetInnerHTML={{ __html: job.requirements }} />
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

        {job.deadline && (
          <div className="job-deadline">
            <strong>{t('publicCareers.deadline')}: </strong>
            {formatDate(job.deadline)}
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
