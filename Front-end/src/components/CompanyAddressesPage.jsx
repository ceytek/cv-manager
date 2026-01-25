/**
 * Company Addresses Page
 * Şirket Adresleri Yönetimi
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@apollo/client/react';
import { 
  MapPin, 
  Plus, 
  Edit2, 
  Trash2, 
  ExternalLink, 
  Star, 
  Building2,
  X,
  Check,
  AlertCircle,
  Map
} from 'lucide-react';
import {
  GET_COMPANY_ADDRESSES,
  CREATE_COMPANY_ADDRESS,
  UPDATE_COMPANY_ADDRESS,
  DELETE_COMPANY_ADDRESS,
} from '../graphql/companyAddress';

const CompanyAddressesPage = () => {
  const { t } = useTranslation();
  
  // State
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    googleMapsLink: '',
    city: '',
    district: '',
    postalCode: '',
    isDefault: false,
  });
  
  // Query
  const { data, loading, refetch } = useQuery(GET_COMPANY_ADDRESSES, {
    fetchPolicy: 'network-only',
  });
  
  // Mutations
  const [createAddress, { loading: creating }] = useMutation(CREATE_COMPANY_ADDRESS);
  const [updateAddress, { loading: updating }] = useMutation(UPDATE_COMPANY_ADDRESS);
  const [deleteAddress, { loading: deleting }] = useMutation(DELETE_COMPANY_ADDRESS);
  
  const addresses = data?.companyAddresses || [];

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      googleMapsLink: '',
      city: '',
      district: '',
      postalCode: '',
      isDefault: false,
    });
    setEditingAddress(null);
  };

  const handleOpenModal = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        name: address.name || '',
        address: address.address || '',
        googleMapsLink: address.googleMapsLink || '',
        city: address.city || '',
        district: address.district || '',
        postalCode: address.postalCode || '',
        isDefault: address.isDefault || false,
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingAddress) {
        await updateAddress({
          variables: {
            input: {
              id: editingAddress.id,
              ...formData,
            },
          },
        });
      } else {
        await createAddress({
          variables: {
            input: formData,
          },
        });
      }
      
      refetch();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving address:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAddress({
        variables: { id },
      });
      refetch();
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting address:', err);
    }
  };

  const handleSetDefault = async (address) => {
    try {
      await updateAddress({
        variables: {
          input: {
            id: address.id,
            isDefault: true,
          },
        },
      });
      refetch();
    } catch (err) {
      console.error('Error setting default:', err);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24 
      }}>
        <div>
          <h1 style={{ 
            margin: 0, 
            fontSize: 24, 
            fontWeight: 700, 
            color: '#1F2937',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <Building2 size={28} color="#8B5CF6" />
            {t('companyAddresses.title', 'Şirket Adresleri')}
          </h1>
          <p style={{ margin: '8px 0 0', color: '#6B7280', fontSize: 14 }}>
            {t('companyAddresses.subtitle', 'Şirketinizin adreslerini yönetin')}
          </p>
        </div>
        
        <button
          onClick={() => handleOpenModal()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
          }}
        >
          <Plus size={18} />
          {t('companyAddresses.addNew', 'Yeni Adres Ekle')}
        </button>
      </div>

      {/* Addresses List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="loading-spinner" style={{ width: 40, height: 40, margin: '0 auto' }} />
        </div>
      ) : addresses.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 64,
          background: '#F9FAFB',
          borderRadius: 16,
          border: '2px dashed #E5E7EB'
        }}>
          <MapPin size={48} style={{ color: '#9CA3AF', marginBottom: 16 }} />
          <h3 style={{ margin: '0 0 8px', color: '#374151', fontWeight: 600 }}>
            {t('companyAddresses.noAddresses', 'Henüz adres eklenmemiş')}
          </h3>
          <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>
            {t('companyAddresses.noAddressesDesc', 'İlk adresinizi ekleyerek başlayın')}
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: 20 
        }}>
          {addresses.map((address) => (
            <div
              key={address.id}
              style={{
                background: 'white',
                borderRadius: 16,
                padding: 24,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: address.isDefault ? '2px solid #8B5CF6' : '1px solid #E5E7EB',
                position: 'relative',
              }}
            >
              {/* Default Badge */}
              {address.isDefault && (
                <div style={{
                  position: 'absolute',
                  top: -10,
                  right: 16,
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <Star size={12} fill="white" />
                  {t('companyAddresses.default', 'Varsayılan')}
                </div>
              )}

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: address.isDefault ? '#EDE9FE' : '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <MapPin size={22} color={address.isDefault ? '#8B5CF6' : '#6B7280'} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1F2937' }}>
                    {address.name}
                  </h3>
                  {(address.city || address.district) && (
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
                      {[address.district, address.city].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div style={{ 
                background: '#F9FAFB', 
                borderRadius: 10, 
                padding: 14, 
                marginBottom: 16 
              }}>
                <p style={{ 
                  margin: 0, 
                  fontSize: 14, 
                  color: '#374151', 
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap'
                }}>
                  {address.address}
                </p>
                {address.postalCode && (
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: '#6B7280' }}>
                    📮 {address.postalCode}
                  </p>
                )}
              </div>

              {/* Google Maps Link */}
              {address.googleMapsLink && (
                <a
                  href={address.googleMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    background: '#EDE9FE',
                    color: '#6D28D9',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: 'none',
                    marginBottom: 16,
                  }}
                >
                  <Map size={16} />
                  {t('companyAddresses.viewOnMap', 'Haritada Görüntüle')}
                  <ExternalLink size={14} style={{ marginLeft: 'auto' }} />
                </a>
              )}

              {/* Actions */}
              <div style={{ 
                display: 'flex', 
                gap: 8, 
                paddingTop: 16, 
                borderTop: '1px solid #E5E7EB' 
              }}>
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: '#F9FAFB',
                      color: '#374151',
                      border: '1px solid #E5E7EB',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Star size={14} />
                    {t('companyAddresses.setDefault', 'Varsayılan Yap')}
                  </button>
                )}
                <button
                  onClick={() => handleOpenModal(address)}
                  style={{
                    padding: '8px 12px',
                    background: '#F0FDF4',
                    color: '#16A34A',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Edit2 size={14} />
                  {t('common.edit', 'Düzenle')}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(address.id)}
                  style={{
                    padding: '8px 12px',
                    background: '#FEF2F2',
                    color: '#DC2626',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Trash2 size={14} />
                  {t('common.delete', 'Sil')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            width: '100%',
            maxWidth: 560,
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
              borderRadius: '16px 16px 0 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'white' }}>
                <MapPin size={24} />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                  {editingAddress 
                    ? t('companyAddresses.editAddress', 'Adresi Düzenle')
                    : t('companyAddresses.addAddress', 'Yeni Adres Ekle')}
                </h2>
              </div>
              <button
                onClick={handleCloseModal}
                style={{
                  padding: 8,
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 8,
                }}
              >
                <X size={20} color="white" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              {/* Name */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: '#374151', 
                  marginBottom: 8 
                }}>
                  {t('companyAddresses.addressName', 'Adres Adı')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('companyAddresses.addressNamePlaceholder', 'Örn: Merkez Ofis, Fabrika')}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #E5E7EB',
                    borderRadius: 10,
                    fontSize: 14,
                  }}
                />
              </div>

              {/* Address */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: '#374151', 
                  marginBottom: 8 
                }}>
                  {t('companyAddresses.fullAddress', 'Açık Adres')} *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={t('companyAddresses.fullAddressPlaceholder', 'Sokak, bina no, kat bilgisi...')}
                  required
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #E5E7EB',
                    borderRadius: 10,
                    fontSize: 14,
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* City & District */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: 14, 
                    fontWeight: 600, 
                    color: '#374151', 
                    marginBottom: 8 
                  }}>
                    {t('companyAddresses.city', 'Şehir')}
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder={t('companyAddresses.cityPlaceholder', 'İstanbul')}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #E5E7EB',
                      borderRadius: 10,
                      fontSize: 14,
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: 14, 
                    fontWeight: 600, 
                    color: '#374151', 
                    marginBottom: 8 
                  }}>
                    {t('companyAddresses.district', 'İlçe')}
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder={t('companyAddresses.districtPlaceholder', 'Kadıköy')}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #E5E7EB',
                      borderRadius: 10,
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>

              {/* Postal Code */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: '#374151', 
                  marginBottom: 8 
                }}>
                  {t('companyAddresses.postalCode', 'Posta Kodu')}
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="34000"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #E5E7EB',
                    borderRadius: 10,
                    fontSize: 14,
                  }}
                />
              </div>

              {/* Google Maps Link */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: '#374151', 
                  marginBottom: 8 
                }}>
                  <Map size={16} color="#8B5CF6" />
                  {t('companyAddresses.googleMapsLink', 'Google Harita Linki')}
                </label>
                <input
                  type="url"
                  value={formData.googleMapsLink}
                  onChange={(e) => setFormData({ ...formData, googleMapsLink: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #E5E7EB',
                    borderRadius: 10,
                    fontSize: 14,
                  }}
                />
                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#6B7280' }}>
                  💡 {t('companyAddresses.googleMapsHint', 'Google Maps\'ten "Paylaş" > "Bağlantı kopyala" ile alabilirsiniz.')}
                </p>
              </div>

              {/* Is Default */}
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  padding: '12px 16px',
                  background: formData.isDefault ? '#EDE9FE' : '#F9FAFB',
                  borderRadius: 10,
                  border: formData.isDefault ? '2px solid #8B5CF6' : '1px solid #E5E7EB',
                }}>
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: '#8B5CF6' }}
                  />
                  <div>
                    <span style={{ 
                      fontWeight: 600, 
                      color: formData.isDefault ? '#6D28D9' : '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <Star size={16} fill={formData.isDefault ? '#8B5CF6' : 'none'} />
                      {t('companyAddresses.setAsDefault', 'Varsayılan Adres Olarak Ayarla')}
                    </span>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6B7280' }}>
                      {t('companyAddresses.defaultHint', 'Bu adres 2. görüşme davetlerinde varsayılan olarak seçilecek.')}
                    </p>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    padding: '12px 24px',
                    background: '#F3F4F6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t('common.cancel', 'İptal')}
                </button>
                <button
                  type="submit"
                  disabled={creating || updating}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: (creating || updating) ? 0.7 : 1,
                  }}
                >
                  <Check size={18} />
                  {(creating || updating)
                    ? t('common.saving', 'Kaydediliyor...')
                    : t('common.save', 'Kaydet')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 24,
            width: '90%',
            maxWidth: 400,
            textAlign: 'center',
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <AlertCircle size={32} color="#DC2626" />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: '#1F2937' }}>
              {t('companyAddresses.deleteConfirm', 'Adresi Sil')}
            </h3>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6B7280' }}>
              {t('companyAddresses.deleteConfirmDesc', 'Bu adresi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                style={{
                  padding: '10px 20px',
                  background: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t('common.cancel', 'İptal')}
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={deleting}
                style={{
                  padding: '10px 20px',
                  background: '#DC2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? t('common.deleting', 'Siliniyor...') : t('common.delete', 'Sil')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyAddressesPage;
