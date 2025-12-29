import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_SUBSCRIPTION_PLANS } from '../graphql/subscriptionPlans';
import PlanDetailsModal from '../components/PlanDetailsModal';
import CreatePlanModal from '../components/CreatePlanModal';
import './Dashboard.css';

const SubscriptionPlans = () => {
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const { data, loading, error } = useQuery(GET_SUBSCRIPTION_PLANS);

  const openDetailsModal = (planId) => {
    setSelectedPlanId(planId);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedPlanId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
        Hata: {error.message}
      </div>
    );
  }

  const plans = data?.subscriptionPlansWithCount || [];

  return (
    <div>
      {/* Header */}
      <header className="content-header">
        <div>
          <h1>Abonelik Paket Yönetimi</h1>
          <p>Tüm abonelik paketlerini ve müşteri sayılarını görüntüleyin</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            + Yeni Paket Ekle
          </button>
        </div>
      </header>

      {/* Fallback Action Row (ensures button always visible) */}
      <div className="actions-row">
        <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          + Yeni Paket Ekle
        </button>
      </div>

      {/* Plans Table */}
      <div className="table-container">
        <table className="data-table">
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
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td>
                  <strong>{plan.name}</strong>
                </td>
                <td>
                  <code className="slug-badge">{plan.slug}</code>
                </td>
                <td className="text-center">
                  {plan.cvLimit === -1 ? '∞' : plan.cvLimit}
                </td>
                <td className="text-center">
                  {plan.jobLimit === -1 ? '∞' : plan.jobLimit}
                </td>
                <td className="text-center">
                  {plan.userLimit === -1 ? '∞' : plan.userLimit}
                </td>
                <td className="text-right">
                  ₺{plan.monthlyPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </td>
                <td className="text-right">
                  ₺{plan.yearlyPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </td>
                <td className="text-center">
                  <button
                    onClick={() => openDetailsModal(plan.id)}
                    className="subscriber-count-btn"
                  >
                    {plan.subscriberCount}
                  </button>
                </td>
                <td className="text-center">
                  <span className="status-badge active">Aktif</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {plans.length === 0 && (
          <div className="empty-state">
            Henüz abonelik paketi eklenmemiş.
          </div>
        )}
      </div>

      {/* Modals */}
      <PlanDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        planId={selectedPlanId}
      />

      <CreatePlanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

export default SubscriptionPlans;
