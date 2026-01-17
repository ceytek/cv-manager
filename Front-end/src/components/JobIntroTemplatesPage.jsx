/**
 * Job Intro Templates Page - İlan Ön Yazı Şablonları
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@apollo/client/react';
import { Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight, FileText, Clock, User, HelpCircle, XCircle, Eye, X } from 'lucide-react';
import { 
  JOB_INTRO_TEMPLATES_QUERY, 
  CREATE_JOB_INTRO_TEMPLATE, 
  UPDATE_JOB_INTRO_TEMPLATE, 
  DELETE_JOB_INTRO_TEMPLATE, 
  TOGGLE_JOB_INTRO_TEMPLATE 
} from '../graphql/jobIntroTemplates';

const JobIntroTemplatesPage = () => {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  const { data, loading, error, refetch } = useQuery(JOB_INTRO_TEMPLATES_QUERY, { fetchPolicy: 'network-only' });
  const [createTemplate, { loading: creating }] = useMutation(CREATE_JOB_INTRO_TEMPLATE);
  const [updateTemplate, { loading: updating }] = useMutation(UPDATE_JOB_INTRO_TEMPLATE);
  const [deleteTemplate, { loading: deleting }] = useMutation(DELETE_JOB_INTRO_TEMPLATE);
  const [toggleTemplate, { loading: toggling }] = useMutation(TOGGLE_JOB_INTRO_TEMPLATE);

  const templates = data?.jobIntroTemplates || [];
  const filteredTemplates = templates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleDelete = async (id) => {
    try {
      await deleteTemplate({ variables: { id } });
      refetch();
      setDeleteConfirm(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleTemplate({ variables: { id } });
      refetch();
    } catch (err) {
      alert(err.message);
    }
  };

  const openModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormName(template.name);
      setFormContent(template.content);
      setFormIsActive(template.isActive);
    } else {
      setEditingTemplate(null);
      setFormName('');
      setFormContent('');
      setFormIsActive(true);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
    setFormName('');
    setFormContent('');
    setFormIsActive(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formContent.trim()) {
      alert(t('jobIntroTemplates.fillRequired'));
      return;
    }

    try {
      const input = {
        name: formName.trim(),
        content: formContent.trim(),
        isActive: formIsActive,
      };

      if (editingTemplate) {
        await updateTemplate({ variables: { id: editingTemplate.id, input } });
      } else {
        await createTemplate({ variables: { input } });
      }
      refetch();
      closeModal();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US');
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="loading-spinner" /></div>;
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: '#DC2626' }}><XCircle size={48} /><p>{t('common.error')}</p></div>;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>{t('jobIntroTemplates.title')}</h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0' }}>{t('jobIntroTemplates.subtitle')}</p>
        </div>
        <button onClick={() => openModal()} style={{ 
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
          <Plus size={18} />{t('jobIntroTemplates.addNew')}
        </button>
      </div>

      <div style={{ marginBottom: '24px', position: 'relative', maxWidth: '400px' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('jobIntroTemplates.searchPlaceholder')} className="text-input" style={{ paddingLeft: '40px', width: '100%' }} />
      </div>

      {filteredTemplates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: '#F9FAFB', borderRadius: '12px', border: '2px dashed #E5E7EB' }}>
          <HelpCircle size={48} style={{ color: '#9CA3AF', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0 0 8px' }}>{t('jobIntroTemplates.empty')}</h3>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>{t('jobIntroTemplates.emptyHint')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {filteredTemplates.map(template => (
            <div key={template.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <FileText size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>{template.name}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />{formatDate(template.updatedAt || template.createdAt)}
                  </p>
                </div>
                <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', background: template.isActive ? '#D1FAE5' : '#FEE2E2', color: template.isActive ? '#059669' : '#DC2626' }}>
                  {template.isActive ? t('common.active') : t('common.inactive')}
                </span>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ padding: '12px', background: '#F9FAFB', borderRadius: '8px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={12} />{t('jobIntroTemplates.preview')}</div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'pre-wrap' }}>
                    {template.content.substring(0, 200)}{template.content.length > 200 ? '...' : ''}
                  </p>
                </div>
                {template.creatorName && (
                  <div style={{ fontSize: '12px', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} />{t('jobIntroTemplates.createdBy')}: {template.creatorName}</div>
                )}
              </div>
              <div style={{ padding: '12px 20px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button onClick={() => handleToggle(template.id)} disabled={toggling} title={template.isActive ? t('common.clickToDeactivate') : t('common.clickToActivate')} style={{ padding: '8px 12px', border: 'none', borderRadius: '8px', background: template.isActive ? '#D1FAE5' : '#F3F4F6', color: template.isActive ? '#059669' : '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}>
                  {template.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  <span>{template.isActive ? t('common.on') : t('common.off')}</span>
                </button>
                <button onClick={() => openModal(template)} style={{ padding: '8px 12px', border: 'none', borderRadius: '8px', background: '#EEF2FF', color: '#4F46E5', cursor: 'pointer' }}>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600' }}>{t('jobIntroTemplates.deleteTitle')}</h3>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6B7280' }}><strong>"{deleteConfirm.name}"</strong> {t('jobIntroTemplates.deleteConfirm')}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-secondary">{t('common.cancel')}</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} disabled={deleting} style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', background: '#DC2626', color: 'white', fontWeight: '500', cursor: 'pointer' }}>{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                {editingTemplate ? t('jobIntroTemplates.edit') : t('jobIntroTemplates.addNew')}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  {t('jobIntroTemplates.name')} *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={t('jobIntroTemplates.namePlaceholder')}
                  className="text-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  {t('jobIntroTemplates.content')} *
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder={t('jobIntroTemplates.contentPlaceholder')}
                  className="text-input"
                  rows={8}
                  style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  {t('common.status')}:
                </label>
                <button
                  onClick={() => setFormIsActive(!formIsActive)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    background: formIsActive ? '#D1FAE5' : '#FEE2E2',
                    color: formIsActive ? '#059669' : '#DC2626',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  {formIsActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  {formIsActive ? t('common.active') : t('common.inactive')}
                </button>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} className="btn btn-secondary">{t('common.cancel')}</button>
              <button 
                onClick={handleSubmit} 
                disabled={creating || updating}
                className="btn btn-primary"
              >
                {creating || updating ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobIntroTemplatesPage;

