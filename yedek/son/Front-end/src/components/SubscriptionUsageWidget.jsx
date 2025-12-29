import React from 'react';
import { useQuery } from '@apollo/client/react';
import { SUBSCRIPTION_USAGE_QUERY } from '../graphql/multiTenancy';
import './SubscriptionUsageWidget.css';

const SubscriptionUsageWidget = () => {
  const { data, loading, error } = useQuery(SUBSCRIPTION_USAGE_QUERY, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 60000,
  });

  // Show loading state
  if (loading) {
    return (
      <div className="subscription-usage-widget">
        <div className="su-header">
          <span className="su-plan">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  // Show error or fallback
  if (error) {
    console.error('Subscription usage GraphQL error:', error);
    console.log('Error details:', JSON.stringify(error, null, 2));
    return (
      <div className="subscription-usage-widget">
        <div className="su-header">
          <span className="su-plan" style={{ color: '#dc2626' }}>Hata: Veri yüklenemedi</span>
        </div>
        <div className="su-bar-wrapper">
          <div style={{ fontSize: '10px', color: '#6b7280' }}>
            Console'da detayları görün
          </div>
        </div>
      </div>
    );
  }

  if (!data?.subscriptionUsage) {
    console.warn('No subscription usage data returned from backend');
    console.log('Full response data:', data);
    return (
      <div className="subscription-usage-widget">
        <div className="su-header">
          <span className="su-plan">Paket Yok</span>
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

  return (
    <div className="subscription-usage-widget">
      <div className="su-header">
        <span className="su-plan">{planName || 'Paket Yok'}</span>
      </div>
      <div className="su-bar-wrapper">
        {unlimited ? (
          <div className="su-unlimited">Sınırsız CV Yükleme</div>
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
