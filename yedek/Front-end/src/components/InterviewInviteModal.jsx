/**
 * Interview Invite Modal
 * Send interview invitation to a candidate
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@apollo/client/react';
import { X, Video, Copy, Check, Mail, Clock, HelpCircle } from 'lucide-react';
import { CREATE_INTERVIEW_SESSION } from '../graphql/interview';
import { JOB_QUERY } from '../graphql/jobs';

const InterviewInviteModal = ({ isOpen, onClose, candidate, application, jobId, onSuccess }) => {
  const { t } = useTranslation();
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [error, setError] = useState('');

  // Fetch fresh job data
  const { data: jobData } = useQuery(JOB_QUERY, {
    variables: { id: jobId },
    skip: !jobId,
    fetchPolicy: 'network-only',
  });

  const [createSession] = useMutation(CREATE_INTERVIEW_SESSION);

  const job = jobData?.job;
  const interviewEnabled = job?.interviewEnabled;
  const questionCount = job?.interviewTemplate?.questionCount || 0;
  const deadlineHours = job?.interviewDeadlineHours || 72;

  const handleSend = async () => {
    setSending(true);
    setError('');

    try {
      const result = await createSession({
        variables: {
          input: {
            jobId,
            candidateId: candidate.id,
            applicationId: application.id,
            email: candidate.email,
          },
        },
      });

      if (result.data?.createInterviewSession?.success) {
        const link = result.data.createInterviewSession.interviewLink;
        setGeneratedLink(link);
        onSuccess?.();
      } else {
        setError(result.data?.createInterviewSession?.message || 'Hata oluştu');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Video size={20} />
            </div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Mülakata Davet Et</h2>
          </div>
          <button onClick={onClose} style={{ padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={20} color="#6B7280" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {!interviewEnabled ? (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <HelpCircle size={48} style={{ color: '#9CA3AF', marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '600', color: '#374151' }}>Mülakat Aktif Değil</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>Bu iş ilanı için önce mülakat ayarlarını yapılandırmalısınız.</p>
            </div>
          ) : generatedLink ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Check size={32} color="#059669" />
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '600', color: '#059669' }}>Davet Oluşturuldu!</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>Aşağıdaki linki adayla paylaşın</p>
              </div>

              <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                <input
                  type="text"
                  value={generatedLink}
                  readOnly
                  style={{ width: '100%', padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', marginBottom: '12px' }}
                />
                <button
                  onClick={handleCopy}
                  className="btn btn-primary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? 'Kopyalandı!' : 'Linki Kopyala'}
                </button>
              </div>
            </>
          ) : (
            <>
              {error && <div style={{ padding: '12px', background: '#FEE2E2', color: '#DC2626', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

              <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Aday Bilgileri</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600', fontSize: '18px' }}>
                    {candidate?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#111827' }}>{candidate?.name || 'Bilinmiyor'}</div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>{candidate?.email || 'E-posta yok'}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div style={{ padding: '12px', background: '#EFF6FF', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#3B82F6', marginBottom: '4px' }}>
                    <HelpCircle size={14} />
                    Soru Sayısı
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1E40AF' }}>{questionCount}</div>
                </div>
                <div style={{ padding: '12px', background: '#EFF6FF', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#3B82F6', marginBottom: '4px' }}>
                    <Clock size={14} />
                    Geçerlilik Süresi
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1E40AF' }}>{deadlineHours} saat</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!generatedLink && interviewEnabled && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button onClick={onClose} className="btn btn-secondary" disabled={sending}>{t('common.cancel')}</button>
            <button onClick={handleSend} className="btn btn-primary" disabled={sending} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={18} />
              {sending ? 'Gönderiliyor...' : 'Davet Gönder'}
            </button>
          </div>
        )}

        {generatedLink && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onClose} className="btn btn-primary">Kapat</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewInviteModal;

