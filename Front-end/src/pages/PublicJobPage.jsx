/**
 * Public Job Page - İlan Detay Sayfası (Herkese Açık)
 * Adaylar ve dış kaynaklar bu sayfadan ilanı görüntüleyebilir
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Globe, 
  Clock,
  Building2,
  BookOpen,
  Languages,
  ChevronLeft,
  Share2,
  ExternalLink,
  AlertCircle,
  Info,
  Gift
} from 'lucide-react';

const PublicJobPage = ({ jobId }) => {
  const { t, i18n } = useTranslation();
  const [job, setJob] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/public/jobs/${jobId}`);
        const data = await response.json();
        
        if (data.success && data.job) {
          setJob(data.job);
          setCompany(data.company || null);
        } else {
          setError(t('publicJob.notFound', 'İlan bulunamadı'));
        }
      } catch (err) {
        console.error('Error fetching job:', err);
        setError(t('publicJob.error', 'İlan yüklenirken bir hata oluştu'));
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId, t]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const getRemotePolicyLabel = (policy) => {
    const labels = {
      'office': t('publicJob.office', 'Ofis'),
      'remote': t('publicJob.remote', 'Uzaktan'),
      'hybrid': t('publicJob.hybrid', 'Hibrit')
    };
    return labels[policy] || policy;
  };

  const getEmploymentTypeLabel = (type) => {
    const labels = {
      'full-time': t('publicJob.fullTime', 'Tam Zamanlı'),
      'part-time': t('publicJob.partTime', 'Yarı Zamanlı'),
      'contract': t('publicJob.contract', 'Sözleşmeli'),
      'intern': t('publicJob.intern', 'Stajyer')
    };
    return labels[type] || type;
  };

  const getExperienceLevelLabel = (level) => {
    const labels = {
      'entry': t('publicJob.entry', 'Yeni Mezun'),
      'junior': t('publicJob.junior', 'Junior (1-3 yıl)'),
      'mid': t('publicJob.mid', 'Mid-Level (3-5 yıl)'),
      'senior': t('publicJob.senior', 'Senior (5+ yıl)'),
      'lead': t('publicJob.lead', 'Lead/Principal'),
      'executive': t('publicJob.executive', 'Yönetici')
    };
    return labels[level] || level;
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ marginBottom: 16 }}></div>
          <p style={{ color: '#6B7280' }}>{t('common.loading', 'Yükleniyor...')}</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)'
      }}>
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 48,
          textAlign: 'center',
          maxWidth: 400,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <div style={{
            width: 64,
            height: 64,
            background: '#FEF2F2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <AlertCircle size={32} color="#DC2626" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>
            {t('publicJob.notFoundTitle', 'İlan Bulunamadı')}
          </h2>
          <p style={{ color: '#6B7280', fontSize: 14 }}>
            {error || t('publicJob.notFoundDesc', 'Aradığınız ilan mevcut değil veya kaldırılmış olabilir.')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)'
    }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #E5E7EB',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: 900,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {company?.logo_url ? (
              <img 
                src={company.logo_url} 
                alt={company.name || 'Company'} 
                style={{ 
                  height: 40, 
                  maxWidth: 150, 
                  objectFit: 'contain' 
                }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div style={{
                width: 36,
                height: 36,
                background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Briefcase size={20} color="white" />
              </div>
            )}
            <span style={{ 
              fontSize: 18, 
              fontWeight: 700, 
              color: '#1F2937',
              fontFamily: "'Inter', sans-serif"
            }}>
              {company?.name || 'HrSmart'}
            </span>
          </div>
          
          <button
            onClick={handleCopyLink}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              background: linkCopied ? '#DCFCE7' : '#F3F4F6',
              border: 'none',
              borderRadius: 8,
              color: linkCopied ? '#16A34A' : '#374151',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Share2 size={16} />
            {linkCopied ? t('jobs.copied', 'Kopyalandı!') : t('publicJob.shareJob', 'Paylaş')}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        {/* Job Header Card */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 32,
          marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#1F2937',
            marginBottom: 16
          }}>
            {job.title}
          </h1>

          {/* Quick Info Tags */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 24
          }}>
            {job.location && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: '#F3F4F6',
                borderRadius: 8,
                fontSize: 13,
                color: '#4B5563'
              }}>
                <MapPin size={16} color="#6B7280" />
                {job.location}
              </span>
            )}
            
            {job.employment_type && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: '#EEF2FF',
                borderRadius: 8,
                fontSize: 13,
                color: '#4338CA'
              }}>
                <Briefcase size={16} />
                {getEmploymentTypeLabel(job.employment_type)}
              </span>
            )}
            
            {job.remote_policy && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: '#F0FDF4',
                borderRadius: 8,
                fontSize: 13,
                color: '#16A34A'
              }}>
                <Globe size={16} />
                {getRemotePolicyLabel(job.remote_policy)}
              </span>
            )}
            
            {job.experience_level && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: '#FEF3C7',
                borderRadius: 8,
                fontSize: 13,
                color: '#B45309'
              }}>
                <Clock size={16} />
                {getExperienceLevelLabel(job.experience_level)}
              </span>
            )}
          </div>

        </div>

        {/* Intro Text (Job Introduction) */}
        {job.intro_text && (
          <div style={{
            background: 'linear-gradient(135deg, #EEF2FF 0%, #F3E8FF 100%)',
            borderRadius: 16,
            padding: 32,
            marginBottom: 24,
            borderLeft: '4px solid #6366F1'
          }}>
            <h2 style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#1F2937',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Info size={20} color="#6366F1" />
              {t('publicJob.introduction', 'Giriş')}
            </h2>
            <div 
              style={{ 
                fontSize: 14, 
                lineHeight: 1.7, 
                color: '#4B5563' 
              }}
              dangerouslySetInnerHTML={{ __html: job.intro_text }}
            />
          </div>
        )}

        {/* Company About */}
        {company?.about && (
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 32,
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <h2 style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#1F2937',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Building2 size={20} color="#10B981" />
              {t('publicJob.aboutCompany', 'Hakkımızda')}
            </h2>
            <div 
              style={{ 
                fontSize: 14, 
                lineHeight: 1.7, 
                color: '#4B5563' 
              }}
              dangerouslySetInnerHTML={{ __html: company.about }}
            />
          </div>
        )}

        {/* Job Description */}
        {job.description && (
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 32,
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <h2 style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#1F2937',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <BookOpen size={20} color="#6366F1" />
              {t('publicJob.description', 'İş Tanımı')}
            </h2>
            <div 
              style={{ 
                fontSize: 14, 
                lineHeight: 1.7, 
                color: '#4B5563' 
              }}
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          </div>
        )}

        {/* Requirements */}
        {job.requirements && (
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 32,
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <h2 style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#1F2937',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <GraduationCap size={20} color="#10B981" />
              {t('publicJob.requirements', 'Aranan Nitelikler')}
            </h2>
            <div 
              style={{ 
                fontSize: 14, 
                lineHeight: 1.7, 
                color: '#4B5563' 
              }}
              dangerouslySetInnerHTML={{ __html: job.requirements }}
            />
          </div>
        )}

        {/* Outro Text (What We Offer / Conclusion) */}
        {job.outro_text && (
          <div style={{
            background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)',
            borderRadius: 16,
            padding: 32,
            marginBottom: 24,
            borderLeft: '4px solid #10B981'
          }}>
            <h2 style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#1F2937',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Gift size={20} color="#10B981" />
              {t('publicJob.whatWeOffer', 'Neler Sunuyoruz')}
            </h2>
            <div 
              style={{ 
                fontSize: 14, 
                lineHeight: 1.7, 
                color: '#4B5563' 
              }}
              dangerouslySetInnerHTML={{ __html: job.outro_text }}
            />
          </div>
        )}

        {/* Additional Info */}
        {(job.required_education || job.preferred_majors || job.required_languages) && (
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 32,
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <h2 style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#1F2937',
              marginBottom: 20
            }}>
              {t('publicJob.additionalInfo', 'Ek Bilgiler')}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {job.required_education && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <GraduationCap size={18} color="#6B7280" style={{ marginTop: 2 }} />
                  <div>
                    <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
                      {t('publicJob.education', 'Eğitim Seviyesi')}
                    </p>
                    <p style={{ fontSize: 14, color: '#374151' }}>{job.required_education}</p>
                  </div>
                </div>
              )}
              
              {job.preferred_majors && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <BookOpen size={18} color="#6B7280" style={{ marginTop: 2 }} />
                  <div>
                    <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
                      {t('publicJob.majors', 'Tercih Edilen Bölümler')}
                    </p>
                    <p style={{ fontSize: 14, color: '#374151' }}>
                      {Array.isArray(job.preferred_majors) ? job.preferred_majors.join(', ') : job.preferred_majors}
                    </p>
                  </div>
                </div>
              )}
              
              {job.required_languages && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <Languages size={18} color="#6B7280" style={{ marginTop: 2 }} />
                  <div>
                    <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
                      {t('publicJob.languages', 'Dil Gereksinimleri')}
                    </p>
                    <p style={{ fontSize: 14, color: '#374151' }}>
                      {(() => {
                        if (Array.isArray(job.required_languages)) {
                          return job.required_languages.map(lang => 
                            typeof lang === 'object' ? `${lang.language || ''} (${lang.level || ''})` : String(lang)
                          ).join(', ');
                        } else if (typeof job.required_languages === 'object') {
                          return Object.entries(job.required_languages)
                            .map(([lang, level]) => `${lang} (${level})`)
                            .join(', ');
                        }
                        return String(job.required_languages);
                      })()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Keywords */}
        {job.keywords && Array.isArray(job.keywords) && job.keywords.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 32,
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <h2 style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#1F2937',
              marginBottom: 16
            }}>
              {t('publicJob.keywords', 'Anahtar Kelimeler')}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {job.keywords.map((keyword, index) => (
                <span
                  key={index}
                  style={{
                    padding: '6px 12px',
                    background: '#F3F4F6',
                    borderRadius: 20,
                    fontSize: 13,
                    color: '#4B5563'
                  }}
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        background: 'white',
        borderTop: '1px solid #E5E7EB',
        padding: '24px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: 13, color: '#9CA3AF' }}>
          {t('publicJob.poweredBy', 'Powered by')} <strong style={{ color: '#6366F1' }}>HrSmart</strong>
        </p>
      </footer>
    </div>
  );
};

export default PublicJobPage;
