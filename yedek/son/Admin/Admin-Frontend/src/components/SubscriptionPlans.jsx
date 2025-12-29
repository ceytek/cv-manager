import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_SUBSCRIPTION_PLANS_WITH_COUNT } from '../graphql/queries';
import PlanDetailsModal from './PlanDetailsModal';
import CreatePlanModal from './CreatePlanModal';
import './SubscriptionPlans.css';

function SubscriptionPlans() {
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, loading, error } = useQuery(GET_SUBSCRIPTION_PLANS_WITH_COUNT, {
    fetchPolicy: 'network-only'
  });

  const handleMemberCountClick = (planId) => {
    setSelectedPlanId(planId);
    setShowModal(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  };

  const plans = data?.subscriptionPlansWithCount || [];

  return (
    <div className="subscription-plans-container">
      <header className="content-header">
        <div>
          <h1>Abonelik Paket Yönetimi</h1>
          <p>Tüm abonelik paketlerini ve müşteri sayılarını görüntüleyin</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            + Yeni Paket Ekle
          </button>
        </div>
      </header>

      {loading && <div className="loading-state">Yükleniyor...</div>}
      {error && <div className="error-state">Hata: {error.message}</div>}

      {!loading && !error && (
        <div className="table-container">
          <table className="plans-table">
            <thead>
              <tr>
                <th>Plan Adı</th>
                <th>Slug</th>
                <th>CV Limiti</th>
                <th>İlan Limiti</th>
                <th>Kullanıcı Limiti</th>
                <th>Aylık Fiyat</th>
                <th>Yıllık Fiyat</th>
                <th>Üye Sayısı</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>
                    Paket bulunamadı
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id}>
                    <td><strong>{plan.name}</strong></td>
                    <td><code>{plan.slug}</code></td>
                    <td>{plan.cvLimit || '∞'}</td>
                    <td>{plan.jobLimit || '∞'}</td>
                    <td>{plan.userLimit || '∞'}</td>
                    <td>{formatPrice(plan.monthlyPrice)}</td>
                    <td>{formatPrice(plan.yearlyPrice)}</td>
                    <td>
                      <button 
                        className="member-count-btn"
                        onClick={() => handleMemberCountClick(plan.id)}
                        disabled={plan.subscriberCount === 0}
                      >
                        {plan.subscriberCount}
                      </button>
                    </td>
                    <td>
                      <span className={`status-badge status-${plan.isActive ? 'aktif' : 'pasif'}`}>
                        {plan.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && selectedPlanId && (
        <PlanDetailsModal
          planId={selectedPlanId}
          onClose={() => {
            setShowModal(false);
            setSelectedPlanId(null);
          }}
        />
      )}

      <CreatePlanModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}

export default SubscriptionPlans;
