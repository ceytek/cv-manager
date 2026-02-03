/**
 * ShortlistNoteModal - Modal for adding a note when adding candidate to shortlist
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Star, MessageSquare } from 'lucide-react';

const ShortlistNoteModal = ({ isOpen, onClose, onConfirm, candidateName }) => {
  const { t } = useTranslation();
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(note.trim() || null);
    setNote('');
  };

  const handleClose = () => {
    setNote('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        width: '100%',
        maxWidth: 480,
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #E5E7EB',
          background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Star size={20} color="#F59E0B" fill="#F59E0B" />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#92400E' }}>
              {t('shortlist.addToShortlist', 'Short List\'e Ekle')}
            </span>
          </div>
          <button
            onClick={handleClose}
            style={{
              padding: 6,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 6,
            }}
          >
            <X size={20} color="#6B7280" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 20 }}>
          {candidateName && (
            <div style={{
              marginBottom: 16,
              padding: '12px 16px',
              background: '#F9FAFB',
              borderRadius: 8,
              fontSize: 14,
              color: '#374151',
            }}>
              <strong>{candidateName}</strong> {t('shortlist.willBeAdded', 'adayı Short List\'e eklenecek.')}
            </div>
          )}

          <div style={{ marginBottom: 8 }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
              marginBottom: 8,
            }}>
              <MessageSquare size={16} />
              {t('shortlist.noteOptional', 'Not (Opsiyonel)')}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('shortlist.notePlaceholder', 'Neden bu adayı Short List\'e ekliyorsunuz?')}
              style={{
                width: '100%',
                minHeight: 100,
                padding: 12,
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                fontSize: 14,
                resize: 'vertical',
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
              onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
          padding: '16px 20px',
          borderTop: '1px solid #E5E7EB',
          background: '#F9FAFB',
        }}>
          <button
            onClick={handleClose}
            style={{
              padding: '10px 20px',
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
              cursor: 'pointer',
            }}
          >
            {t('common.cancel', 'İptal')}
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Star size={16} />
            {t('shortlist.add', 'Ekle')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShortlistNoteModal;
