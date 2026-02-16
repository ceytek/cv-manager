/**
 * Rejection Templates Page
 * Manages email templates for candidate rejection messages
 */
import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, Mail, ToggleLeft, ToggleRight, Star, XCircle } from 'lucide-react';
import { 
  GET_REJECTION_TEMPLATES, 
  DELETE_REJECTION_TEMPLATE,
  UPDATE_REJECTION_TEMPLATE
} from '../graphql/rejectionTemplates';
import AddEditRejectionTemplateModal from './AddEditRejectionTemplateModal';

const RejectionTemplatesPage = () => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data, loading, error, refetch } = useQuery(GET_REJECTION_TEMPLATES, {
    fetchPolicy: 'network-only',
  });

  const [deleteTemplate] = useMutation(DELETE_REJECTION_TEMPLATE, {
    onCompleted: () => {
      refetch();
      setDeleteConfirm(null);
    },
    onError: (error) => {
      alert((isEnglish ? 'Error: ' : 'Hata: ') + error.message);
      setDeleteConfirm(null);
    }
  });

  const [updateTemplate] = useMutation(UPDATE_REJECTION_TEMPLATE, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      alert((isEnglish ? 'Error: ' : 'Hata: ') + error.message);
    }
  });

  const handleToggleActive = (template) => {
    updateTemplate({
      variables: {
        id: template.id,
        input: {
          isActive: !template.isActive
        }
      }
    });
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    deleteTemplate({ variables: { id } });
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingTemplate(null);
    refetch();
  };

  // Available variables for templates
  const variables = [
    { key: 'ad', label: t('rejectionTemplates.variables.name', 'Ad'), example: isEnglish ? 'John' : 'Ahmet' },
    { key: 'soyad', label: t('rejectionTemplates.variables.surname', 'Soyad'), example: isEnglish ? 'Doe' : 'Yılmaz' },
    { key: 'telefon', label: t('rejectionTemplates.variables.phone', 'Telefon'), example: '+90 532 123 4567' },
    { key: 'ilan_adi', label: t('rejectionTemplates.variables.jobTitle', 'İlan Adı'), example: isEnglish ? 'Software Developer' : 'Yazılım Geliştirici' },
    { key: 'sirket_adi', label: t('rejectionTemplates.variables.companyName', 'Şirket Adı'), example: isEnglish ? 'ABC Company' : 'ABC Şirketi' },
    { key: 'sirket_logo', label: t('rejectionTemplates.variables.companyLogo', 'Şirket Logosu'), example: '<img src="...">' },
  ];

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

  const templates = data?.rejectionTemplates || [];

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
            {t('rejectionTemplates.title')}
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280' }}>
            {t('rejectionTemplates.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 20px',
            background: '#EF4444',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={18} />
          {t('rejectionTemplates.newTemplate')}
        </button>
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 60,
          background: '#F9FAFB',
          borderRadius: 12,
          border: '2px dashed #E5E7EB',
        }}>
          <XCircle size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#6B7280', marginBottom: 8 }}>
            {t('rejectionTemplates.noTemplates')}
          </h3>
          <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 20 }}>
            {t('rejectionTemplates.createFirst')}
          </p>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={18} />
            {t('rejectionTemplates.newTemplate')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {templates.map((template) => (
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
                background: template.isActive ? '#FEE2E2' : '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <XCircle size={24} color={template.isActive ? '#DC2626' : '#9CA3AF'} />
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
                  {template.isDefault && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      background: '#FEF3C7',
                      color: '#D97706',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      <Star size={12} fill="#D97706" />
                      {t('common.default', 'Varsayılan')}
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
                  <Mail size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  {template.subject}
                </p>
              </div>

              {/* Status - Toggle Button */}
              <button
                onClick={() => handleToggleActive(template)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  background: template.isActive ? '#D1FAE5' : '#FEE2E2',
                  borderRadius: 20,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                title={template.isActive 
                  ? t('rejectionTemplates.clickToDeactivate', 'Pasif yapmak için tıklayın')
                  : t('rejectionTemplates.clickToActivate', 'Aktif yapmak için tıklayın')}
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

      {/* Delete Confirmation */}
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
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', marginBottom: 12 }}>
              {t('rejectionTemplates.deleteConfirmTitle')}
            </h3>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
              "{deleteConfirm.name}" {t('rejectionTemplates.deleteConfirmMessage')}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '10px 20px',
                  background: '#F3F4F6',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
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
                  fontSize: 14,
                  fontWeight: 500,
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
      {showModal && (
        <AddEditRejectionTemplateModal
          key={`modal-${editingTemplate?.id || 'new'}`}
          template={editingTemplate}
          onClose={handleModalClose}
          variables={variables}
        />
      )}
    </div>
  );
};

export default RejectionTemplatesPage;
