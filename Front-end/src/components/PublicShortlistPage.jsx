/**
 * PublicShortlistPage - Public view for Hiring Managers to see shortlisted candidates
 */
import React from 'react';
import { useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { 
  Star, MapPin, Briefcase, Building2, Mail, Phone, 
  Calendar, User, Award, GraduationCap, Code, Clock,
  AlertCircle, Download, FileText
} from 'lucide-react';
import { GET_PUBLIC_SHORTLIST } from '../graphql/shortlist';
import { API_BASE_URL } from '../config/api';

const PublicShortlistPage = ({ token }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'tr';

  const { data, loading, error } = useQuery(GET_PUBLIC_SHORTLIST, {
    variables: { token },
    skip: !token,
  });

  const shortlist = data?.publicShortlist;

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48,
            height: 48,
            border: '4px solid #E2E8F0',
            borderTopColor: '#F59E0B',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#64748B', fontSize: 14 }}>
            {t('common.loading', 'Loading...')}
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

  // Error or expired state
  if (error || !shortlist || shortlist.isExpired) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
        padding: 24,
      }}>
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 40,
          textAlign: 'center',
          maxWidth: 400,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}>
          <div style={{
            width: 64,
            height: 64,
            background: '#FEF2F2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <AlertCircle size={32} color="#DC2626" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
            {shortlist?.isExpired 
              ? (lang === 'tr' ? 'Link Süresi Doldu' : 'Link Expired')
              : (lang === 'tr' ? 'Sayfa Bulunamadı' : 'Page Not Found')
            }
          </h1>
          <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.6 }}>
            {shortlist?.isExpired
              ? (lang === 'tr' 
                  ? 'Bu paylaşım linkinin süresi dolmuş. Lütfen İK ekibiyle iletişime geçin.'
                  : 'This share link has expired. Please contact the HR team.')
              : (lang === 'tr'
                  ? 'Aradığınız sayfa bulunamadı veya artık mevcut değil.'
                  : 'The page you are looking for was not found or no longer exists.')
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
    }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #E5E7EB',
        padding: '20px 0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Company logo and name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {shortlist.companyLogo ? (
              <img
                src={`${API_BASE_URL}${shortlist.companyLogo.replace('/app', '')}`}
                alt={shortlist.companyName}
                style={{ height: 40, maxWidth: 160, objectFit: 'contain' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div style={{
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Building2 size={20} color="white" />
              </div>
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>
                {shortlist.companyName}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>
                {shortlist.listType === 'longlist' 
                  ? (lang === 'tr' ? 'Aday Uzun Listesi' : 'Candidate Long List')
                  : (lang === 'tr' ? 'Aday Kısa Listesi' : 'Candidate Short List')
                }
              </div>
            </div>
          </div>

          {/* Badge - Blue for Long List, Gold for Short List */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: shortlist.listType === 'longlist' 
              ? 'linear-gradient(135deg, #DBEAFE, #BFDBFE)'
              : 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
            borderRadius: 20,
            border: shortlist.listType === 'longlist' ? '1px solid #3B82F6' : '1px solid #F59E0B',
          }}>
            <Star 
              size={16} 
              color={shortlist.listType === 'longlist' ? '#1D4ED8' : '#D97706'} 
              fill={shortlist.listType === 'longlist' ? '#1D4ED8' : '#D97706'} 
            />
            <span style={{ 
              fontWeight: 600, 
              color: shortlist.listType === 'longlist' ? '#1E40AF' : '#92400E', 
              fontSize: 13 
            }}>
              {shortlist.listType === 'longlist' ? 'Long List' : 'Short List'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Title Section */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 32,
          marginBottom: 24,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
        }}>
          <h1 style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#111827',
            marginBottom: 8,
          }}>
            {shortlist.title}
          </h1>
          
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280' }}>
              <Briefcase size={16} />
              <span style={{ fontWeight: 500 }}>{shortlist.jobTitle}</span>
            </div>
            {shortlist.jobLocation && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280' }}>
                <MapPin size={16} />
                <span>{shortlist.jobLocation}</span>
              </div>
            )}
            {shortlist.jobDepartment && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280' }}>
                <Building2 size={16} />
                <span>{shortlist.jobDepartment}</span>
              </div>
            )}
          </div>

          {shortlist.message && (
            <div style={{
              padding: 16,
              background: '#F0FDF4',
              borderRadius: 8,
              border: '1px solid #86EFAC',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color: '#059669',
                marginBottom: 8,
              }}>
                <Mail size={14} />
                {lang === 'tr' ? 'İK Ekibinden Not' : 'Note from HR Team'}
              </div>
              <div style={{
                color: '#166534',
                fontSize: 14,
                lineHeight: 1.6,
              }}>
                {shortlist.message}
              </div>
            </div>
          )}

          {/* Stats */}
          <div style={{
            display: 'flex',
            gap: 24,
            marginTop: 20,
            paddingTop: 20,
            borderTop: '1px solid #E5E7EB',
          }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#F59E0B' }}>
                {shortlist.candidateCount}
              </div>
              <div style={{ fontSize: 13, color: '#6B7280' }}>
                {lang === 'tr' ? 'Aday' : 'Candidates'}
              </div>
            </div>
            {shortlist.expiresAt && (
              <div>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 500, 
                  color: '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <Clock size={14} />
                  {lang === 'tr' ? 'Son Geçerlilik:' : 'Expires:'}
                </div>
                <div style={{ fontSize: 14, color: '#374151' }}>
                  {new Date(shortlist.expiresAt).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Candidates Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: 20,
        }}>
          {shortlist.candidates.map((candidate, index) => (
            <div
              key={candidate.id}
              style={{
                background: 'white',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.04)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Card Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #F3F4F6',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${
                      ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'][index % 5]
                    }, ${
                      ['#D97706', '#059669', '#1D4ED8', '#6D28D9', '#DB2777'][index % 5]
                    })`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 18,
                  }}>
                    {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>
                      {candidate.name}
                    </div>
                    {candidate.location && (
                      <div style={{ fontSize: 13, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} />
                        {candidate.location}
                      </div>
                    )}
                  </div>
                </div>

                {/* Score Badge */}
                {candidate.overallScore && (
                  <div style={{
                    padding: '6px 12px',
                    background: candidate.overallScore >= 80 ? '#D1FAE5' : candidate.overallScore >= 60 ? '#FEF3C7' : '#FEE2E2',
                    color: candidate.overallScore >= 80 ? '#065F46' : candidate.overallScore >= 60 ? '#92400E' : '#991B1B',
                    borderRadius: 20,
                    fontWeight: 700,
                    fontSize: 14,
                  }}>
                    {candidate.overallScore}%
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div style={{ padding: '20px 24px' }}>
                {/* Contact Info */}
                <div style={{ marginBottom: 16 }}>
                  {candidate.email && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8, 
                      fontSize: 13, 
                      color: '#374151',
                      marginBottom: 6,
                    }}>
                      <Mail size={14} color="#6B7280" />
                      <a href={`mailto:${candidate.email}`} style={{ color: '#3B82F6', textDecoration: 'none' }}>
                        {candidate.email}
                      </a>
                    </div>
                  )}
                  {candidate.phone && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8, 
                      fontSize: 13, 
                      color: '#374151',
                      marginBottom: 6,
                    }}>
                      <Phone size={14} color="#6B7280" />
                      <a href={`tel:${candidate.phone}`} style={{ color: '#3B82F6', textDecoration: 'none' }}>
                        {candidate.phone}
                      </a>
                    </div>
                  )}
                  {/* CV Download Button - Icon only */}
                  {candidate.cvUrl && (
                    <a 
                      href={`${API_BASE_URL}${candidate.cvUrl.replace('/app', '')}`}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      title={lang === 'tr' ? 'CV İndir' : 'Download CV'}
                      style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                        background: '#F3F4F6',
                        borderRadius: 10,
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                        marginTop: 8,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#E5E7EB';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#F3F4F6';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <Download size={20} color="#4B5563" />
                    </a>
                  )}
                </div>

                {/* Experience Summary */}
                {candidate.experienceSummary && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 6, 
                      fontSize: 12, 
                      fontWeight: 600, 
                      color: '#6B7280',
                      marginBottom: 6,
                    }}>
                      <Award size={14} />
                      {lang === 'tr' ? 'Deneyim' : 'Experience'}
                    </div>
                    <p style={{ 
                      fontSize: 13, 
                      color: '#374151', 
                      lineHeight: 1.5,
                      margin: 0,
                    }}>
                      {candidate.experienceSummary}
                    </p>
                  </div>
                )}

                {/* Education Summary */}
                {candidate.educationSummary && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 6, 
                      fontSize: 12, 
                      fontWeight: 600, 
                      color: '#6B7280',
                      marginBottom: 6,
                    }}>
                      <GraduationCap size={14} />
                      {lang === 'tr' ? 'Eğitim' : 'Education'}
                    </div>
                    <p style={{ 
                      fontSize: 13, 
                      color: '#374151', 
                      lineHeight: 1.5,
                      margin: 0,
                    }}>
                      {candidate.educationSummary}
                    </p>
                  </div>
                )}

                {/* Skills */}
                {candidate.skills && candidate.skills.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 6, 
                      fontSize: 12, 
                      fontWeight: 600, 
                      color: '#6B7280',
                      marginBottom: 8,
                    }}>
                      <Code size={14} />
                      {lang === 'tr' ? 'Yetenekler' : 'Skills'}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {candidate.skills.slice(0, 6).map((skill, i) => (
                        <span
                          key={i}
                          style={{
                            padding: '4px 10px',
                            background: '#F3F4F6',
                            borderRadius: 12,
                            fontSize: 12,
                            color: '#374151',
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                      {candidate.skills.length > 6 && (
                        <span style={{
                          padding: '4px 10px',
                          background: '#E5E7EB',
                          borderRadius: 12,
                          fontSize: 12,
                          color: '#6B7280',
                        }}>
                          +{candidate.skills.length - 6}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Shortlist Note */}
                {candidate.shortlistNote && (
                  <div style={{
                    padding: 12,
                    background: '#FFFBEB',
                    borderRadius: 8,
                    border: '1px solid #FDE68A',
                  }}>
                    <div style={{ 
                      fontSize: 11, 
                      fontWeight: 600, 
                      color: '#92400E',
                      marginBottom: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      <Star size={12} />
                      {lang === 'tr' ? 'İK Notu' : 'HR Note'}
                    </div>
                    <p style={{ 
                      fontSize: 13, 
                      color: '#78350F',
                      margin: 0,
                      lineHeight: 1.5,
                    }}>
                      {candidate.shortlistNote}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {shortlist.candidates.length === 0 && (
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 60,
            textAlign: 'center',
          }}>
            <User size={48} color="#D1D5DB" style={{ marginBottom: 16 }} />
            <p style={{ color: '#6B7280', fontSize: 14 }}>
              {lang === 'tr' ? 'Henüz aday eklenmemiş.' : 'No candidates added yet.'}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        padding: '24px 0',
        textAlign: 'center',
        borderTop: '1px solid #E5E7EB',
        background: 'white',
        marginTop: 40,
      }}>
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
          {lang === 'tr' 
            ? 'Bu liste HRSmart tarafından oluşturulmuştur.'
            : 'This list was created by HRSmart.'}
        </p>
      </footer>
    </div>
  );
};

export default PublicShortlistPage;
