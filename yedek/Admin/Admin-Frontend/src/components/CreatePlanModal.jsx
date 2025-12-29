import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_SUBSCRIPTION_PLAN, GET_SUBSCRIPTION_PLANS } from '../graphql/subscriptionPlans';
import { GET_SUBSCRIPTION_PLANS_WITH_COUNT } from '../graphql/queries';
import './CreateCompanyModal.css';

const CreatePlanModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    cvLimit: '',
    jobLimit: '',
    userLimit: '',
    monthlyPrice: '',
    yearlyPrice: '',
    sortOrder: '0'
  });

  const [createPlan, { loading, error }] = useMutation(CREATE_SUBSCRIPTION_PLAN, {
    refetchQueries: [
      { query: GET_SUBSCRIPTION_PLANS },
      { query: GET_SUBSCRIPTION_PLANS_WITH_COUNT }
    ],
    onCompleted: () => {
      // Reset form
      setFormData({
        name: '',
        slug: '',
        description: '',
        cvLimit: '',
        jobLimit: '',
        userLimit: '',
        monthlyPrice: '',
        yearlyPrice: '',
        sortOrder: '0'
      });
      onClose();
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value.toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await createPlan({
        variables: {
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          description: formData.description ? formData.description.trim() : null,
          cvLimit: parseInt(formData.cvLimit, 10),
          jobLimit: parseInt(formData.jobLimit, 10),
          userLimit: parseInt(formData.userLimit, 10),
          monthlyPrice: parseFloat(formData.monthlyPrice),
          yearlyPrice: parseFloat(formData.yearlyPrice),
          sortOrder: parseInt(formData.sortOrder || '0', 10)
        }
      });
    } catch (err) {
      // error is surfaced via `error`
    }
  };

  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Yeni Abonelik Paketi</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="company-form">
          {error && (
            <div className="subscription-info" style={{color:'#b91c1c',background:'#fef2f2',borderColor:'#fecaca'}}>
              {error.message}
            </div>
          )}

          <div className="form-group">
            <label>Plan Adı *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="örn: Starter, Pro, Business"
              required
            />
          </div>

          <div className="form-group">
            <label>Slug (URL) *</label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="örn: starter, pro, business"
              required
            />
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>İsimden otomatik oluşturulur</p>
          </div>

          <div className="form-group">
            <label>Açıklama</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Paketin açıklaması..."
            />
          </div>

          <div className="form-group">
            <label>CV Limiti *</label>
            <input
              type="number"
              name="cvLimit"
              value={formData.cvLimit}
              onChange={handleChange}
              min="0"
              placeholder="10"
              required
            />
          </div>

          <div className="form-group">
            <label>İlan Limiti *</label>
            <input
              type="number"
              name="jobLimit"
              value={formData.jobLimit}
              onChange={handleChange}
              min="0"
              placeholder="5"
              required
            />
          </div>

          <div className="form-group">
            <label>Kullanıcı Limiti *</label>
            <input
              type="number"
              name="userLimit"
              value={formData.userLimit}
              onChange={handleChange}
              min="0"
              placeholder="3"
              required
            />
          </div>

          <div className="form-group">
            <label>Aylık Fiyat (₺) *</label>
            <input
              type="number"
              name="monthlyPrice"
              value={formData.monthlyPrice}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="499.00"
              required
            />
          </div>

          <div className="form-group">
            <label>Yıllık Fiyat (₺) *</label>
            <input
              type="number"
              name="yearlyPrice"
              value={formData.yearlyPrice}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="4990.00"
              required
            />
          </div>

          <div className="form-group">
            <label>Sıralama</label>
            <input
              type="number"
              name="sortOrder"
              value={formData.sortOrder}
              onChange={handleChange}
              min="0"
              placeholder="0"
            />
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>Küçük değerler önce gösterilir</p>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              İptal
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Oluşturuluyor...' : 'Paket Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePlanModal;
