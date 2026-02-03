/**
 * Offer Preview Modal
 * Standalone modal for viewing offer details in A4 format
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@apollo/client/react';
import { X, FileText, Building2, MapPin, Phone, Mail } from 'lucide-react';
import { ME_QUERY } from '../graphql/auth';
import { GET_COMPANY_ADDRESSES } from '../graphql/companyAddress';
import { API_BASE_URL } from '../config/api';

// Benefit category icons
const CATEGORY_ICONS = {
  FINANCIAL: '💰',
  HEALTH: '🏥',
  TRANSPORTATION: '🚗',
  DEVELOPMENT: '📚',
  LIFESTYLE: '🎯',
  FOOD: '🍽️',
};

const OfferPreviewModal = ({ 
  isOpen, 
  onClose, 
  offerData,
  candidateName: propCandidateName,
  jobTitle: propJobTitle,
}) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'tr' ? 'tr' : 'en';

  // Fetch company info
  const { data: meData } = useQuery(ME_QUERY, { fetchPolicy: 'cache-first' });
  
  // Fetch company addresses
  const { data: addressesData } = useQuery(GET_COMPANY_ADDRESSES, {
    variables: { includeInactive: false },
    fetchPolicy: 'cache-first',
  });

  if (!isOpen || !offerData) return null;

  // Get company info from ME_QUERY (returns companyName and companyLogo at user level)
  const primaryAddress = addressesData?.companyAddresses?.find(a => a.isPrimary) || addressesData?.companyAddresses?.[0];
  
  const companyInfo = {
    name: meData?.me?.companyName || '',
    logo: meData?.me?.companyLogo,
    address: primaryAddress?.addressLine1,
    city: primaryAddress?.city,
    district: primaryAddress?.district,
    phone: primaryAddress?.phone,
    email: primaryAddress?.email,
  };

  // Get values from offerData
  const candidateName = propCandidateName || offerData.candidateName || '';
  const jobTitle = propJobTitle || offerData.jobTitle || '';
  const salaryGross = offerData.salaryGross;
  const salaryNet = offerData.salaryNet;
  const currency = offerData.currency || 'TRY';
  const startDate = offerData.startDate;
  const validUntilDate = offerData.validUntil;
  const benefits = offerData.benefits || [];
  const customNotes = offerData.customNotes;
  const introText = offerData.introText || '';
  const outroText = offerData.outroText || '';

  const currencySymbols = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' };
  
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };
  
  const formatCurrency = (value) => {
    if (!value) return '-';
    return `${parseInt(value).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} ${currencySymbols[currency] || currency}`;
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(30, 41, 59, 0.95)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1200,
    }}>
      <div style={{
        width: '100%', maxWidth: 900, height: '100%',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Preview Header */}
        <div style={{
          padding: '12px 24px', background: '#1F2937', color: 'white',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} />
            {t('createOffer.previewTitle', 'Teklif Önizleme')} - A4 Format
          </span>
          <button onClick={onClose} style={{
            padding: 8, border: 'none', background: 'rgba(255,255,255,0.1)',
            borderRadius: 6, cursor: 'pointer', color: 'white', display: 'flex',
          }}>
            <X size={20} />
          </button>
        </div>

        {/* A4 Document Container - Scrollable */}
        <div style={{ 
          flex: 1, overflow: 'auto', padding: '30px 0', 
          display: 'flex', justifyContent: 'center',
          background: '#374151',
        }}>
          <div style={{
            width: 794, // A4 width at 96 DPI
            minHeight: 1123, // A4 height at 96 DPI
            background: 'white',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            position: 'relative',
          }}>
            {/* Page Content */}
            <div style={{ padding: '60px 70px', minHeight: 1003 }}>
              {/* Company Header */}
              <div style={{ 
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                marginBottom: 40, paddingBottom: 24, borderBottom: '2px solid #10B981',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {companyInfo.logo ? (
                    <img 
                      src={`${API_BASE_URL}${companyInfo.logo.replace('/app', '')}`}
                      alt={companyInfo.name}
                      style={{ height: 60, maxWidth: 180, objectFit: 'contain' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ 
                      width: 60, height: 60, 
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      borderRadius: 12, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Building2 size={30} color="white" />
                    </div>
                  )}
                  <div>
                    <h1 style={{ 
                      fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 4px',
                      fontFamily: 'Georgia, serif',
                    }}>
                      {companyInfo.name || 'Şirket Adı'}
                    </h1>
                    <p style={{ fontSize: 12, color: '#6B7280', margin: 0, fontFamily: 'Arial, sans-serif' }}>
                      {t('createOffer.officialOffer', 'Resmi İş Teklifi')}
                    </p>
                  </div>
                </div>
                
                {/* Company Contact */}
                <div style={{ textAlign: 'right', fontSize: 11, color: '#6B7280', lineHeight: 1.6 }}>
                  {companyInfo.address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                      <MapPin size={12} />
                      <span>{companyInfo.address}</span>
                    </div>
                  )}
                  {(companyInfo.city || companyInfo.district) && (
                    <div>{[companyInfo.district, companyInfo.city].filter(Boolean).join(', ')}</div>
                  )}
                  {companyInfo.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 4 }}>
                      <Phone size={12} />
                      <span>{companyInfo.phone}</span>
                    </div>
                  )}
                  {companyInfo.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                      <Mail size={12} />
                      <span>{companyInfo.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Date & Reference */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
                <div style={{ fontSize: 12, color: '#6B7280' }}>
                  <div>{t('createOffer.date', 'Tarih')}: <strong>{formatDate(offerData.sentAt || offerData.createdAt)}</strong></div>
                </div>
                {validUntilDate && (
                  <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>
                    {t('createOffer.validUntil', 'Son Kabul')}: {formatDate(validUntilDate)}
                  </div>
                )}
              </div>

              {/* Candidate Info */}
              <div style={{ marginBottom: 30 }}>
                <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>{t('createOffer.to', 'Sayın')},</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#10B981 ' }}>{candidateName}</div>
              </div>

              {/* Position Box */}
              <div style={{
                background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)', 
                padding: 20, borderRadius: 12, marginBottom: 30,
                borderLeft: '4px solid #10B981',
              }}>
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>
                  {t('createOffer.positionTitle', 'Teklif Edilen Pozisyon')}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#166534' }}>{jobTitle}</div>
              </div>

              {/* Intro Text */}
              {introText && (
                <div style={{ 
                  marginBottom: 30, fontSize: 13, color: '#374151', 
                  lineHeight: 1.8, textAlign: 'justify', whiteSpace: 'pre-wrap',
                  fontFamily: 'Georgia, serif',
                }}>
                  {introText}
                </div>
              )}

              {/* Salary Details Table */}
              <div style={{ marginBottom: 30 }}>
                <h3 style={{ 
                  fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16,
                  paddingBottom: 10, borderBottom: '2px solid #E5E7EB',
                  fontFamily: 'Arial, sans-serif',
                }}>
                  💰 {t('createOffer.salaryDetails', 'Maaş Detayları')}
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <tbody>
                    <tr style={{ background: '#F9FAFB' }}>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #E5E7EB', fontWeight: 500 }}>
                        {t('createOffer.salaryGross', 'Brüt Maaş')}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #E5E7EB', textAlign: 'right', fontWeight: 700, fontSize: 16, color: '#10B981' }}>
                        {formatCurrency(salaryGross)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #E5E7EB', fontWeight: 500 }}>
                        {t('createOffer.salaryNet', 'Net Maaş')}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #E5E7EB', textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(salaryNet)}
                      </td>
                    </tr>
                    <tr style={{ background: '#F9FAFB' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 500 }}>
                        {t('createOffer.startDate', 'İşe Başlangıç Tarihi')}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600 }}>
                        {startDate ? formatDate(startDate) : '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Benefits */}
              {benefits && benefits.length > 0 && (
                <div style={{ marginBottom: 30 }}>
                  <h3 style={{ 
                    fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16,
                    paddingBottom: 10, borderBottom: '2px solid #E5E7EB',
                    fontFamily: 'Arial, sans-serif',
                  }}>
                    🎁 {t('createOffer.benefits', 'Yan Haklar')}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {benefits.map((b, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 16px', background: '#F9FAFB', borderRadius: 8,
                        border: '1px solid #E5E7EB',
                      }}>
                        <span style={{ fontSize: 18 }}>{b.icon || CATEGORY_ICONS[b.category] || '✓'}</span>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{b.name}</span>
                        {b.value && (
                          <span style={{ color: '#6B7280', fontSize: 12, fontWeight: 600 }}>
                            {parseInt(b.value).toLocaleString()} ₺
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Notes */}
              {customNotes && (
                <div style={{ 
                  marginBottom: 30, padding: 20, 
                  background: '#FEF3C7', borderRadius: 12,
                  borderLeft: '4px solid #F59E0B',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 10 }}>
                    📝 {t('createOffer.specialNotes', 'Özel Notlar')}
                  </div>
                  <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {customNotes}
                  </div>
                </div>
              )}

              {/* Outro Text */}
              {outroText && (
                <div style={{ 
                  marginBottom: 40, fontSize: 13, color: '#374151', 
                  lineHeight: 1.8, textAlign: 'justify', whiteSpace: 'pre-wrap',
                  fontFamily: 'Georgia, serif',
                }}>
                  {outroText}
                </div>
              )}

              {/* Signature Area */}
              <div style={{ marginTop: 50 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ textAlign: 'center', width: 200 }}>
                    <div style={{ 
                      height: 60, borderBottom: '1px solid #374151', marginBottom: 10,
                      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 8,
                      fontFamily: 'cursive', fontSize: 18, color: '#374151',
                    }}>
                      {companyInfo.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>
                      {t('createOffer.employerSignature', 'İşveren İmzası')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Page Footer */}
            <div style={{ 
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '12px 70px', background: '#F9FAFB', 
              borderTop: '1px solid #E5E7EB',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: 10, color: '#9CA3AF',
            }}>
              <span>{companyInfo.name} - {t('createOffer.officialOffer', 'Resmi İş Teklifi')}</span>
              <span>{t('createOffer.page', 'Sayfa')} 1/1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferPreviewModal;
