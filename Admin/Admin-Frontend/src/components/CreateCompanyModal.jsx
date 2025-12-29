import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import './CreateCompanyModal.css';

const GET_SUBSCRIPTION_PLANS = gql`
  query GetSubscriptionPlans {
    subscriptionPlans {
      id
      name
      slug
      description
      monthlyPrice
      yearlyPrice
      cvLimit
      jobLimit
      userLimit
    }
  }
`;

const CREATE_COMPANY = gql`
  mutation CreateCompany(
    $name: String!
    $email: String!
    $phone: String
    $address: String
    $planId: String!
  ) {
    createCompany(
      name: $name
      email: $email
      phone: $phone
      address: $address
      planId: $planId
    ) {
      id
      companyCode
      name
      email
      phone
      isActive
      createdAt
      subscription {
        planName
        status
        startDate
        endDate
      }
    }
  }
`;

function CreateCompanyModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    planId: ''
  });

  const { data: plansData, loading: plansLoading } = useQuery(GET_SUBSCRIPTION_PLANS);
  const [createCompany, { loading: creating }] = useMutation(CREATE_COMPANY, {
    onCompleted: () => {
      onSuccess();
      handleClose();
    },
    onError: (error) => {
      alert('Hata: ' + error.message);
    }
  });

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      planId: ''
    });
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.planId) {
      alert('Lütfen zorunlu alanları doldurun');
      return;
    }

    createCompany({
      variables: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address || null,
        planId: formData.planId
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Yeni Müşteri Ekle</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="company-form">
          <div className="form-group">
            <label>Şirket Adı *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Örn: ABC Teknoloji A.Ş."
              required
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="info@firma.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Telefon</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+90 555 000 0000"
            />
          </div>

          <div className="form-group">
            <label>Adres</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Şirket adresi"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Üyelik Planı *</label>
            {plansLoading ? (
              <p>Planlar yükleniyor...</p>
            ) : (
              <select
                value={formData.planId}
                onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                required
              >
                <option value="">Seçiniz...</option>
                {plansData?.subscriptionPlans?.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - {plan.monthlyPrice}₺/ay
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="subscription-info">
            <p>ℹ️ Üyelik bugün başlayacak ve aylık olarak otomatik yenilenecektir.</p>
            <p>Fatura dönemi: Her ayın {new Date().getDate()}. günü</p>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              İptal
            </button>
            <button type="submit" className="btn-submit" disabled={creating}>
              {creating ? 'Kaydediliyor...' : 'Müşteri Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCompanyModal;
