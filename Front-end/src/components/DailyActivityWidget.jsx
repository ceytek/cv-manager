import { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { Calendar, Upload, Search, Video, XCircle, ClipboardList } from 'lucide-react';
import { DAILY_ACTIVITY_STATS_QUERY } from '../graphql/stats';
import './DailyActivityWidget.css';

const DailyActivityWidget = () => {
  const { t, i18n } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const { data, loading, refetch } = useQuery(DAILY_ACTIVITY_STATS_QUERY, {
    variables: { date: selectedDate },
    fetchPolicy: 'cache-and-network',
  });

  const stats = data?.dailyActivityStats || {
    cvUploads: 0,
    cvAnalyses: 0,
    interviewInvitations: 0,
    rejections: 0,
    likertInvitations: 0,
  };

  // Calculate max value for scaling bars
  const maxValue = useMemo(() => {
    const values = [stats.cvUploads, stats.cvAnalyses, stats.interviewInvitations, stats.rejections, stats.likertInvitations];
    return Math.max(...values, 1);
  }, [stats]);

  // Format date for display
  const formattedDate = useMemo(() => {
    const date = new Date(selectedDate + 'T00:00:00');
    return date.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [selectedDate, i18n.language]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  // Generate bars for each metric
  const generateBars = (count, color) => {
    const barCount = 20; // Fixed number of bars
    const filledBars = Math.round((count / maxValue) * barCount);
    
    return (
      <div className="activity-bars">
        {Array.from({ length: barCount }).map((_, i) => (
          <div
            key={i}
            className={`activity-bar ${i < filledBars ? 'filled' : ''}`}
            style={{ 
              backgroundColor: i < filledBars ? color : '#E5E7EB',
              height: '40px',
            }}
          />
        ))}
      </div>
    );
  };

  const metrics = [
    {
      key: 'cvUploads',
      label: t('dailyActivity.cvUploads', 'CV Yüklemeleri'),
      value: stats.cvUploads,
      color: '#3B82F6', // Blue
      icon: Upload,
    },
    {
      key: 'cvAnalyses',
      label: t('dailyActivity.cvAnalyses', 'CV Analizleri'),
      value: stats.cvAnalyses,
      color: '#8B5CF6', // Purple
      icon: Search,
    },
    {
      key: 'interviewInvitations',
      label: t('dailyActivity.interviewInvitations', 'Mülakat Davetleri'),
      value: stats.interviewInvitations,
      color: '#F59E0B', // Orange
      icon: Video,
    },
    {
      key: 'rejections',
      label: t('dailyActivity.rejections', 'Red Mesajları'),
      value: stats.rejections,
      color: '#EF4444', // Red
      icon: XCircle,
    },
  ];

  return (
    <div className="daily-activity-widget">
      <div className="daily-activity-header">
        <h3 className="daily-activity-title">
          {t('dailyActivity.title', 'Günlük Aktivite')}
        </h3>
        <div className="date-picker-wrapper">
          <Calendar size={16} />
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="date-picker-input"
            max={new Date().toISOString().split('T')[0]}
          />
          <span className="formatted-date">{formattedDate}</span>
        </div>
      </div>

      {loading && !data ? (
        <div className="daily-activity-loading">
          <div className="loading-spinner" />
        </div>
      ) : (
        <div className="daily-activity-content">
          {metrics.map((metric) => (
            <div key={metric.key} className="activity-metric">
              <div className="metric-header">
                <span className="metric-label" style={{ color: metric.color }}>
                  {metric.label}
                </span>
              </div>
              <div className="metric-value">{metric.value}</div>
              {generateBars(metric.value, metric.color)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyActivityWidget;

