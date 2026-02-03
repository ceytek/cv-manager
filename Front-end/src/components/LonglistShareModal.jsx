/**
 * LonglistShareModal - Modal for creating and sharing longlist link
 * If an active link exists, shows existing link instead of creating new one
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@apollo/client/react';
import { X, Share2, Link2, Copy, Check, Calendar, List, Loader2, Eye, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { CREATE_SHORTLIST_SHARE, GET_SHORTLIST_SHARES } from '../graphql/shortlist';

const LonglistShareModal = ({ isOpen, onClose, jobId, jobTitle, longlistCount }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'tr';
  
  const [title, setTitle] = useState(`${jobTitle} - Long List`);
  const [message, setMessage] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  
  // Check for existing active shares (longlist only)
  const { data: sharesData, loading: sharesLoading, refetch: refetchShares } = useQuery(GET_SHORTLIST_SHARES, {
    variables: { jobId, listType: 'longlist' },
    skip: !isOpen || !jobId,
    fetchPolicy: 'network-only',
  });
  
  const [createShare, { loading: createLoading }] = useMutation(CREATE_SHORTLIST_SHARE);

  // Find active (non-expired) longlist share for this job
  const existingShare = sharesData?.shortlistShares?.find(share => 
    share.jobId === jobId && share.isActive && !share.isExpired && share.listType === 'longlist'
  );

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTitle(`${jobTitle} - Long List`);
      setMessage('');
      setExpiresInDays(7);
      setShareUrl('');
      setCopied(false);
      setShowCreateNew(false);
    }
  }, [isOpen, jobTitle]);

  if (!isOpen) return null;

  const handleCreateShare = async () => {
    try {
      const result = await createShare({
        variables: {
          input: {
            jobId,
            title,
            message: message.trim() || null,
            expiresInDays,
            listType: 'longlist',  // Key difference: longlist type
          }
        }
      });
      
      if (result.data?.createShortlistShare?.success) {
        setShareUrl(result.data.createShortlistShare.share.shareUrl);
        setShowCreateNew(false);
        refetchShares();
      } else {
        alert(result.data?.createShortlistShare?.message || 'Error creating share link');
      }
    } catch (error) {
      console.error('Error creating share:', error);
      alert('Error creating share link');
    }
  };

  const handleCopy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleClose = () => {
    setTitle(`${jobTitle} - Long List`);
    setMessage('');
    setExpiresInDays(7);
    setShareUrl('');
    setCopied(false);
    setShowCreateNew(false);
    onClose();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Loading state
  if (sharesLoading) {
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
          padding: 40,
          textAlign: 'center',
        }}>
          <Loader2 size={32} color="#3B82F6" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12, color: '#6B7280' }}>
            {lang === 'tr' ? 'Kontrol ediliyor...' : 'Checking...'}
          </p>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Show existing link if available and not creating new
  const showExistingLink = existingShare && !showCreateNew && !shareUrl;

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
        maxWidth: 520,
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
      }}>
        {/* Header - Blue theme for Long List */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #E5E7EB',
          background: showExistingLink 
            ? 'linear-gradient(135deg, #DBEAFE, #BFDBFE)' 
            : 'linear-gradient(135deg, #DBEAFE, #93C5FD)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {showExistingLink ? (
              <>
                <Link2 size={20} color="#1D4ED8" />
                <span style={{ fontSize: 16, fontWeight: 600, color: '#1E40AF' }}>
                  {lang === 'tr' ? 'Mevcut Paylaşım Linki' : 'Existing Share Link'}
                </span>
              </>
            ) : (
              <>
                <List size={20} color="#1D4ED8" />
                <span style={{ fontSize: 16, fontWeight: 600, color: '#1E40AF' }}>
                  {lang === 'tr' ? 'Long List Paylaş' : 'Share Long List'}
                </span>
              </>
            )}
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
          {/* Info box - Blue theme */}
          <div style={{
            marginBottom: 20,
            padding: '12px 16px',
            background: '#EFF6FF',
            border: '1px solid #93C5FD',
            borderRadius: 8,
            fontSize: 13,
            color: '#1E40AF',
          }}>
            <strong>{longlistCount}</strong> {lang === 'tr' ? 'aday paylaşılacak' : 'candidates will be shared'}
          </div>

          {showExistingLink ? (
            /* ============ EXISTING LINK VIEW ============ */
            <div>
              {/* Info Alert */}
              <div style={{
                marginBottom: 20,
                padding: '14px 16px',
                background: '#EFF6FF',
                border: '1px solid #93C5FD',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}>
                <AlertCircle size={20} color="#3B82F6" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 13, color: '#1E40AF', lineHeight: 1.5 }}>
                  {lang === 'tr' 
                    ? 'Bu iş ilanı için zaten aktif bir Long List paylaşım linki mevcut. Mevcut linki kullanabilir veya yeni bir link oluşturabilirsiniz.'
                    : 'An active Long List share link already exists for this job. You can use the existing link or create a new one.'}
                </div>
              </div>

              {/* Link Details */}
              <div style={{
                marginBottom: 16,
                padding: 16,
                background: '#F9FAFB',
                borderRadius: 8,
                border: '1px solid #E5E7EB',
              }}>
                {/* Title */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                    {lang === 'tr' ? 'Başlık' : 'Title'}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                    {existingShare.title}
                  </div>
                </div>

                {/* Share URL */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: '#6B7280',
                    marginBottom: 6,
                  }}>
                    <Link2 size={14} />
                    {lang === 'tr' ? 'Paylaşım Linki' : 'Share Link'}
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={existingShare.shareUrl}
                      readOnly
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: 8,
                        fontSize: 13,
                        background: 'white',
                        color: '#374151',
                      }}
                    />
                    <button
                      onClick={() => handleCopy(existingShare.shareUrl)}
                      style={{
                        padding: '10px 14px',
                        background: copied ? '#10B981' : '#3B82F6',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: 'white',
                        fontSize: 13,
                        fontWeight: 500,
                        transition: 'background 0.2s',
                      }}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? (lang === 'tr' ? 'Kopyalandı!' : 'Copied!') : (lang === 'tr' ? 'Kopyala' : 'Copy')}
                    </button>
                  </div>
                </div>

                {/* Stats Row */}
                <div style={{
                  display: 'flex',
                  gap: 24,
                  paddingTop: 12,
                  borderTop: '1px solid #E5E7EB',
                }}>
                  {/* Expiry */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={14} color="#6B7280" />
                    <span style={{ fontSize: 12, color: '#6B7280' }}>
                      {lang === 'tr' ? 'Son Geçerlilik:' : 'Expires:'}
                    </span>
                    <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>
                      {formatDate(existingShare.expiresAt)}
                    </span>
                  </div>
                  
                  {/* View Count */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Eye size={14} color="#6B7280" />
                    <span style={{ fontSize: 12, color: '#6B7280' }}>
                      {lang === 'tr' ? 'Görüntülenme:' : 'Views:'}
                    </span>
                    <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>
                      {existingShare.viewCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Create New Link Option */}
              <button
                onClick={() => setShowCreateNew(true)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: 'transparent',
                  border: '1px dashed #D1D5DB',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  color: '#6B7280',
                  fontSize: 13,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3B82F6';
                  e.currentTarget.style.color = '#1D4ED8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#D1D5DB';
                  e.currentTarget.style.color = '#6B7280';
                }}
              >
                <RefreshCw size={14} />
                {lang === 'tr' ? 'Yeni Link Oluştur' : 'Create New Link'}
              </button>
            </div>
          ) : !shareUrl ? (
            /* ============ CREATE NEW LINK FORM ============ */
            <>
              {/* Title input */}
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: 6,
                }}>
                  {lang === 'tr' ? 'Başlık' : 'Title'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                />
              </div>

              {/* Message textarea */}
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: 6,
                }}>
                  {lang === 'tr' ? 'Mesaj (Opsiyonel)' : 'Message (Optional)'}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={lang === 'tr' ? 'Hiring Manager\'a bir mesaj yazın...' : 'Write a message to the Hiring Manager...'}
                  style={{
                    width: '100%',
                    minHeight: 80,
                    padding: 12,
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    fontSize: 14,
                    resize: 'vertical',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                />
              </div>

              {/* Expiration select */}
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: 6,
                }}>
                  <Calendar size={16} />
                  {lang === 'tr' ? 'Link Geçerliliği' : 'Link Expiry'}
                </label>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    background: 'white',
                  }}
                >
                  <option value={3}>3 {lang === 'tr' ? 'gün' : 'days'}</option>
                  <option value={7}>7 {lang === 'tr' ? 'gün' : 'days'}</option>
                  <option value={14}>14 {lang === 'tr' ? 'gün' : 'days'}</option>
                  <option value={30}>30 {lang === 'tr' ? 'gün' : 'days'}</option>
                </select>
              </div>

              {/* Back to existing link button (if there was one) */}
              {existingShare && showCreateNew && (
                <button
                  onClick={() => setShowCreateNew(false)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: 'transparent',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    color: '#6B7280',
                    fontSize: 13,
                  }}
                >
                  {lang === 'tr' ? '← Mevcut Linke Dön' : '← Back to Existing Link'}
                </button>
              )}
            </>
          ) : (
            /* ============ NEWLY CREATED LINK VIEW ============ */
            <div>
              <div style={{
                marginBottom: 16,
                padding: 16,
                background: '#EFF6FF',
                borderRadius: 8,
                border: '1px solid #93C5FD',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                  color: '#1D4ED8',
                  fontWeight: 500,
                }}>
                  <Check size={18} />
                  {lang === 'tr' ? 'Link başarıyla oluşturuldu!' : 'Link created successfully!'}
                </div>
                
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#6B7280',
                  marginBottom: 8,
                }}>
                  <Link2 size={14} />
                  {lang === 'tr' ? 'Paylaşım Linki' : 'Share Link'}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: 8,
                      fontSize: 13,
                      background: 'white',
                      color: '#374151',
                    }}
                  />
                  <button
                    onClick={() => handleCopy(shareUrl)}
                    style={{
                      padding: '10px 14px',
                      background: copied ? '#10B981' : '#3B82F6',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: 'white',
                      fontSize: 13,
                      fontWeight: 500,
                      transition: 'background 0.2s',
                    }}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? (lang === 'tr' ? 'Kopyalandı!' : 'Copied!') : (lang === 'tr' ? 'Kopyala' : 'Copy')}
                  </button>
                </div>
              </div>
              
              <div style={{
                fontSize: 13,
                color: '#6B7280',
                textAlign: 'center',
              }}>
                {lang === 'tr' ? 'Link oluşturuldu. Bu linki Hiring Manager ile paylaşabilirsiniz.' : 'Link created. You can share this link with the Hiring Manager.'}
              </div>
            </div>
          )}
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
            {(shareUrl || showExistingLink) ? (lang === 'tr' ? 'Kapat' : 'Close') : (lang === 'tr' ? 'İptal' : 'Cancel')}
          </button>
          
          {!shareUrl && !showExistingLink && (
            <button
              onClick={handleCreateShare}
              disabled={createLoading || !title.trim()}
              style={{
                padding: '10px 20px',
                background: createLoading || !title.trim() ? '#D1D5DB' : 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                color: 'white',
                cursor: createLoading || !title.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {createLoading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  {lang === 'tr' ? 'Yükleniyor...' : 'Loading...'}
                </>
              ) : (
                <>
                  <Link2 size={16} />
                  {lang === 'tr' ? 'Link Oluştur' : 'Create Link'}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LonglistShareModal;
