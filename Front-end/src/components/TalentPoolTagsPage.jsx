/**
 * Talent Pool Tags Management Page
 * Allows admins to view, create, edit, and delete custom tags for the talent pool
 */
import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Tag, 
  XCircle, 
  Lock,
  Users,
  Check,
  X
} from 'lucide-react';
import { 
  GET_TALENT_POOL_TAGS, 
  CREATE_TALENT_POOL_TAG, 
  UPDATE_TALENT_POOL_TAG, 
  DELETE_TALENT_POOL_TAG 
} from '../graphql/talentPool';

// Predefined color palette for tags
const TAG_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#22C55E', // Green
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#0EA5E9', // Sky
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#D946EF', // Fuchsia
  '#EC4899', // Pink
];

const TalentPoolTagsPage = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Form state
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#6366F1');
  const [formError, setFormError] = useState('');

  // Helper function to get translated tag name for system tags
  const getTagDisplayName = (tag) => {
    if (tag.isSystem) {
      return t(`talentPool.systemTagNames.${tag.name}`, tag.name);
    }
    return tag.name;
  };

  const { data, loading, error, refetch } = useQuery(GET_TALENT_POOL_TAGS, { 
    fetchPolicy: 'network-only' 
  });
  
  const [createTag, { loading: creating }] = useMutation(CREATE_TALENT_POOL_TAG);
  const [updateTag, { loading: updating }] = useMutation(UPDATE_TALENT_POOL_TAG);
  const [deleteTag, { loading: deleting }] = useMutation(DELETE_TALENT_POOL_TAG);

  const tags = data?.talentPoolTags || [];
  const systemTags = tags.filter(t => t.isSystem);
  const customTags = tags.filter(t => !t.isSystem);
  
  const filteredSystemTags = systemTags.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredCustomTags = customTags.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingTag(null);
    setTagName('');
    setTagColor('#6366F1');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (tag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color);
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!tagName.trim()) {
      setFormError(t('talentPool.tagNameRequired'));
      return;
    }

    try {
      if (editingTag) {
        const result = await updateTag({
          variables: {
            id: editingTag.id,
            input: { name: tagName.trim(), color: tagColor }
          }
        });
        if (!result.data.updateTalentPoolTag.success) {
          setFormError(result.data.updateTalentPoolTag.message);
          return;
        }
      } else {
        const result = await createTag({
          variables: {
            input: { name: tagName.trim(), color: tagColor }
          }
        });
        if (!result.data.createTalentPoolTag.success) {
          setFormError(result.data.createTalentPoolTag.message);
          return;
        }
      }
      
      refetch();
      setShowModal(false);
    } catch (err) {
      console.error('Save error:', err);
      setFormError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTag({ variables: { id } });
      refetch();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#DC2626' }}>
        <XCircle size={48} />
        <p>{t('common.error')}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
            {t('talentPool.tagsTitle')}
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0' }}>
            {t('talentPool.tagsSubtitle')}
          </p>
        </div>
        <button 
          onClick={openCreateModal} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            padding: '12px 20px',
            background: '#6366F1',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={18} />
          {t('talentPool.addTag')}
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px', position: 'relative', maxWidth: '400px' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
        <input 
          type="text" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          placeholder={t('talentPool.searchTags')} 
          className="text-input" 
          style={{ paddingLeft: '40px', width: '100%' }} 
        />
      </div>

      {/* System Tags Section */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#374151', 
          margin: '0 0 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <Lock size={16} color="#9CA3AF" />
          {t('talentPool.systemTags')}
          <span style={{ 
            fontSize: '12px', 
            fontWeight: '400', 
            color: '#9CA3AF',
            marginLeft: 4
          }}>
            ({filteredSystemTags.length})
          </span>
        </h2>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {filteredSystemTags.map(tag => (
            <div 
              key={tag.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: '#F9FAFB',
                borderRadius: 8,
                border: '1px solid #E5E7EB',
              }}
            >
              <div style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: tag.color,
              }} />
              <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>
                {getTagDisplayName(tag)}
              </span>
              <span style={{ 
                fontSize: '12px', 
                color: '#9CA3AF',
                display: 'flex',
                alignItems: 'center',
                gap: 4 
              }}>
                <Users size={12} />
                {tag.usageCount}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Tags Section */}
      <div>
        <h2 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#374151', 
          margin: '0 0 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <Tag size={16} color="#6366F1" />
          {t('talentPool.customTags')}
          <span style={{ 
            fontSize: '12px', 
            fontWeight: '400', 
            color: '#9CA3AF',
            marginLeft: 4
          }}>
            ({filteredCustomTags.length})
          </span>
        </h2>

        {filteredCustomTags.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            background: '#F9FAFB', 
            borderRadius: '12px', 
            border: '2px dashed #E5E7EB' 
          }}>
            <Tag size={40} style={{ color: '#D1D5DB', marginBottom: '12px' }} />
            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
              {t('talentPool.noCustomTags')}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filteredCustomTags.map(tag => (
              <div 
                key={tag.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: tag.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Tag size={18} color="white" />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                      {tag.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Users size={12} />
                      {tag.usageCount} {t('talentPool.candidates')}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={() => openEditModal(tag)}
                    style={{
                      padding: '8px',
                      border: 'none',
                      borderRadius: 8,
                      background: '#EEF2FF',
                      color: '#6366F1',
                      cursor: 'pointer',
                    }}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => setDeleteConfirm(tag)}
                    disabled={deleting}
                    style={{
                      padding: '8px',
                      border: 'none',
                      borderRadius: 8,
                      background: '#FEE2E2',
                      color: '#DC2626',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000 
        }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            padding: '24px', 
            maxWidth: '440px', 
            width: '90%' 
          }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600' }}>
              {editingTag ? t('talentPool.editTag') : t('talentPool.createTag')}
            </h3>
            
            {/* Tag Name Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: 6 }}>
                {t('talentPool.tagName')}
              </label>
              <input
                type="text"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder={t('talentPool.tagNamePlaceholder')}
                className="text-input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Color Picker */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: 10 }}>
                {t('talentPool.tagColor')}
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {TAG_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setTagColor(color)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: color,
                      border: tagColor === color ? '3px solid #111827' : '2px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {tagColor === color && <Check size={16} color="white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div style={{ marginBottom: '20px', padding: '16px', background: '#F9FAFB', borderRadius: 8 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6B7280', marginBottom: 8 }}>
                {t('talentPool.preview')}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: tagColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Tag size={16} color="white" />
                </div>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>
                  {tagName || t('talentPool.tagNamePlaceholder')}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {formError && (
              <div style={{ 
                padding: '12px', 
                background: '#FEE2E2', 
                borderRadius: 8, 
                color: '#DC2626', 
                fontSize: '14px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <XCircle size={16} />
                {formError}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowModal(false)} 
                className="btn btn-secondary"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={handleSave}
                disabled={creating || updating}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: 8,
                  background: '#6366F1',
                  color: 'white',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {(creating || updating) ? (
                  <div className="loading-spinner" style={{ width: 16, height: 16 }} />
                ) : (
                  <Check size={16} />
                )}
                {t('common.save')}
              </button>
            </div>
          </div>
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
          zIndex: 1000 
        }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            padding: '24px', 
            maxWidth: '400px', 
            width: '90%' 
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600' }}>
              {t('talentPool.deleteTagTitle')}
            </h3>
            <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#6B7280' }}>
              <strong style={{ color: deleteConfirm.color }}>"{deleteConfirm.name}"</strong> {t('talentPool.deleteTagMessage')}
            </p>
            {deleteConfirm.usageCount > 0 && (
              <p style={{ 
                margin: '0 0 24px', 
                fontSize: '13px', 
                color: '#F59E0B',
                background: '#FFFBEB',
                padding: '10px 12px',
                borderRadius: 8
              }}>
                ⚠️ {t('talentPool.deleteTagWarning', { count: deleteConfirm.usageCount })}
              </p>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setDeleteConfirm(null)} 
                className="btn btn-secondary"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={() => handleDelete(deleteConfirm.id)} 
                disabled={deleting}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: 8,
                  background: '#DC2626',
                  color: 'white',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TalentPoolTagsPage;
