import { useTranslation } from 'react-i18next';
import JobCard from './JobCard';
import '../../styles/JobBoard.css';

function JobBoard({ jobs, loading, error, filters, onFilterChange, onApply }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="job-board-loading">
        <div className="spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="job-board-error">
        <p>{t('publicCareers.errorLoading')}: {error}</p>
        <button onClick={() => window.location.reload()}>
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="job-board">
      {/* Filters Section */}
      <div className="job-filters">
        <input
          type="text"
          placeholder={t('publicCareers.searchPlaceholder')}
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className="search-input"
        />

        <select
          value={filters.location}
          onChange={(e) => onFilterChange('location', e.target.value)}
          className="filter-select"
        >
          <option value="">{t('publicCareers.allLocations')}</option>
          <option value="istanbul">İstanbul</option>
          <option value="ankara">Ankara</option>
          <option value="izmir">İzmir</option>
          <option value="remote">{t('publicCareers.remote')}</option>
        </select>

        <select
          value={filters.employment_type}
          onChange={(e) => onFilterChange('employment_type', e.target.value)}
          className="filter-select"
        >
          <option value="">{t('publicCareers.allEmploymentTypes')}</option>
          <option value="full-time">{t('job.fullTime')}</option>
          <option value="part-time">{t('job.partTime')}</option>
          <option value="contract">{t('job.contract')}</option>
          <option value="internship">{t('job.internship')}</option>
        </select>

        <select
          value={filters.experience_level}
          onChange={(e) => onFilterChange('experience_level', e.target.value)}
          className="filter-select"
        >
          <option value="">{t('publicCareers.allExperienceLevels')}</option>
          <option value="entry">{t('job.entry')}</option>
          <option value="junior">{t('job.junior')}</option>
          <option value="mid">{t('job.mid')}</option>
          <option value="senior">{t('job.senior')}</option>
          <option value="lead">{t('job.lead')}</option>
        </select>
      </div>

      {/* Results Count */}
      <div className="job-results-header">
        <h2>
          {jobs.length} {t('publicCareers.jobsFound')}
        </h2>
      </div>

      {/* Job Cards Grid */}
      <div className="job-cards-grid">
        {jobs.length === 0 ? (
          <div className="no-jobs-message">
            <p>{t('publicCareers.noJobsFound')}</p>
          </div>
        ) : (
          jobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              onApply={() => onApply(job)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default JobBoard;
