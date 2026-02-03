import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { Gift, Plus, Search, Edit2, Trash2, X, Grid, List, Filter } from 'lucide-react';
import { GET_BENEFITS, DELETE_BENEFIT, BENEFIT_CATEGORIES, VALUE_PERIODS } from '../graphql/benefits';
import AddEditBenefitModal from './AddEditBenefitModal';

const BenefitsManagement = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'tr' ? 'tr' : 'en';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [showModal, setShowModal] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch benefits
  const { data, loading, refetch } = useQuery(GET_BENEFITS, {
    variables: { isActive: null },
    fetchPolicy: 'cache-and-network',
  });

  // Delete mutation
  const [deleteBenefit, { loading: deleting }] = useMutation(DELETE_BENEFIT, {
    onCompleted: (data) => {
      if (data.deleteBenefit.success) {
        refetch();
        setDeleteConfirm(null);
      }
    },
  });

  const benefits = data?.benefits || [];

  // Filter benefits
  const filteredBenefits = benefits.filter(benefit => {
    const matchesSearch = benefit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (benefit.description && benefit.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || benefit.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group benefits by category for display
  const groupedBenefits = filteredBenefits.reduce((acc, benefit) => {
    const cat = benefit.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(benefit);
    return acc;
  }, {});

  const handleEdit = (benefit) => {
    setEditingBenefit(benefit);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingBenefit(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingBenefit(null);
  };

  const handleSaveSuccess = () => {
    refetch();
    handleModalClose();
  };

  const handleDelete = (id) => {
    deleteBenefit({ variables: { id } });
  };

  const formatValue = (benefit) => {
    if (benefit.isVariable) {
      return t('benefits.variable', 'Değişken');
    }
    if (benefit.value) {
      const period = VALUE_PERIODS[benefit.valuePeriod] || VALUE_PERIODS.monthly;
      return `${benefit.value.toLocaleString()} ₺${period.shortLabel[lang]}`;
    }
    return '-';
  };

  const getCategoryInfo = (category) => {
    return BENEFIT_CATEGORIES[category] || BENEFIT_CATEGORIES.financial;
  };

  return (
    <div style={{ padding: 32, maxWidth: 1400, margin: '0 auto' }}>
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
            <Gift size={28} color="#3B82F6" />
            {t('benefits.title', 'Yan Haklar Yönetimi')}
          </h1>
          <p style={{ color: '#6B7280', margin: 0, fontSize: 14 }}>
            {t('benefits.subtitle', 'Adaylara sunulacak avantaj paketlerini buradan özelleştirebilirsiniz.')}
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
          {t('benefits.addNew', 'Yeni Yan Hak Ekle')}
        </button>
      </div>

      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        marginBottom: 24,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 400 }}>
          <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder={t('benefits.search', 'Yan hak ara...')}
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

        {/* Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} color="#6B7280" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '10px 14px',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              fontSize: 14,
              outline: 'none',
              cursor: 'pointer',
              background: 'white',
            }}
          >
            <option value="all">{t('benefits.allCategories', 'Tüm Kategoriler')}</option>
            {Object.entries(BENEFIT_CATEGORIES).map(([key, cat]) => (
              <option key={key} value={key}>{cat.label[lang]}</option>
            ))}
          </select>
        </div>

        {/* View Toggle */}
        <div style={{ 
          display: 'flex', 
          border: '1px solid #E5E7EB', 
          borderRadius: 8,
          overflow: 'hidden',
          marginLeft: 'auto'
        }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '8px 12px',
              border: 'none',
              background: viewMode === 'grid' ? '#3B82F6' : 'white',
              color: viewMode === 'grid' ? 'white' : '#6B7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderLeft: '1px solid #E5E7EB',
              background: viewMode === 'list' ? '#3B82F6' : 'white',
              color: viewMode === 'list' ? 'white' : '#6B7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Benefits Count */}
      <div style={{ marginBottom: 16, color: '#6B7280', fontSize: 14 }}>
        {t('benefits.total', 'Toplam')}: <strong>{filteredBenefits.length}</strong> {t('benefits.benefit', 'yan hak')}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>
          {t('common.loading', 'Yükleniyor...')}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredBenefits.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: 60, 
          background: '#F9FAFB',
          borderRadius: 16,
          border: '2px dashed #E5E7EB'
        }}>
          <Gift size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />
          <h3 style={{ color: '#374151', marginBottom: 8 }}>
            {searchTerm || selectedCategory !== 'all' 
              ? t('benefits.noResults', 'Sonuç bulunamadı')
              : t('benefits.empty', 'Henüz yan hak tanımlanmamış')
            }
          </h3>
          <p style={{ color: '#6B7280', marginBottom: 24 }}>
            {t('benefits.emptyDesc', 'Adaylara sunacağınız yan hakları ekleyin.')}
          </p>
          {!searchTerm && selectedCategory === 'all' && (
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
              {t('benefits.addFirst', 'İlk Yan Hakkı Ekle')}
            </button>
          )}
        </div>
      )}

      {/* Grid View */}
      {!loading && filteredBenefits.length > 0 && viewMode === 'grid' && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20 
        }}>
          {filteredBenefits.map(benefit => {
            const catInfo = getCategoryInfo(benefit.category);
            return (
              <div
                key={benefit.id}
                style={{
                  background: 'white',
                  borderRadius: 16,
                  padding: 20,
                  border: '1px solid #E5E7EB',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  opacity: benefit.isActive ? 1 : 0.6,
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
                {/* Icon */}
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `${catInfo.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  marginBottom: 16,
                }}>
                  {benefit.icon || catInfo.icon}
                </div>

                {/* Name */}
                <h3 style={{ 
                  fontSize: 16, 
                  fontWeight: 600, 
                  color: '#111827',
                  margin: 0,
                  marginBottom: 8
                }}>
                  {benefit.name}
                </h3>

                {/* Description */}
                <p style={{ 
                  fontSize: 13, 
                  color: '#6B7280',
                  margin: 0,
                  marginBottom: 16,
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  minHeight: 40,
                }}>
                  {benefit.description || '-'}
                </p>

                {/* Footer */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingTop: 16,
                  borderTop: '1px solid #F3F4F6'
                }}>
                  {/* Category Badge */}
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    background: `${catInfo.color}15`,
                    color: catInfo.color,
                  }}>
                    {catInfo.label[lang]}
                  </span>

                  {/* Value */}
                  <span style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: benefit.isVariable ? '#F59E0B' : '#10B981',
                  }}>
                    {formatValue(benefit)}
                  </span>
                </div>

                {/* Actions */}
                <div style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  display: 'flex',
                  gap: 4,
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
                className="benefit-actions"
                >
                  <button
                    onClick={() => handleEdit(benefit)}
                    style={{
                      padding: 8,
                      border: 'none',
                      background: '#F3F4F6',
                      borderRadius: 6,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Edit2 size={14} color="#6B7280" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(benefit)}
                    style={{
                      padding: 8,
                      border: 'none',
                      background: '#FEE2E2',
                      borderRadius: 6,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={14} color="#EF4444" />
                  </button>
                </div>

                {/* Inactive Badge */}
                {!benefit.isActive && (
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 600,
                    background: '#FEF3C7',
                    color: '#D97706',
                  }}>
                    {t('benefits.inactive', 'Pasif')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {!loading && filteredBenefits.length > 0 && viewMode === 'list' && (
        <div style={{ 
          background: 'white', 
          borderRadius: 16, 
          border: '1px solid #E5E7EB',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 120px',
            gap: 16,
            padding: '12px 20px',
            background: '#F9FAFB',
            borderBottom: '1px solid #E5E7EB',
            fontSize: 12,
            fontWeight: 600,
            color: '#6B7280',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            <span>{t('benefits.name', 'Yan Hak Adı')}</span>
            <span>{t('benefits.category', 'Kategori')}</span>
            <span>{t('benefits.value', 'Değeri')}</span>
            <span style={{ textAlign: 'right' }}>{t('benefits.actions', 'İşlemler')}</span>
          </div>

          {/* Rows */}
          {filteredBenefits.map(benefit => {
            const catInfo = getCategoryInfo(benefit.category);
            return (
              <div
                key={benefit.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 120px',
                  gap: 16,
                  padding: '16px 20px',
                  borderBottom: '1px solid #F3F4F6',
                  alignItems: 'center',
                  opacity: benefit.isActive ? 1 : 0.6,
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseOut={(e) => e.currentTarget.style.background = 'white'}
              >
                {/* Name & Description */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: `${catInfo.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0,
                  }}>
                    {benefit.icon || catInfo.icon}
                  </div>
                  <div>
                    <div style={{ 
                      fontWeight: 600, 
                      color: '#111827', 
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      {benefit.name}
                      {!benefit.isActive && (
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 600,
                          background: '#FEF3C7',
                          color: '#D97706',
                        }}>
                          {t('benefits.inactive', 'Pasif')}
                        </span>
                      )}
                    </div>
                    {benefit.description && (
                      <div style={{ 
                        fontSize: 12, 
                        color: '#6B7280',
                        marginTop: 2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: 300,
                      }}>
                        {benefit.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Category */}
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  background: `${catInfo.color}15`,
                  color: catInfo.color,
                  width: 'fit-content',
                }}>
                  {catInfo.label[lang]}
                </span>

                {/* Value */}
                <span style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: benefit.isVariable ? '#F59E0B' : '#10B981',
                }}>
                  {formatValue(benefit)}
                </span>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleEdit(benefit)}
                    style={{
                      padding: 8,
                      border: 'none',
                      background: '#F3F4F6',
                      borderRadius: 6,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title={t('common.edit', 'Düzenle')}
                  >
                    <Edit2 size={14} color="#6B7280" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(benefit)}
                    style={{
                      padding: 8,
                      border: 'none',
                      background: '#FEE2E2',
                      borderRadius: 6,
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
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <AddEditBenefitModal
          benefit={editingBenefit}
          onClose={handleModalClose}
          onSuccess={handleSaveSuccess}
        />
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
              {t('benefits.deleteTitle', 'Yan Hakkı Sil')}
            </h3>
            <p style={{ color: '#6B7280', marginBottom: 24 }}>
              <strong>{deleteConfirm.name}</strong> {t('benefits.deleteConfirm', 'yan hakkını silmek istediğinizden emin misiniz?')}
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

      {/* CSS for hover actions */}
      <style>{`
        div:hover > .benefit-actions {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

export default BenefitsManagement;
