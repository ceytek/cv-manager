/**
 * EditTalentPoolEntryModal Component
 * Modal for viewing/editing existing talent pool entries
 */
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { X, Sparkles, Tag, FileText, Trash2, Save, AlertTriangle, Calendar, User, Briefcase } from 'lucide-react';
import { 
  GET_TALENT_POOL_ENTRY, 
  GET_TALENT_POOL_TAGS, 
  UPDATE_TALENT_POOL_ENTRY, 
  REMOVE_FROM_TALENT_POOL 
} from '../graphql/talentPool';

const EditTalentPoolEntryModal = ({ isOpen, onClose, onSuccess, entryId, candidateName }) => {
  const { t } = useTranslation();
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  // Helper to get translated tag name for system tags
  const getTagName = (tag) => {
    if (tag.isSystem) {
      return t(`talentPool.systemTagNames.${tag.name}`, tag.name);
    }
    return tag.name;
  };

  // Fetch entry details
  const { data: entryData, loading: entryLoading } = useQuery(GET_TALENT_POOL_ENTRY, {
    variables: { id: entryId },
    skip: !isOpen || !entryId,
    fetchPolicy: 'network-only',
  });

  // Fetch available tags
  const { data: tagsData } = useQuery(GET_TALENT_POOL_TAGS, {
    skip: !isOpen,
  });

  // Update mutation
  const [updateEntry, { loading: updating }] = useMutation(UPDATE_TALENT_POOL_ENTRY, {
    onCompleted: (data) => {
      if (data.updateTalentPoolEntry.success) {
        onSuccess?.();
        onClose();
      }
    },
  });

  // Remove mutation
  const [removeFromPool, { loading: removing }] = useMutation(REMOVE_FROM_TALENT_POOL, {
    onCompleted: (data) => {
      if (data.removeFromTalentPool.success) {
        onSuccess?.('removed');
        onClose();
      }
    },
  });

  // Populate form when entry data loads
  useEffect(() => {
    if (entryData?.talentPoolEntry) {
      const entry = entryData.talentPoolEntry;
      setNotes(entry.notes || '');
      setSelectedTags(entry.tags?.map(tag => tag.id) || []);
    }
  }, [entryData]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setNotes('');
      setSelectedTags([]);
      setShowRemoveConfirm(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    // If no tags selected, show confirmation to remove from pool
    if (selectedTags.length === 0) {
      setShowRemoveConfirm(true);
      return;
    }
    updateEntry({
      variables: {
        id: entryId,
        input: {
          notes: notes.trim() || '',
          tagIds: selectedTags,
        },
      },
    });
  };

  const handleRemove = () => {
    removeFromPool({
      variables: { id: entryId },
    });
  };

  const toggleTag = (tagId) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];

    // If removing the last tag, show confirmation
    if (selectedTags.includes(tagId) && newTags.length === 0) {
      setShowRemoveConfirm(true);
      return;
    }

    setSelectedTags(newTags);
  };

  if (!isOpen) return null;

  const entry = entryData?.talentPoolEntry;
  const tags = tagsData?.talentPoolTags?.filter(t => t.isActive) || [];
  const systemTags = tags.filter(t => t.isSystem);
  const customTags = tags.filter(t => !t.isSystem);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: 20,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        width: '100%',
        maxWidth: 560,
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#6366F1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles size={22} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1F2937' }}>
                {t('talentPool.editEntry')}
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
                {candidateName || entry?.candidate?.name || t('talentPool.candidate')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} color="#6B7280" />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {entryLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
              {t('common.loading')}...
            </div>
          ) : entry ? (
            <>
              {/* Entry Info */}
              <div style={{
                background: '#F9FAFB',
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={16} color="#6B7280" />
                    <div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{t('talentPool.addedAt')}</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{formatDate(entry.addedAt)}</div>
                    </div>
                  </div>
                  {entry.addedBy && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <User size={16} color="#6B7280" />
                      <div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{t('talentPool.addedBy')}</div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{entry.addedBy.name}</div>
                      </div>
                    </div>
                  )}
                  {entry.sourceJob && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, gridColumn: 'span 2' }}>
                      <Briefcase size={16} color="#6B7280" />
                      <div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{t('talentPool.sourceJob')}</div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{entry.sourceJob.title}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags Section */}
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: 12,
                }}>
                  <Tag size={16} />
                  {t('talentPool.tags')}
                </label>

                {/* System Tags */}
                {systemTags.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
                      {t('talentPool.systemTags')}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {systemTags.map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 20,
                            border: selectedTags.includes(tag.id) ? '2px solid' : '1px solid #E5E7EB',
                            borderColor: selectedTags.includes(tag.id) ? tag.color : '#E5E7EB',
                            background: selectedTags.includes(tag.id) ? `${tag.color}15` : 'white',
                            color: selectedTags.includes(tag.id) ? tag.color : '#6B7280',
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <span style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: tag.color,
                          }} />
                          {getTagName(tag)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Tags */}
                {customTags.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
                      {t('talentPool.customTags')}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {customTags.map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 20,
                            border: selectedTags.includes(tag.id) ? '2px solid' : '1px solid #E5E7EB',
                            borderColor: selectedTags.includes(tag.id) ? tag.color : '#E5E7EB',
                            background: selectedTags.includes(tag.id) ? `${tag.color}15` : 'white',
                            color: selectedTags.includes(tag.id) ? tag.color : '#6B7280',
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <span style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: tag.color,
                          }} />
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {tags.length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 20, 
                    background: '#F9FAFB', 
                    borderRadius: 8,
                    color: '#9CA3AF',
                    fontSize: 13,
                  }}>
                    {t('talentPool.noTags')}
                  </div>
                )}
              </div>

              {/* Notes Section */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: 8,
                }}>
                  <FileText size={16} />
                  {t('talentPool.notes')}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('talentPool.notesPlaceholder')}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid #D1D5DB',
                    fontSize: 14,
                    resize: 'vertical',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#6366F1'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                />
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
              {t('talentPool.entryNotFound')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          background: '#F9FAFB',
        }}>
          {/* Remove Button */}
          <button
            onClick={() => setShowRemoveConfirm(true)}
            disabled={removing || updating || entryLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #FCA5A5',
              background: 'white',
              color: '#DC2626',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FEE2E2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            <Trash2 size={16} />
            {t('talentPool.removeFromPool')}
          </button>

          {/* Save & Cancel */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: '1px solid #D1D5DB',
                background: 'white',
                color: '#374151',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={updating || entryLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: '#6366F1',
                color: 'white',
                fontWeight: 600,
                cursor: updating ? 'wait' : 'pointer',
                opacity: updating ? 0.7 : 1,
              }}
            >
              <Save size={16} />
              {updating ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </div>

        {/* Remove Confirmation Dialog */}
        {showRemoveConfirm && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}>
            <div style={{
              background: 'white',
              borderRadius: 16,
              padding: 24,
              maxWidth: 400,
              width: '90%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#FEF3C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <AlertTriangle size={24} color="#D97706" />
                </div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1F2937' }}>
                  {t('talentPool.removeConfirmTitle')}
                </h3>
              </div>
              <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
                {selectedTags.length === 0
                  ? t('talentPool.removeAllTagsWarning', 'You are about to remove all tags from this person. They will be removed from the talent pool. Are you sure?')
                  : t('talentPool.removeConfirmMessage', { name: candidateName || entry?.candidate?.name })
                }
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowRemoveConfirm(false)}
                  disabled={removing}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: '1px solid #D1D5DB',
                    background: 'white',
                    color: '#374151',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleRemove}
                  disabled={removing}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#DC2626',
                    color: 'white',
                    fontWeight: 600,
                    cursor: removing ? 'wait' : 'pointer',
                    opacity: removing ? 0.7 : 1,
                  }}
                >
                  {removing ? t('common.deleting') : t('talentPool.removeFromPool')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditTalentPoolEntryModal;
