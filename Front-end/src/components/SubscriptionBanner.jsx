import React from 'react';
import { useQuery } from '@apollo/client/react';
import { SUBSCRIPTION_STATUS_QUERY } from '../graphql/multiTenancy';
import { Clock, AlertTriangle, Crown } from 'lucide-react';
import './SubscriptionBanner.css';

const SubscriptionBanner = () => {
  const { data, loading } = useQuery(SUBSCRIPTION_STATUS_QUERY, {
    pollInterval: 60000,
  });

  if (loading) return null;
  if (!data?.subscriptionStatus) return null;

  const status = data.subscriptionStatus;

  // Aktif ve trial değilse banner göster
  if (!status.hasSubscription) {
    return (
      <div className="subscription-banner expired">
        <AlertTriangle size={20} />
        <div className="banner-content">
          <strong>Abonelik Bulunamadı</strong>
          <span>Lütfen bir abonelik planı seçin.</span>
        </div>
      </div>
    );
  }

  // Trial süresi dolmuşsa
  if (status.isTrialExpired) {
    return (
      <div className="subscription-banner expired">
        <AlertTriangle size={20} />
        <div className="banner-content">
          <strong>Deneme Süresi Doldu</strong>
          <span>Hizmete devam etmek için bir abonelik planı seçin.</span>
        </div>
      </div>
    );
  }

  // Trial dönemindeyse
  if (status.isTrial && status.trialEndDate) {
    const daysLeft = Math.ceil(
      (new Date(status.trialEndDate) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return (
      <div className="subscription-banner trial">
        <Clock size={20} />
        <div className="banner-content">
          <strong>Deneme Süresi</strong>
          <span>
            {daysLeft > 0
              ? `${daysLeft} gün kaldı - ${status.plan?.name || 'Trial'} planı`
              : 'Son gün!'}
          </span>
        </div>
      </div>
    );
  }

  // Premium plan (white-label veya sınırsız)
  if (status.plan?.is_white_label || status.limits?.cvLimit === null) {
    return (
      <div className="subscription-banner premium">
        <Crown size={20} />
        <div className="banner-content">
          <strong>Premium Üyelik</strong>
          <span>Sınırsız erişim aktif</span>
        </div>
      </div>
    );
  }

  // Aktif normal abonelik için banner gösterme
  return null;
};

export default SubscriptionBanner;
