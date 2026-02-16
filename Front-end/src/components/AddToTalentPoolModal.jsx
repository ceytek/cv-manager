/**
 * AddToTalentPoolModal Component
 * Modal for adding candidates to the talent pool with tag selection
 */
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  Tag, 
  Users, 
  FileText, 
  Check, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { 
  GET_TALENT_POOL_TAGS, 
  ADD_TO_TALENT_POOL, 
  BULK_ADD_TO_TALENT_POOL 
} from '../graphql/talentPool';

const AddToTalentPoolModal = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  candidates = [],  // Array of candidate objects or IDs
  sourceJobId = null,
  sourceJobTitle = null,
}) => {
  const { t } = useTranslation();
  const [selectedTags, setSelectedTags] = useState([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Fetch available tags
  const { data: tagsData, loading: tagsLoading } = useQuery(GET_TALENT_POOL_TAGS, {
    skip: !isOpen,
  });

  // Mutations
  const [addSingle, { loading: addingSingle }] = useMutation(ADD_TO_TALENT_POOL);
  const [addBulk, { loading: addingBulk }] = useMutation(BULK_ADD_TO_TALENT_POOL);

  const tags = tagsData?.talentPoolTags || [];
  const isBulk = candidates.length > 1;
  const isAdding = addingSingle || addingBulk;

  // Helper to get translated tag name for system tags
  const getTagName = (tag) => {
    if (tag.isSystem) {
      return t(`talentPool.systemTagNames.${tag.name}`, tag.name);
    }
    return tag.name;
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedTags([]);
      setNotes('');
      setError('');
    }
  }, [isOpen]);

  const toggleTag = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    setError('');
    
    try {
      if (isBulk) {
        // Bulk add
        const candidateIds = candidates.map(c => typeof c === 'string' ? c : c.id);
        const result = await addBulk({
          variables: {
            input: {
              candidateIds,
              sourceJobId,
              notes: notes.trim() || null,
              tagIds: selectedTags,
            }
          }
        });

        if (result.data.bulkAddToTalentPool.success) {
          onSuccess?.(result.data.bulkAddToTalentPool);
          onClose();
        } else {
          setError(result.data.bulkAddToTalentPool.message);
        }
      } else {
        // Single add
        const candidateId = typeof candidates[0] === 'string' ? candidates[0] : candidates[0].id;
        const result = await addSingle({
          variables: {
            input: {
              candidateId,
              sourceJobId,
              notes: notes.trim() || null,
              tagIds: selectedTags,
            }
          }
        });

        if (result.data.addToTalentPool.success) {
          onSuccess?.(result.data.addToTalentPool);
          onClose();
        } else {
          setError(result.data.addToTalentPool.message);
        }
      }
    } catch (err) {
      console.error('Add to talent pool error:', err);
      setError(err.message);
    }
  };

  // Early return - modal kapalıysa render etme
  if (!isOpen) return null;

  // Get candidate info for display
  const getCandidateDisplay = () => {
    if (isBulk) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px',
          background: '#F0FDF4',
          borderRadius: 12,
          marginBottom: 20,
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#111827', fontSize: 15 }}>
              {t('talentPool.selectedCandidates', { count: candidates.length })}
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
              {t('talentPool.bulkAddDescription')}
            </div>
          </div>
        </div>
      );
    }

    const candidate = candidates[0];
    const name = typeof candidate === 'string' ? t('talentPool.candidate') : candidate.name;
    const email = typeof candidate !== 'string' ? candidate.email : null;

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '16px',
        background: '#F9FAFB',
        borderRadius: 12,
        marginBottom: 20,
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 700,
          fontSize: 18,
        }}>
          {name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: '#111827', fontSize: 15 }}>
            {name || t('talentPool.unnamed')}
          </div>
          {email && (
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
              {email}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
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
        width: '90%',
        maxWidth: 520,
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#111827' }}>
                {t('talentPool.addToPool')}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6B7280' }}>
                {t('talentPool.addToPoolDescription')}
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
              color: '#6B7280',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Candidate Info */}
          {getCandidateDisplay()}

          {/* Source Job Info */}
          {sourceJobTitle && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              background: '#EEF2FF',
              borderRadius: 8,
              marginBottom: 20,
              fontSize: 13,
              color: '#4338CA',
            }}>
              <FileText size={16} />
              <span>{t('talentPool.fromJob')}:</span>
              <strong>{sourceJobTitle}</strong>
            </div>
          )}

          {/* Tags Selection */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
              marginBottom: 12,
            }}>
              <Tag size={16} />
              {t('talentPool.selectTags')}
              <span style={{ fontWeight: 400, color: '#9CA3AF' }}>({t('common.optional')})</span>
            </label>

            {tagsLoading ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#9CA3AF' }}>
                {t('common.loading')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {tags.map(tag => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 14px',
                        borderRadius: 20,
                        border: isSelected ? `2px solid ${tag.color}` : '2px solid #E5E7EB',
                        background: isSelected ? `${tag.color}15` : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: tag.color,
                      }} />
                      <span style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: isSelected ? tag.color : '#4B5563',
                      }}>
                        {getTagName(tag)}
                      </span>
                      {isSelected && (
                        <Check size={14} color={tag.color} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
              marginBottom: 8,
            }}>
              {t('talentPool.notes')}
              <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 6 }}>({t('common.optional')})</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('talentPool.notesPlaceholder')}
              rows={3}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #E5E7EB',
                fontSize: 14,
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 14px',
              background: '#FEE2E2',
              borderRadius: 8,
              marginTop: 16,
              color: '#DC2626',
              fontSize: 14,
            }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
        }}>
          <button
            onClick={onClose}
            disabled={isAdding}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              background: 'white',
              color: '#374151',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isAdding}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 24px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              color: 'white',
              fontWeight: 600,
              cursor: isAdding ? 'wait' : 'pointer',
              opacity: isAdding ? 0.7 : 1,
            }}
          >
            {isAdding ? (
              <>
                <div className="loading-spinner" style={{ width: 16, height: 16 }} />
                {t('common.saving')}
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {t('talentPool.addToPoolButton')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// React.memo ile gereksiz re-render'ları önle
export default React.memo(AddToTalentPoolModal);
