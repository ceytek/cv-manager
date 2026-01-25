/**
 * QuickCreateTagModal Component
 * A modal for quickly creating a talent pool tag from a keyword
 */
import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client/react';
import { X, Tag, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CREATE_TALENT_POOL_TAG, GET_TALENT_POOL_TAGS } from '../graphql/talentPool';

// Available colors for tags
const TAG_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899',
];

const QuickCreateTagModal = ({ isOpen, onClose, onSuccess, initialName = '' }) => {
  const { t } = useTranslation();
  const [tagName, setTagName] = useState(initialName);
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]);
  const [error, setError] = useState(null);

  // Reset form when modal opens with new initial name
  useEffect(() => {
    if (isOpen) {
      setTagName(initialName);
      setSelectedColor(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]);
      setError(null);
    }
  }, [isOpen, initialName]);

  const [createTag, { loading }] = useMutation(CREATE_TALENT_POOL_TAG, {
    refetchQueries: [{ query: GET_TALENT_POOL_TAGS }],
    onCompleted: (data) => {
      if (data?.createTalentPoolTag?.success) {
        onSuccess?.(data.createTalentPoolTag.tag);
        onClose();
      } else {
        setError(data?.createTalentPoolTag?.message || t('common.error'));
      }
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tagName.trim()) {
      setError(t('talentPool.tagNameRequired', 'Etiket adı gerekli'));
      return;
    }
    
    createTag({
      variables: {
        input: {
          name: tagName.trim(),
          color: selectedColor,
        },
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ 
          padding: '20px 24px', 
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', margin: 0 }}>
            {t('talentPool.createTag', 'Yeni Etiket Oluştur')}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} color="#6B7280" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          {/* Tag Name Input */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              display: 'block', 
              fontSize: 14, 
              fontWeight: 500, 
              color: '#374151', 
              marginBottom: 8 
            }}>
              {t('talentPool.tagName', 'Etiket Adı')}
            </label>
            <input
              type="text"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder={t('talentPool.tagNamePlaceholder', 'Örn: Liderlik Potansiyeli')}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #D1D5DB',
                borderRadius: 10,
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366F1'}
              onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
              autoFocus
            />
          </div>

          {/* Color Selection */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              display: 'block', 
              fontSize: 14, 
              fontWeight: 500, 
              color: '#374151', 
              marginBottom: 8 
            }}>
              {t('talentPool.tagColor', 'Etiket Rengi')}
            </label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(8, 1fr)', 
              gap: 8,
            }}>
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: color,
                    border: selectedColor === color ? '3px solid #1F2937' : '2px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.1s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {selectedColor === color && <Check size={18} color="white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div style={{ 
            marginBottom: 20, 
            padding: 16, 
            background: '#F9FAFB', 
            borderRadius: 10,
          }}>
            <label style={{ 
              display: 'block', 
              fontSize: 12, 
              color: '#6B7280', 
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {t('talentPool.preview', 'Önizleme')}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: `${selectedColor}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Tag size={20} color={selectedColor} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 500, color: '#1F2937' }}>
                {tagName || t('talentPool.tagNamePlaceholder', 'Örn: Liderlik Potansiyeli')}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '10px 14px',
              background: '#FEE2E2',
              color: '#DC2626',
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'white',
                border: '1px solid #D1D5DB',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                color: '#374151',
                cursor: 'pointer',
              }}
            >
              {t('common.cancel', 'İptal')}
            </button>
            <button
              type="submit"
              disabled={loading || !tagName.trim()}
              style={{
                padding: '10px 20px',
                background: loading || !tagName.trim() ? '#D1D5DB' : '#6366F1',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                color: 'white',
                cursor: loading || !tagName.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Check size={16} />
              {loading ? t('common.saving', 'Kaydediliyor...') : t('common.save', 'Kaydet')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickCreateTagModal;
