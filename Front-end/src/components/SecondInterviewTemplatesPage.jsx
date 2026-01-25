/**
 * Second Interview Templates Page
 * Manages email templates for second interview invitations
 * Supports two template types: Online and In-Person
 */
import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, Video, MapPin, ToggleLeft, ToggleRight, Star, GripVertical } from 'lucide-react';
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

      {/* Variables Info */}
      <div style={{
        background: '#F5F3FF',
        border: '1px solid #DDD6FE',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <GripVertical size={16} color="#7C3AED" />
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#5B21B6' }}>
            {t('secondInterviewTemplates.availableVariables', 'Kullanılabilir Değişkenler')}
          </h3>
          <span style={{ fontSize: 12, color: '#7C3AED', fontStyle: 'italic' }}>
            ({t('secondInterviewTemplates.dragDrop', 'Sürükle-bırak ile ekleyin')})
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {variables.map(v => (
            <span 
              key={v.key}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', `{${v.key}}`);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                background: 'white',
                border: '1px solid #C4B5FD',
                borderRadius: 6,
                fontSize: 13,
                color: '#6D28D9',
                cursor: 'grab',
                userSelect: 'none',
              }}
            >
              <code style={{ fontWeight: 600 }}>{`{${v.key}}`}</code>
              <span style={{ color: '#6B7280' }}>→ {isEnglish ? v.labelEn : v.labelTr}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 60,
          background: 'white',
          borderRadius: 12,
          border: '2px dashed #E5E7EB',
        }}>
          {activeTab === 'ONLINE' ? (
            <Video size={48} color="#D1D5DB" style={{ marginBottom: 16 }} />
          ) : (
            <MapPin size={48} color="#D1D5DB" style={{ marginBottom: 16 }} />
          )}
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            {t('secondInterviewTemplates.noTemplates', 'Henüz şablon yok')}
          </h3>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
            {activeTab === 'ONLINE' 
              ? t('secondInterviewTemplates.createOnlineFirst', 'Online görüşme için ilk şablonunuzu oluşturun')
              : t('secondInterviewTemplates.createInPersonFirst', 'Yüz yüze görüşme için ilk şablonunuzu oluşturun')
            }
          </p>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '10px 20px',
              background: '#8B5CF6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {t('secondInterviewTemplates.newTemplate', 'Yeni Şablon')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
          {templates.map((template) => (
            <div
              key={template.id}
              style={{
                background: 'white',
                borderRadius: 12,
                border: '1px solid #E5E7EB',
                overflow: 'hidden',
                transition: 'all 0.2s',
              }}
            >
              {/* Card Header */}
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: template.isActive ? '#F3E8FF' : '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {template.templateType === 'ONLINE' ? (
                      <Video size={20} color={template.isActive ? '#7C3AED' : '#9CA3AF'} />
                    ) : (
                      <MapPin size={20} color={template.isActive ? '#7C3AED' : '#9CA3AF'} />
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1F2937' }}>
                        {template.name}
                      </h3>
                      {template.isDefault && (
                        <Star size={14} color="#F59E0B" fill="#F59E0B" />
                      )}
                    </div>
                    <span style={{
                      fontSize: 11,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: template.language === 'TR' ? '#FEE2E2' : '#DBEAFE',
                      color: template.language === 'TR' ? '#991B1B' : '#1E40AF',
                    }}>
                      {template.language}
                    </span>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  {template.isActive ? (
                    <ToggleRight size={24} color="#10B981" />
                  ) : (
                    <ToggleLeft size={24} color="#9CA3AF" />
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '16px 20px' }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('secondInterviewTemplates.subject', 'Konu')}
                  </label>
                  <p style={{ fontSize: 14, color: '#374151', fontWeight: 500, marginTop: 4 }}>
                    {template.subject}
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('secondInterviewTemplates.contentPreview', 'İçerik Önizleme')}
                  </label>
                  <p style={{ 
                    fontSize: 13, 
                    color: '#6B7280', 
                    marginTop: 4,
                    lineHeight: 1.5,
                    maxHeight: 60,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {template.body.substring(0, 150)}...
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div style={{
                padding: '12px 20px',
                background: '#F9FAFB',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                  {template.createdAt ? new Date(template.createdAt).toLocaleDateString(isEnglish ? 'en-US' : 'tr-TR') : ''}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleEdit(template)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 12px',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: 6,
                      fontSize: 13,
                      color: '#374151',
                      cursor: 'pointer',
                    }}
                  >
                    <Edit2 size={14} />
                    {t('common.edit', 'Düzenle')}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(template.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 12px',
                      background: 'white',
                      border: '1px solid #FCA5A5',
                      borderRadius: 6,
                      fontSize: 13,
                      color: '#DC2626',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} />
                    {t('common.delete', 'Sil')}
                  </button>
                </div>
              </div>
            </div>
          ))}
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
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>
              {t('secondInterviewTemplates.deleteConfirmMessage', 'Bu şablonu silmek istediğinizden emin misiniz?')}
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
                  color: '#374151',
                  cursor: 'pointer',
                }}
              >
                {t('common.cancel', 'İptal')}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                style={{
                  padding: '10px 20px',
                  background: '#EF4444',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  color: 'white',
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
