/**
 * Interview Templates Page
 * Lists all Interview test templates with CRUD operations
 */
import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  Video,
  HelpCircle,
  XCircle,
  Clock,
  Globe,
  Sparkles,
  Eye
} from 'lucide-react';
import { 
  GET_INTERVIEW_TEMPLATES, 
  DELETE_INTERVIEW_TEMPLATE, 
  TOGGLE_INTERVIEW_TEMPLATE 
} from '../graphql/interviewTemplates';
import AddEditInterviewTemplateModal from './AddEditInterviewTemplateModal';

const InterviewTemplatesPage = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data, loading, error, refetch } = useQuery(GET_INTERVIEW_TEMPLATES, {
    fetchPolicy: 'network-only',
  });

  const [deleteTemplate, { loading: deleting }] = useMutation(DELETE_INTERVIEW_TEMPLATE);
  const [toggleTemplate, { loading: toggling }] = useMutation(TOGGLE_INTERVIEW_TEMPLATE);

  const templates = data?.interviewTemplates || [];

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAdd = () => {
    setEditingTemplate(null);
    setShowModal(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      const result = await deleteTemplate({ variables: { id } });
      if (result.data?.deleteInterviewTemplate?.success) {
        refetch();
        setDeleteConfirm(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleTemplate({ variables: { id } });
      refetch();
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const formatDuration = (seconds) => {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      return `${mins} dk`;
    }
    return `${seconds} sn`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error) {
    console.error('InterviewTemplatesPage error:', error);
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#DC2626' }}>
        <XCircle size={48} style={{ marginBottom: 16 }} />
        <p>{t('common.error')}</p>
        <p style={{ fontSize: 12, marginTop: 8, color: '#9CA3AF' }}>{error.message}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
            {t('interviewTemplates.title')}
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0' }}>
            {t('interviewTemplates.subtitle')}
          </p>
        </div>
        <button onClick={handleAdd} style={{ 
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
        }}>
          <Plus size={18} />
          {t('interviewTemplates.addTemplate')}
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px', position: 'relative', maxWidth: '400px' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('interviewTemplates.searchPlaceholder')}
          className="text-input"
          style={{ paddingLeft: '40px', width: '100%' }}
        />
      </div>

      {/* Templates List */}
      {filteredTemplates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#F9FAFB', borderRadius: '12px', border: '2px dashed #E5E7EB' }}>
          <HelpCircle size={48} style={{ color: '#9CA3AF', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0 0 8px' }}>
            {searchTerm ? t('interviewTemplates.noSearchResults') : t('interviewTemplates.noTemplates')}
          </h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredTemplates.map(template => (
            <div 
              key={template.id} 
              style={{ 
                background: 'white', 
                borderRadius: '16px', 
                border: '1px solid #E5E7EB', 
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                transition: 'all 0.2s',
              }}
            >
              {/* Icon */}
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: template.isAiGenerated 
                  ? 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)' 
                  : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {template.isAiGenerated ? (
                  <Sparkles size={24} color="white" />
                ) : (
                  <Video size={24} color="white" />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                    {template.name}
                  </h3>
                  {template.isAiGenerated && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      background: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
                      color: '#7C3AED',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                    }}>
                      <Sparkles size={11} />
                      AI
                    </span>
                  )}
                </div>
                <p style={{ 
                  margin: 0, 
                  fontSize: '13px', 
                  color: '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <HelpCircle size={13} />
                    {template.questionCount} {t('interviewTemplates.questions')}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} />
                    {template.useGlobalTimer 
                      ? formatDuration(template.totalDuration || 0)
                      : formatDuration(template.durationPerQuestion)}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Globe size={13} />
                    {template.language === 'en' ? 'English' : 'Türkçe'}
                  </span>
                </p>
              </div>

              {/* Status Badge */}
              <button
                onClick={() => handleToggle(template.id)}
                disabled={toggling}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: template.isActive ? '#D1FAE5' : '#FEE2E2',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                title={template.isActive ? t('common.clickToDeactivate') : t('common.clickToActivate')}
              >
                <Eye size={14} color={template.isActive ? '#059669' : '#DC2626'} />
                <span style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: template.isActive ? '#059669' : '#DC2626',
                }}>
                  {template.isActive ? t('common.active') : t('common.inactive')}
                </span>
              </button>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleEdit(template)}
                  style={{
                    padding: '10px',
                    background: '#EEF2FF',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={t('common.edit')}
                >
                  <Edit2 size={18} color="#6366F1" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(template)}
                  disabled={deleting}
                  style={{
                    padding: '10px',
                    background: '#FEE2E2',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={t('common.delete')}
                >
                  <Trash2 size={18} color="#DC2626" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal - Always rendered, modal handles its own visibility via isOpen */}
      <AddEditInterviewTemplateModal
        key={editingTemplate?.id || 'new'}
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingTemplate(null); }}
        onSuccess={() => { refetch(); setShowModal(false); setEditingTemplate(null); }}
        template={editingTemplate}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600' }}>{t('interviewTemplates.deleteConfirmTitle')}</h3>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6B7280' }}>
              <strong>"{deleteConfirm.name}"</strong> {t('interviewTemplates.deleteConfirmMessage')}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-secondary">{t('common.cancel')}</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} disabled={deleting} style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', background: '#DC2626', color: 'white', fontWeight: '500', cursor: 'pointer' }}>
                {deleting ? t('common.deleting') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewTemplatesPage;

