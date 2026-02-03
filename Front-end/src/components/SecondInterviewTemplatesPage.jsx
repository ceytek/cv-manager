/**
 * Second Interview Templates Page
 * Manages email templates for second interview invitations
 * Supports two template types: Online and In-Person
 */
import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, Video, MapPin, ToggleLeft, ToggleRight, Star, Mail } from 'lucide-react';
import { 
  GET_SECOND_INTERVIEW_TEMPLATES,
  GET_SECOND_INTERVIEW_TEMPLATE_VARIABLES,
  DELETE_SECOND_INTERVIEW_TEMPLATE,
  SECOND_INTERVIEW_TEMPLATE_TYPES 
} from '../graphql/secondInterviewTemplate';
import AddEditSecondInterviewTemplateModal from './AddEditSecondInterviewTemplateModal';

const SecondInterviewTemplatesPage = () => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  const [activeTab, setActiveTab] = useState('ONLINE'); // 'ONLINE' or 'IN_PERSON'
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch templates filtered by type
  const { data, loading, error, refetch } = useQuery(GET_SECOND_INTERVIEW_TEMPLATES, {
    variables: { templateType: activeTab },
    fetchPolicy: 'network-only',
  });

  // Fetch available variables
  const { data: variablesData } = useQuery(GET_SECOND_INTERVIEW_TEMPLATE_VARIABLES);

  const [deleteTemplate] = useMutation(DELETE_SECOND_INTERVIEW_TEMPLATE, {
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

  // Get variables based on active tab
  const getVariables = () => {
    if (!variablesData?.secondInterviewTemplateVariables) return [];
    
    if (activeTab === 'ONLINE') {
      return variablesData.secondInterviewTemplateVariables.onlineVariables || [];
    }
    return variablesData.secondInterviewTemplateVariables.inPersonVariables || [];
  };

  const variables = getVariables();

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

  const templates = data?.secondInterviewTemplates || [];

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
            {t('secondInterviewTemplates.title', '2. Mülakat Şablonları')}
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280' }}>
            {t('secondInterviewTemplates.subtitle', 'Aday davet mesajlarını yönetin')}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 20px',
            background: '#8B5CF6',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={18} />
          {t('secondInterviewTemplates.newTemplate', 'Yeni Şablon')}
        </button>
      </div>

      {/* Type Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        background: '#F3F4F6',
        padding: 4,
        borderRadius: 10,
        width: 'fit-content',
      }}>
        <button
          onClick={() => setActiveTab('ONLINE')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: activeTab === 'ONLINE' ? 'white' : 'transparent',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            color: activeTab === 'ONLINE' ? '#7C3AED' : '#6B7280',
            cursor: 'pointer',
            boxShadow: activeTab === 'ONLINE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          <Video size={18} />
          {t('secondInterviewTemplates.onlineType', 'Online Görüşme')}
        </button>
        <button
          onClick={() => setActiveTab('IN_PERSON')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: activeTab === 'IN_PERSON' ? 'white' : 'transparent',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            color: activeTab === 'IN_PERSON' ? '#7C3AED' : '#6B7280',
            cursor: 'pointer',
            boxShadow: activeTab === 'IN_PERSON' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          <MapPin size={18} />
          {t('secondInterviewTemplates.inPersonType', 'Yüz Yüze Görüşme')}
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
          {activeTab === 'ONLINE' ? (
            <Video size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />
          ) : (
            <MapPin size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />
          )}
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#6B7280', marginBottom: 8 }}>
            {t('secondInterviewTemplates.noTemplates', 'Henüz şablon yok')}
          </h3>
          <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 20 }}>
            {activeTab === 'ONLINE' 
              ? t('secondInterviewTemplates.createOnlineFirst', 'Online görüşme için ilk şablonunuzu oluşturun')
              : t('secondInterviewTemplates.createInPersonFirst', 'Yüz yüze görüşme için ilk şablonunuzu oluşturun')
            }
          </p>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: '#8B5CF6',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={18} />
            {t('secondInterviewTemplates.newTemplate', 'Yeni Şablon')}
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
                background: template.isActive ? '#F3E8FF' : '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {template.templateType === 'ONLINE' ? (
                  <Video size={24} color={template.isActive ? '#7C3AED' : '#9CA3AF'} />
                ) : (
                  <MapPin size={24} color={template.isActive ? '#7C3AED' : '#9CA3AF'} />
                )}
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
                    background: '#F3E8FF',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={t('common.edit', 'Düzenle')}
                >
                  <Edit2 size={16} color="#7C3AED" />
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
              {t('secondInterviewTemplates.deleteConfirmTitle', 'Şablonu Sil')}
            </h3>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
              "{deleteConfirm.name}" {t('secondInterviewTemplates.deleteConfirmMessage', 'şablonunu silmek istediğinize emin misiniz?')}
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
        <AddEditSecondInterviewTemplateModal
          key={`modal-${editingTemplate?.id || 'new'}`}
          template={editingTemplate}
          defaultType={activeTab}
          variables={variables}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default SecondInterviewTemplatesPage;
