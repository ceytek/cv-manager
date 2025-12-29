import { useQuery } from '@apollo/client';
import { GET_PLAN_SUBSCRIBERS } from '../graphql/queries';
import './PlanDetailsModal.css';

function PlanDetailsModal({ planId, onClose }) {
  const { data, loading, error } = useQuery(GET_PLAN_SUBSCRIBERS, {
    variables: { planId },
    fetchPolicy: 'network-only'
  });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: 'Aktif', class: 'status-active' },
      trial: { label: 'Deneme', class: 'status-trial' },
      expired: { label: 'Süresi Doldu', class: 'status-expired' },
      cancelled: { label: 'İptal Edildi', class: 'status-cancelled' }
    };
    const statusInfo = statusMap[status] || { label: status, class: '' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  const getQuotaBar = (used, total, label) => {
    const remaining = Math.max(0, total - used);
    const percentage = total > 0 ? ((total - remaining) / total) * 100 : 0;
    const isLow = percentage > 80;
    
    return (
      <div className="quota-item">
        <div className="quota-header">
          <span className="quota-label">{label}</span>
          <span className="quota-numbers">
            <strong>{remaining}</strong> / {total} kalan
          </span>
        </div>
        <div className="quota-bar">
          <div 
            className={`quota-fill ${isLow ? 'quota-low' : ''}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const subscribers = data?.planSubscribers || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Plan Müşterileri</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {loading && <div className="loading-state">Yükleniyor...</div>}
        {error && <div className="error-state">Hata: {error.message}</div>}

        {!loading && !error && (
          <div className="modal-body">
            {subscribers.length === 0 ? (
              <p className="no-data">Bu planda aktif müşteri bulunmuyor</p>
            ) : (
              <div className="subscribers-list">
                {subscribers.map((sub) => (
                  <div key={sub.companyId} className="subscriber-card">
                    <div className="subscriber-header">
                      <div>
                        <h3>{sub.companyName}</h3>
                        <p className="company-code">Kod: {sub.companyCode}</p>
                      </div>
                      {getStatusBadge(sub.subscriptionStatus)}
                    </div>

                    <div className="subscriber-dates">
                      <div className="date-item">
                        <span className="date-label">Başlangıç:</span>
                        <span className="date-value">{formatDate(sub.startDate)}</span>
                      </div>
                      <div className="date-item">
                        <span className="date-label">Bitiş:</span>
                        <span className="date-value">{formatDate(sub.endDate)}</span>
                      </div>
                    </div>

                    <div className="quotas-section">
                      <h4>Kalan Kontörler</h4>
                      {getQuotaBar(
                        0,
                        sub.remainingCvQuota,
                        `CV Kontörü`
                      )}
                      {getQuotaBar(
                        0,
                        sub.remainingJobQuota,
                        `İlan Kontörü`
                      )}
                      {getQuotaBar(
                        0,
                        sub.remainingUserQuota,
                        `Kullanıcı Kontörü`
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PlanDetailsModal;
