/**
 * AI Interview Email Templates Page
 * Manages email templates for AI interview invitations
 */
import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, Sparkles, ToggleLeft, ToggleRight, Star, Mail } from 'lucide-react';
import { 
  GET_AI_INTERVIEW_EMAIL_TEMPLATES,
  DELETE_AI_INTERVIEW_EMAIL_TEMPLATE,
} from '../graphql/aiInterviewTemplate';
import AddEditAIInterviewTemplateModal from './AddEditAIInterviewTemplateModal';

const AIInterviewTemplatesPage = () => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch templates - no language filter
  const { data, loading, error, refetch } = useQuery(GET_AI_INTERVIEW_EMAIL_TEMPLATES, {
    variables: { 
      activeOnly: false 
    },
    fetchPolicy: 'network-only',
  });

  const [deleteTemplate] = useMutation(DELETE_AI_INTERVIEW_EMAIL_TEMPLATE, {
    onCompleted: () => {
      refetch();
      setDeleteConfirm(null);
    },
    onError: (error) => {
      alert((isEnglish ? 'Error: ' : 'Hata: ') + error.message);
      setDeleteConfirm(null);
    }
  });

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

  // Get variables from response
  const variables = data?.aiInterviewEmailTemplates?.variables || [];

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

  const templates = data?.aiInterviewEmailTemplates?.templates || [];

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
            {t('aiInterviewTemplates.title', 'AI Görüşme Şablonları')}
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280' }}>
            {t('aiInterviewTemplates.subtitle', 'AI görüşme davet e-postalarını yönetin')}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 20px',
            background: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={18} />
          {t('aiInterviewTemplates.newTemplate', 'Yeni Şablon')}
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
          <Sparkles size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#6B7280', marginBottom: 8 }}>
            {t('aiInterviewTemplates.noTemplates', 'Henüz şablon oluşturulmadı')}
          </h3>
          <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 20 }}>
            {t('aiInterviewTemplates.createFirst', 'AI görüşme davetleri için ilk şablonunuzu oluşturun')}
          </p>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={18} />
            {t('aiInterviewTemplates.newTemplate', 'Yeni Şablon')}
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
                background: template.isActive ? '#DBEAFE' : '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Sparkles size={24} color={template.isActive ? '#3B82F6' : '#9CA3AF'} />
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

              {/* Status */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: template.isActive ? '#D1FAE5' : '#FEE2E2',
                borderRadius: 20,
              }}>
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
              </div>

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
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', marginBottom: 12 }}>
              {t('aiInterviewTemplates.deleteConfirm', 'Şablonu Sil')}
            </h3>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
              "{deleteConfirm.name}" {t('aiInterviewTemplates.deleteMessage', 'şablonunu silmek istediğinize emin misiniz?')}
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
        <AddEditAIInterviewTemplateModal
          isOpen={showModal}
          onClose={handleModalClose}
          template={editingTemplate}
          variables={variables}
        />
      )}
    </div>
  );
};

export default AIInterviewTemplatesPage;
