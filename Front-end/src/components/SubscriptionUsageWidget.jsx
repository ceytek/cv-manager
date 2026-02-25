import React from 'react';
import { useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { SUBSCRIPTION_USAGE_QUERY } from '../graphql/multiTenancy';
import './SubscriptionUsageWidget.css';

const SubscriptionUsageWidget = ({ compact = false }) => {
  const { t } = useTranslation();
  const { data, loading, error } = useQuery(SUBSCRIPTION_USAGE_QUERY, {
    fetchPolicy: 'cache-first',
  });

  // Compact style for header placement
  const compactStyle = compact ? {
    background: '#F3F4F6',
    borderRadius: 8,
    padding: '6px 10px',
    border: '1px solid #E5E7EB',
  } : {};

  // Show loading state only on first load (no cached data yet)
  if (loading && !data) {
    if (compact) {
      return (
        <div style={{ ...compactStyle, fontSize: 11, color: '#6B7280' }}>
          {t('common.loading')}...
        </div>
      );
    }
    return (
      <div className="subscription-usage-widget">
        <div className="su-header">
          <span className="su-plan">{t('common.loading')}...</span>
        </div>
      </div>
    );
  }

  // Show error or fallback
  if (error) {
    console.error('Subscription usage GraphQL error:', error);
    if (compact) {
      return (
        <div style={{ ...compactStyle, fontSize: 11, color: '#dc2626' }}>
          {t('common.error')}
        </div>
      );
    }
    return (
      <div className="subscription-usage-widget">
        <div className="su-header">
          <span className="su-plan" style={{ color: '#dc2626' }}>{t('subscription.loadError')}</span>
        </div>
        <div className="su-bar-wrapper">
          <div style={{ fontSize: '10px', color: '#6b7280' }}>
            {t('subscription.checkConsole')}
          </div>
        </div>
      </div>
    );
  }

  if (!data?.subscriptionUsage) {
    if (compact) {
      return (
        <div style={compactStyle}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{t('subscription.noPackage')}</div>
          <div style={{ fontSize: 10, color: '#10B981' }}>{t('subscription.unlimitedCV')}</div>
        </div>
      );
    }
    return (
      <div className="subscription-usage-widget">
        <div className="su-header">
          <span className="su-plan">{t('subscription.noPackage')}</span>
        </div>
        <div className="su-bar-wrapper">
          <div className="su-bar">
            <div className="su-bar-fill" style={{ width: '0%' }} />
          </div>
          <div className="su-stats">
            <span className="su-used">0</span>
            <span className="su-sep">/</span>
            <span className="su-limit">0</span>
          </div>
        </div>
      </div>
    );
  }

  const { planName, cvLimit, usedCvCount, usagePercent } = data.subscriptionUsage;
  const unlimited = cvLimit === null || cvLimit === 0;
  const percent = unlimited ? 0 : Math.min(Math.round(usagePercent), 100);

  // Compact mode rendering
  if (compact) {
    return (
      <div style={compactStyle}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>
          {planName || t('subscription.noPackage')}
        </div>
        {unlimited ? (
          <div style={{ fontSize: 10, color: '#10B981' }}>{t('subscription.unlimitedCV')}</div>
        ) : (
          <div style={{ fontSize: 10, color: '#6B7280' }}>
            {usedCvCount}/{cvLimit} CV
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="subscription-usage-widget">
      <div className="su-header">
        <span className="su-plan">{planName || t('subscription.noPackage')}</span>
      </div>
      <div className="su-bar-wrapper">
        {unlimited ? (
          <div className="su-unlimited">{t('subscription.unlimitedCVUpload')}</div>
        ) : (
          <>
            <div className="su-bar">
              <div className="su-bar-fill" style={{ width: `${percent}%` }} />
            </div>
            <div className="su-stats">
              <span className="su-used">{usedCvCount}</span>
              <span className="su-sep">/</span>
              <span className="su-limit">{cvLimit}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionUsageWidget;
