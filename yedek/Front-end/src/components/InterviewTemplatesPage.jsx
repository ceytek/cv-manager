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
  Globe
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
        <button onClick={handleAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#F9FAFB', borderRadius: '12px', border: '2px dashed #E5E7EB' }}>
          <HelpCircle size={48} style={{ color: '#9CA3AF', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0 0 8px' }}>
            {searchTerm ? t('interviewTemplates.noSearchResults') : t('interviewTemplates.noTemplates')}
          </h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {filteredTemplates.map(template => (
            <div key={template.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              {/* Card Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <Video size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>{template.name}</h3>
                  {template.description && (
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {template.description}
                    </p>
                  )}
                </div>
                <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', background: template.isActive ? '#D1FAE5' : '#FEE2E2', color: template.isActive ? '#059669' : '#DC2626' }}>
                  {template.isActive ? t('common.active') : t('common.inactive')}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '10px', background: '#F9FAFB', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>{t('interviewTemplates.questionCount')}</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>{template.questionCount} {t('interviewTemplates.questions')}</div>
                  </div>
                  <div style={{ padding: '10px', background: '#F9FAFB', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                      <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                      {template.useGlobalTimer ? t('interviewTemplates.totalDuration') : t('interviewTemplates.durationPerQuestion')}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      {template.useGlobalTimer 
                        ? formatDuration(template.totalDuration || 0)
                        : formatDuration(template.durationPerQuestion)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#EFF6FF', borderRadius: '8px', fontSize: '13px', color: '#1D4ED8' }}>
                  <Globe size={14} />
                  {template.language === 'en' ? '🇬🇧 English' : '🇹🇷 Türkçe'}
                </div>
              </div>

              {/* Card Actions */}
              <div style={{ padding: '12px 20px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button onClick={() => handleToggle(template.id)} disabled={toggling} style={{ padding: '8px 12px', border: 'none', borderRadius: '8px', background: '#F3F4F6', color: '#374151', cursor: 'pointer' }}>
                  {template.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                </button>
                <button onClick={() => handleEdit(template)} style={{ padding: '8px 12px', border: 'none', borderRadius: '8px', background: '#EFF6FF', color: '#3B82F6', cursor: 'pointer' }}>
                  <Edit2 size={16} />
                </button>
                <button onClick={() => setDeleteConfirm(template)} disabled={deleting} style={{ padding: '8px 12px', border: 'none', borderRadius: '8px', background: '#FEE2E2', color: '#DC2626', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <AddEditInterviewTemplateModal
          isOpen={showModal}
          onClose={() => { setShowModal(false); setEditingTemplate(null); }}
          onSuccess={() => { refetch(); setShowModal(false); setEditingTemplate(null); }}
          template={editingTemplate}
        />
      )}

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

