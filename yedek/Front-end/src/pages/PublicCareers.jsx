import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import JobBoard from '../components/public/JobBoard';
import ApplicationModal from '../components/public/ApplicationModal';
import '../styles/PublicCareers.css';

function PublicCareers() {
  const { t, i18n } = useTranslation();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    location: '',
    department_id: '',
    employment_type: '',
    experience_level: '',
    search: ''
  });

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await fetch(`http://localhost:8000/api/public/jobs?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      setJobs(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (job) => {
    setSelectedJob(job);
    setShowApplicationModal(true);
  };

  const handleCloseModal = () => {
    setShowApplicationModal(false);
    setSelectedJob(null);
  };

  const handleApplicationSuccess = () => {
    setShowApplicationModal(false);
    setSelectedJob(null);
    // Optionally show success message
    alert(t('publicCareers.applicationSuccess'));
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="public-careers-container">
      {/* Header */}
      <header className="public-careers-header">
        <div className="header-content">
          <h1>{t('publicCareers.title')}</h1>
          <p>{t('publicCareers.subtitle')}</p>
          
          {/* Language Switcher */}
          <div className="language-switcher">
            <button 
              onClick={() => changeLanguage('tr')}
              className={i18n.language === 'tr' ? 'active' : ''}
            >
              TR
            </button>
            <button 
              onClick={() => changeLanguage('en')}
              className={i18n.language === 'en' ? 'active' : ''}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="public-careers-main">
        <JobBoard
          jobs={jobs}
          loading={loading}
          error={error}
          filters={filters}
          onFilterChange={handleFilterChange}
          onApply={handleApply}
        />
      </main>

      {/* Application Modal */}
      {showApplicationModal && selectedJob && (
        <ApplicationModal
          job={selectedJob}
          onClose={handleCloseModal}
          onSuccess={handleApplicationSuccess}
        />
      )}

      {/* Footer */}
      <footer className="public-careers-footer">
        <p>© 2025 CV Manager. {t('publicCareers.footerText')}</p>
      </footer>
    </div>
  );
}

export default PublicCareers;
