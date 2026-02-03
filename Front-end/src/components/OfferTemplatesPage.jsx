import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { FileText, Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight, Eye } from 'lucide-react';
import { GET_OFFER_TEMPLATES, DELETE_OFFER_TEMPLATE, TOGGLE_OFFER_TEMPLATE } from '../graphql/offer';
import AddEditOfferTemplateModal from './AddEditOfferTemplateModal';

const OfferTemplatesPage = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'tr' ? 'tr' : 'en';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // Fetch templates
  const { data, loading, refetch } = useQuery(GET_OFFER_TEMPLATES, {
    fetchPolicy: 'cache-and-network',
  });

  // Delete mutation
  const [deleteTemplate, { loading: deleting }] = useMutation(DELETE_OFFER_TEMPLATE, {
    onCompleted: (data) => {
      if (data.deleteOfferTemplate.success) {
        refetch();
        setDeleteConfirm(null);
      }
    },
  });

  // Toggle mutation
  const [toggleTemplate] = useMutation(TOGGLE_OFFER_TEMPLATE, {
    onCompleted: () => refetch(),
  });

  const templates = data?.offerTemplates || [];

  // Filter templates
  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingTemplate(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingTemplate(null);
  };

  const handleSaveSuccess = () => {
    refetch();
    handleModalClose();
  };

  const handleDelete = (id) => {
    deleteTemplate({ variables: { id } });
  };

  const handleToggle = (id) => {
    toggleTemplate({ variables: { id } });
  };

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: 32 
      }}>
        <div>
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            color: '#111827',
            margin: 0,
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <FileText size={28} color="#3B82F6" />
            {t('offerTemplates.title', 'Teklif Şablonları')}
          </h1>
          <p style={{ color: '#6B7280', margin: 0, fontSize: 14 }}>
            {t('offerTemplates.subtitle', 'Adaylara gönderilecek iş tekliflerinin şablonlarını yönetin.')}
          </p>
        </div>
        <button
          onClick={handleAdd}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.35)';
          }}
        >
          <Plus size={18} />
          {t('offerTemplates.addNew', 'Yeni Şablon Ekle')}
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder={t('offerTemplates.search', 'Şablon ara...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px 12px 44px',
              border: '1px solid #E5E7EB',
              borderRadius: 10,
              fontSize: 14,
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
            onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>
          {t('common.loading', 'Yükleniyor...')}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredTemplates.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: 60, 
          background: '#F9FAFB',
          borderRadius: 16,
          border: '2px dashed #E5E7EB'
        }}>
          <FileText size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />
          <h3 style={{ color: '#374151', marginBottom: 8 }}>
            {searchTerm 
              ? t('offerTemplates.noResults', 'Sonuç bulunamadı')
              : t('offerTemplates.empty', 'Henüz teklif şablonu oluşturulmamış')
            }
          </h3>
          <p style={{ color: '#6B7280', marginBottom: 24 }}>
            {t('offerTemplates.emptyDesc', 'Adaylara göndereceğiniz teklifler için şablonlar oluşturun.')}
          </p>
          {!searchTerm && (
            <button
              onClick={handleAdd}
              style={{
                padding: '12px 24px',
                background: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              {t('offerTemplates.addFirst', 'İlk Şablonu Oluştur')}
            </button>
          )}
        </div>
      )}

      {/* Templates List */}
      {!loading && filteredTemplates.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: 20 
        }}>
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              style={{
                background: 'white',
                borderRadius: 16,
                padding: 24,
                border: '1px solid #E5E7EB',
                transition: 'all 0.2s ease',
                opacity: template.isActive ? 1 : 0.6,
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: '#EFF6FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <FileText size={22} color="#3B82F6" />
                  </div>
                  <div>
                    <h3 style={{ 
                      fontSize: 16, 
                      fontWeight: 600, 
                      color: '#111827',
                      margin: 0,
                    }}>
                      {template.name}
                    </h3>
                    <span style={{
                      fontSize: 12,
                      color: template.isActive ? '#10B981' : '#9CA3AF',
                    }}>
                      {template.isActive 
                        ? t('common.active', 'Aktif') 
                        : t('common.inactive', 'Pasif')
                      }
                    </span>
                  </div>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => handleToggle(template.id)}
                  style={{
                    padding: 4,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                  title={template.isActive ? t('common.clickToDeactivate') : t('common.clickToActivate')}
                >
                  {template.isActive 
                    ? <ToggleRight size={28} color="#10B981" />
                    : <ToggleLeft size={28} color="#9CA3AF" />
                  }
                </button>
              </div>

              {/* Info */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ 
                  fontSize: 13, 
                  color: '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8
                }}>
                  <span style={{ fontWeight: 500 }}>{t('offerTemplates.validityDays', 'Geçerlilik')}:</span>
                  <span>{template.defaultValidityDays} {t('common.days', 'gün')}</span>
                </div>
                
                {template.introText && (
                  <div style={{ 
                    fontSize: 13, 
                    color: '#9CA3AF',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {template.introText.substring(0, 100)}...
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ 
                display: 'flex', 
                gap: 8,
                paddingTop: 16,
                borderTop: '1px solid #F3F4F6'
              }}>
                <button
                  onClick={() => setPreviewTemplate(template)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #E5E7EB',
                    background: 'white',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Eye size={14} />
                  {t('common.preview', 'Önizle')}
                </button>
                <button
                  onClick={() => handleEdit(template)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #3B82F6',
                    background: '#EFF6FF',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#3B82F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Edit2 size={14} />
                  {t('common.edit', 'Düzenle')}
                </button>
                <button
                  onClick={() => setDeleteConfirm(template)}
                  style={{
                    padding: '10px',
                    border: '1px solid #FEE2E2',
                    background: '#FEF2F2',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={t('common.delete', 'Sil')}
                >
                  <Trash2 size={14} color="#EF4444" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <AddEditOfferTemplateModal
          template={editingTemplate}
          onClose={handleModalClose}
          onSuccess={handleSaveSuccess}
        />
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            maxWidth: 600,
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                {previewTemplate.name}
              </h3>
              <button
                onClick={() => setPreviewTemplate(null)}
                style={{
                  padding: 8,
                  border: 'none',
                  background: '#F3F4F6',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
            
            {/* Content */}
            <div style={{ padding: 24 }}>
              {/* Intro */}
              {previewTemplate.introText && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                    {t('offerTemplates.introText', 'Giriş Metni')}
                  </h4>
                  <div style={{ 
                    padding: 16, 
                    background: '#F9FAFB', 
                    borderRadius: 8,
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: '#374151',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {previewTemplate.introText}
                  </div>
                </div>
              )}

              {/* Outro */}
              {previewTemplate.outroText && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                    {t('offerTemplates.outroText', 'Kapanış Metni')}
                  </h4>
                  <div style={{ 
                    padding: 16, 
                    background: '#F9FAFB', 
                    borderRadius: 8,
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: '#374151',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {previewTemplate.outroText}
                  </div>
                </div>
              )}

              {/* Validity */}
              <div style={{
                padding: 12,
                background: '#EFF6FF',
                borderRadius: 8,
                fontSize: 14,
                color: '#3B82F6',
              }}>
                {t('offerTemplates.defaultValidity', 'Varsayılan geçerlilik süresi')}: <strong>{previewTemplate.defaultValidityDays} {t('common.days', 'gün')}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 24,
            maxWidth: 400,
            width: '90%',
          }}>
            <h3 style={{ margin: 0, marginBottom: 12, color: '#111827' }}>
              {t('offerTemplates.deleteTitle', 'Şablonu Sil')}
            </h3>
            <p style={{ color: '#6B7280', marginBottom: 24 }}>
              <strong>{deleteConfirm.name}</strong> {t('offerTemplates.deleteConfirm', 'şablonunu silmek istediğinizden emin misiniz?')}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #E5E7EB',
                  background: 'white',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                {t('common.cancel', 'İptal')}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={deleting}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  background: '#EF4444',
                  color: 'white',
                  borderRadius: 8,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
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

export default OfferTemplatesPage;
