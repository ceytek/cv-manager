/**
 * Rejection Templates Page
 * Manages email templates for candidate rejection messages
 */
import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, Mail, ToggleLeft, ToggleRight, Star, Copy } from 'lucide-react';
import { 
  GET_REJECTION_TEMPLATES, 
  DELETE_REJECTION_TEMPLATE 
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
          {t('rejectionTemplates.newTemplate')}
        </button>
      </div>

      {/* Variables Info */}
      <div style={{
        background: '#F0F9FF',
        border: '1px solid #BAE6FD',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0369A1', marginBottom: 8 }}>
          📝 {t('rejectionTemplates.availableVariables')}
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {variables.map(v => (
            <span 
              key={v.key}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                background: 'white',
                border: '1px solid #7DD3FC',
                borderRadius: 6,
                fontSize: 13,
                color: '#0284C7',
              }}
            >
              <code style={{ fontWeight: 600 }}>{`{${v.key}}`}</code>
              <span style={{ color: '#6B7280' }}>→ {v.label}</span>
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
          <Mail size={48} color="#D1D5DB" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            {t('rejectionTemplates.noTemplates')}
          </h3>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
            {t('rejectionTemplates.createFirst')}
          </p>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '10px 20px',
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {t('rejectionTemplates.newTemplate')}
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
                    background: template.isActive ? '#DBEAFE' : '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Mail size={20} color={template.isActive ? '#2563EB' : '#9CA3AF'} />
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
                    {t('rejectionTemplates.subject')}
                  </label>
                  <p style={{ fontSize: 14, color: '#374151', fontWeight: 500, marginTop: 4 }}>
                    {template.subject}
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('rejectionTemplates.contentPreview')}
                  </label>
                  <p style={{ 
                    fontSize: 13, 
                    color: '#6B7280', 
                    marginTop: 4,
                    lineHeight: 1.5,
                    maxHeight: 60,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
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
                    {t('rejectionTemplates.edit')}
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
                    {t('rejectionTemplates.delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
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
            borderRadius: 12,
            padding: 24,
            maxWidth: 400,
            width: '90%',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', marginBottom: 12 }}>
              {t('rejectionTemplates.deleteConfirmTitle')}
            </h3>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
              {t('rejectionTemplates.deleteConfirmMessage')}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '10px 16px',
                  background: '#F3F4F6',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {t('rejectionTemplates.cancel')}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                style={{
                  padding: '10px 16px',
                  background: '#DC2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t('rejectionTemplates.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <AddEditRejectionTemplateModal
          template={editingTemplate}
          onClose={handleModalClose}
          variables={variables}
        />
      )}
    </div>
  );
};

export default RejectionTemplatesPage;
