/**
 * RejectionReasonModal
 * Modal that asks for a rejection reason when moving a candidate to the "Rejected" stage.
 * Calls the reject application mutation with the reason.
 */
import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { X, AlertTriangle, UserX } from 'lucide-react';
import { REJECT_APPLICATION } from '../../graphql/cvs';

const RejectionReasonModal = ({ isOpen, onClose, application, onSuccess }) => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);

  const [rejectApplication] = useMutation(REJECT_APPLICATION);

  const candidateName = application?.candidate?.name || '';

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert(isEnglish ? 'Please enter a rejection reason.' : 'Lütfen red sebebi giriniz.');
      return;
    }

    setSending(true);
    try {
      const result = await rejectApplication({
        variables: {
          applicationId: application.id,
          rejectionNote: reason.trim(),
          templateId: null,
        },
      });
      if (result.data?.rejectApplication?.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert(result.data?.rejectApplication?.message || 'Error');
      }
    } catch (err) {
      alert((isEnglish ? 'Error: ' : 'Hata: ') + err.message);
    } finally {
      setSending(false);
    }
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
        background: 'rgba(0,0,0,0.5)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          width: '100%',
          maxWidth: 500,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #FEE2E2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserX size={20} color="white" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#991B1B' }}>
                {isEnglish ? 'Reject Candidate' : 'Adayı Reddet'}
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#B91C1C' }}>
                {candidateName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              color: '#991B1B',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          {/* Warning */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: 14,
              background: '#FEF3C7',
              borderRadius: 10,
              marginBottom: 20,
              border: '1px solid #FDE68A',
            }}
          >
            <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: 13, color: '#92400E', lineHeight: 1.5 }}>
              {isEnglish
                ? 'This action will mark the candidate as rejected. A rejection reason is required.'
                : 'Bu işlem adayı reddedildi olarak işaretleyecektir. Red sebebi girilmesi zorunludur.'}
            </p>
          </div>

          {/* Reason textarea */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 8,
              }}
            >
              {isEnglish ? 'Rejection Reason' : 'Red Sebebi'} *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isEnglish
                  ? 'Enter the reason for rejecting this candidate...'
                  : 'Bu adayın reddedilme sebebini giriniz...'
              }
              rows={4}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '2px solid #D1D5DB',
                borderRadius: 10,
                fontSize: 14,
                lineHeight: 1.6,
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#DC2626')}
              onBlur={(e) => (e.target.style.borderColor = '#D1D5DB')}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <button
            onClick={onClose}
            disabled={sending}
            style={{
              padding: '10px 20px',
              background: '#F3F4F6',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {t('common.cancel', 'İptal')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={sending || !reason.trim()}
            style={{
              padding: '10px 24px',
              background: sending || !reason.trim() ? '#9CA3AF' : '#DC2626',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: sending || !reason.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <UserX size={16} />
            {sending
              ? (isEnglish ? 'Rejecting...' : 'Reddediliyor...')
              : (isEnglish ? 'Reject' : 'Reddet')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectionReasonModal;
