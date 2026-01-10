/**
 * Agreement Templates Page - Card Layout
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@apollo/client/react';
import { Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight, FileText, Clock, User, HelpCircle, XCircle, Eye } from 'lucide-react';
import { AGREEMENT_TEMPLATES_QUERY, DELETE_AGREEMENT_TEMPLATE, TOGGLE_AGREEMENT_TEMPLATE } from '../graphql/agreementTemplates';
import AddEditTemplateModal from './AddEditTemplateModal';

const AgreementTemplatesPage = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data, loading, error, refetch } = useQuery(AGREEMENT_TEMPLATES_QUERY, { fetchPolicy: 'network-only' });
  const [deleteTemplate, { loading: deleting }] = useMutation(DELETE_AGREEMENT_TEMPLATE);
  const [toggleTemplate, { loading: toggling }] = useMutation(TOGGLE_AGREEMENT_TEMPLATE);

  const templates = data?.agreementTemplates || [];
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

  const stripHtml = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return div.textContent || div.innerText || '';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="loading-spinner" /></div>;
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: '#DC2626' }}><XCircle size={48} /><p>{t('common.error')}</p></div>;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>{t('agreementTemplates.title')}</h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0' }}>{t('agreementTemplates.subtitle')}</p>
        </div>
        <button onClick={() => { setEditingTemplate(null); setShowModal(true); }} style={{ 
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
          <Plus size={18} />{t('agreementTemplates.addNew')}
        </button>
      </div>

      <div style={{ marginBottom: '24px', position: 'relative', maxWidth: '400px' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('agreementTemplates.searchPlaceholder')} className="text-input" style={{ paddingLeft: '40px', width: '100%' }} />
      </div>

      {filteredTemplates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: '#F9FAFB', borderRadius: '12px', border: '2px dashed #E5E7EB' }}>
          <HelpCircle size={48} style={{ color: '#9CA3AF', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0 0 8px' }}>{t('agreementTemplates.empty')}</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {filteredTemplates.map(template => (
            <div key={template.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
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
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={12} />İçerik Önizleme</div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {stripHtml(template.content).substring(0, 150)}...
                  </p>
                </div>
                {template.creatorName && (
                  <div style={{ fontSize: '12px', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} />Oluşturan: {template.creatorName}</div>
                )}
              </div>
              <div style={{ padding: '12px 20px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button onClick={() => handleToggle(template.id)} disabled={toggling} style={{ padding: '8px 12px', border: 'none', borderRadius: '8px', background: '#F3F4F6', color: '#374151', cursor: 'pointer' }}>
                  {template.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                </button>
                <button onClick={() => { setEditingTemplate(template); setShowModal(true); }} style={{ padding: '8px 12px', border: 'none', borderRadius: '8px', background: '#D1FAE5', color: '#059669', cursor: 'pointer' }}>
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

      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600' }}>Şablonu Sil</h3>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6B7280' }}><strong>"{deleteConfirm.name}"</strong> şablonunu silmek istediğinize emin misiniz?</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-secondary">{t('common.cancel')}</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} disabled={deleting} style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', background: '#DC2626', color: 'white', fontWeight: '500', cursor: 'pointer' }}>{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}

      {showModal && <AddEditTemplateModal isOpen={showModal} onClose={() => { setShowModal(false); setEditingTemplate(null); }} onSuccess={() => { refetch(); setShowModal(false); setEditingTemplate(null); }} template={editingTemplate} />}
    </div>
  );
};

export default AgreementTemplatesPage;



