/**
 * Likert Test Templates Page
 * Manages Likert test question templates (not email templates)
 */
import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, ListChecks, ToggleLeft, ToggleRight, Search, Sparkles } from 'lucide-react';
import { 
  GET_LIKERT_TEMPLATES,
  DELETE_LIKERT_TEMPLATE,
  TOGGLE_LIKERT_TEMPLATE,
} from '../graphql/likert';
import AddEditLikertTestTemplateModal from './AddEditLikertTestTemplateModal';

const LikertTestTemplatesPage = () => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch templates
  const { data, loading, error, refetch } = useQuery(GET_LIKERT_TEMPLATES, {
    fetchPolicy: 'network-only',
  });

  const [deleteTemplate] = useMutation(DELETE_LIKERT_TEMPLATE, {
    onCompleted: () => {
      refetch();
      setDeleteConfirm(null);
    },
    onError: (err) => {
      alert((isEnglish ? 'Error: ' : 'Hata: ') + err.message);
      setDeleteConfirm(null);
    }
  });

  const [toggleTemplate] = useMutation(TOGGLE_LIKERT_TEMPLATE, {
    onCompleted: () => refetch(),
  });

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    deleteTemplate({ variables: { id } });
  };

  const handleToggle = (id) => {
    toggleTemplate({ variables: { id } });
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingTemplate(null);
  };

  const handleSuccess = () => {
    refetch();
  };

  const templates = data?.likertTemplates || [];
  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ color: '#6B7280' }}>{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#EF4444' }}>
        <p>{t('common.error')}: {error.message}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 24 
      }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1F2937', marginBottom: 8 }}>
            {isEnglish ? 'Likert Test Templates' : 'Likert Test Şablonları'}
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280' }}>
            {isEnglish 
              ? 'Create and manage personality assessment templates' 
              : 'Kişilik değerlendirme şablonlarını oluşturun ve yönetin'}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
          }}
        >
          <Plus size={18} />
          {isEnglish ? 'New Template' : 'Yeni Şablon'}
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12, 
          padding: '12px 16px', 
          background: 'white', 
          borderRadius: 10,
          border: '1px solid #E5E7EB',
          maxWidth: 400,
        }}>
          <Search size={18} color="#9CA3AF" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isEnglish ? 'Search templates...' : 'Şablon ara...'}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 14,
              background: 'transparent',
            }}
          />
        </div>
      </div>

      {/* Templates List */}
      {filteredTemplates.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 60, 
          background: 'white', 
          borderRadius: 16,
          border: '1px solid #E5E7EB',
        }}>
          <ListChecks size={48} color="#D1D5DB" style={{ marginBottom: 16 }} />
          <h3 style={{ color: '#6B7280', marginBottom: 8 }}>
            {searchTerm 
              ? (isEnglish ? 'No templates found' : 'Şablon bulunamadı')
              : (isEnglish ? 'No templates yet' : 'Henüz şablon yok')}
          </h3>
          <p style={{ color: '#9CA3AF', fontSize: 14 }}>
            {isEnglish 
              ? 'Create your first Likert test template' 
              : 'İlk Likert test şablonunuzu oluşturun'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              style={{
                background: 'white',
                borderRadius: 12,
                border: '1px solid #E5E7EB',
                padding: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                transition: 'all 0.2s',
              }}
            >
              {/* Icon */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <ListChecks size={24} color="#7C3AED" />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <h3 style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#1F2937',
                    margin: 0,
                  }}>
                    {template.name}
                  </h3>
                  {template.isAiGenerated && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
                      color: 'white',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      <Sparkles size={12} />
                      AI
                    </span>
                  )}
                </div>
                <p style={{
                  fontSize: 13,
                  color: '#6B7280',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {template.questionCount} {isEnglish ? 'questions' : 'soru'} • 
                  {template.scaleType === 5 ? ' 5' : ' 7'}{isEnglish ? '-point scale' : '\'li ölçek'} • 
                  {template.language === 'en' ? ' EN' : ' TR'}
                  {template.timeLimit && ` • ${Math.floor(template.timeLimit / 60)} dk`}
                </p>
              </div>

              {/* Status */}
              <button
                onClick={() => handleToggle(template.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  background: template.isActive ? '#D1FAE5' : '#FEE2E2',
                  borderRadius: 20,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {template.isActive ? (
                  <ToggleRight size={16} color="#059669" />
                ) : (
                  <ToggleLeft size={16} color="#DC2626" />
                )}
                <span style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: template.isActive ? '#059669' : '#DC2626',
                }}>
                  {template.isActive
                    ? t('common.active', 'Aktif')
                    : t('common.inactive', 'Pasif')}
                </span>
              </button>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleEdit(template)}
                  style={{
                    padding: 10,
                    background: '#EEF2FF',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={t('common.edit', 'Düzenle')}
                >
                  <Edit2 size={16} color="#6366F1" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(template)}
                  style={{
                    padding: 10,
                    background: '#FEE2E2',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={t('common.delete', 'Sil')}
                >
                  <Trash2 size={16} color="#DC2626" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
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
            <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 600 }}>
              {isEnglish ? 'Delete Template' : 'Şablonu Sil'}
            </h3>
            <p style={{ margin: '0 0 24px', color: '#6B7280' }}>
              <strong>{deleteConfirm.name}</strong> {isEnglish ? 'will be deleted. This action cannot be undone.' : 'silinecek. Bu işlem geri alınamaz.'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '10px 20px',
                  background: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                {t('common.cancel', 'İptal')}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                style={{
                  padding: '10px 20px',
                  background: '#DC2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                {t('common.delete', 'Sil')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AddEditLikertTestTemplateModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        template={editingTemplate}
      />
    </div>
  );
};

export default LikertTestTemplatesPage;
