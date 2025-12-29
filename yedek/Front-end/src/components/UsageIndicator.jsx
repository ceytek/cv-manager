import { useQuery } from '@apollo/client/react';
import { USAGE_STATS_QUERY } from '../graphql/multiTenancy';
import { AlertCircle, TrendingUp } from 'lucide-react';
import './UsageIndicator.css';

const UsageIndicator = () => {
  const { data, loading, error } = useQuery(USAGE_STATS_QUERY, {
    pollInterval: 30000, // Her 30 saniyede bir güncelle
  });

  if (loading) return null;
  if (error) return null;
  if (!data?.usageStats) return null;

  const stats = data.usageStats;

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'var(--danger-color, #ef4444)';
    if (percentage >= 75) return 'var(--warning-color, #f59e0b)';
    return 'var(--success-color, #10b981)';
  };

  const formatLimit = (limit) => {
    if (limit === null || limit === undefined) return '∞';
    return limit;
  };

  return (
    <div className="usage-indicator">
      <div className="usage-header">
        <TrendingUp size={16} />
        <span>Kullanım Durumu</span>
      </div>

      <div className="usage-items">
        {/* CV Upload */}
        {!stats.cvUpload.isUnlimited && (
          <div className="usage-item">
            <div className="usage-item-header">
              <span className="usage-label">CV Yükleme</span>
              <span className="usage-numbers">
                {stats.cvUpload.currentUsage} / {formatLimit(stats.cvUpload.limit)}
              </span>
            </div>
            <div className="usage-bar-container">
              <div 
                className="usage-bar"
                style={{ 
                  width: `${Math.min(stats.cvUpload.percentageUsed || 0, 100)}%`,
                  backgroundColor: getUsageColor(stats.cvUpload.percentageUsed || 0)
                }}
              />
            </div>
            {stats.cvUpload.limitReached && (
              <div className="usage-warning">
                <AlertCircle size={14} />
                <span>Limit doldu</span>
              </div>
            )}
          </div>
        )}

        {/* Job Posts */}
        {!stats.jobPost.isUnlimited && (
          <div className="usage-item">
            <div className="usage-item-header">
              <span className="usage-label">İlan Sayısı</span>
              <span className="usage-numbers">
                {stats.jobPost.currentUsage} / {formatLimit(stats.jobPost.limit)}
              </span>
            </div>
            <div className="usage-bar-container">
              <div 
                className="usage-bar"
                style={{ 
                  width: `${Math.min(stats.jobPost.percentageUsed || 0, 100)}%`,
                  backgroundColor: getUsageColor(stats.jobPost.percentageUsed || 0)
                }}
              />
            </div>
            {stats.jobPost.limitReached && (
              <div className="usage-warning">
                <AlertCircle size={14} />
                <span>Limit doldu</span>
              </div>
            )}
          </div>
        )}

        {/* AI Analysis */}
        {!stats.aiAnalysis.isUnlimited && (
          <div className="usage-item">
            <div className="usage-item-header">
              <span className="usage-label">AI Analiz</span>
              <span className="usage-numbers">
                {stats.aiAnalysis.currentUsage} / {formatLimit(stats.aiAnalysis.limit)}
              </span>
            </div>
            <div className="usage-bar-container">
              <div 
                className="usage-bar"
                style={{ 
                  width: `${Math.min(stats.aiAnalysis.percentageUsed || 0, 100)}%`,
                  backgroundColor: getUsageColor(stats.aiAnalysis.percentageUsed || 0)
                }}
              />
            </div>
            {stats.aiAnalysis.limitReached && (
              <div className="usage-warning">
                <AlertCircle size={14} />
                <span>Limit doldu</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Unlimited Badge */}
      {(stats.cvUpload.isUnlimited || stats.jobPost.isUnlimited) && (
        <div className="unlimited-badge">
          <span>🎉 Sınırsız Paket</span>
        </div>
      )}
    </div>
  );
};

export default UsageIndicator;
