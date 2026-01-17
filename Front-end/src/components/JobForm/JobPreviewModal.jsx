/**
 * Job Preview Modal
 * İlan yayınlamadan önce son kontrol için önizleme modalı
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Eye, Briefcase, MapPin, Clock, GraduationCap, DollarSign, Calendar, Building2, FileText, Gift } from 'lucide-react';

const JobPreviewModal = ({ isOpen, onClose, jobData, departments, onPublish, isLoading, viewOnly = false }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-US' : 'tr-TR';

  if (!isOpen || !jobData) return null;

  // Find department name
  const department = departments?.find(d => d.id === jobData.departmentId);
  const departmentName = department?.name || t('jobPreview.notSpecified');

  // Format salary
  const formatSalary = () => {
    if (!jobData.salaryMin && !jobData.salaryMax) return t('jobPreview.notSpecified');
    if (jobData.salaryMin && jobData.salaryMax) {
      return `${jobData.salaryMin.toLocaleString(locale)} - ${jobData.salaryMax.toLocaleString(locale)} ${jobData.salaryCurrency}`;
    }
    if (jobData.salaryMin) return `${jobData.salaryMin.toLocaleString(locale)}+ ${jobData.salaryCurrency}`;
    if (jobData.salaryMax) return `${jobData.salaryMax.toLocaleString(locale)} ${t('jobPreview.upTo')} ${jobData.salaryCurrency}`;
  };

  // Format employment type - using translations
  const getEmploymentTypeLabel = () => {
    return t(`job.${jobData.employmentType === 'full-time' ? 'fullTime' : 
              jobData.employmentType === 'part-time' ? 'partTime' : 
              jobData.employmentType === 'contract' ? 'contract' : 
              jobData.employmentType === 'internship' ? 'internship' : jobData.employmentType}`);
  };

  // Format experience level - using translations
  const getExperienceLevelLabel = () => {
    return t(`job.${jobData.experienceLevel}`);
  };

  // Format remote policy - using translations
  const getRemotePolicyLabel = () => {
    return t(`job.${jobData.remotePolicy}`);
  };

  // Parse languages
  const languages = jobData.requiredLanguages ? 
    (typeof jobData.requiredLanguages === 'string' ? 
      JSON.parse(jobData.requiredLanguages || '{}') : 
      jobData.requiredLanguages) : {};

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: 20,
      overflowY: 'auto'
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        width: '100%',
        maxWidth: 900,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        margin: 'auto'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '2px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Eye size={24} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: 0 }}>
                {t('jobPreview.title')}
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', margin: '4px 0 0 0' }}>
                {t('jobPreview.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: 'none',
              background: 'rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            <X size={20} color="white" />
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 32
        }}>
          {/* Disabled Friendly Badge */}
          {jobData.isDisabledFriendly && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
              border: '2px solid #3B82F6',
              borderRadius: 12,
              marginBottom: 24,
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ fontSize: 28 }}>♿</span>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1E40AF' }}>
                  {t('jobForm.disabledFriendly')}
                </div>
                <div style={{ fontSize: 13, color: '#3B82F6' }}>
                  {t('jobForm.disabledFriendlyHint')}
                </div>
              </div>
            </div>
          )}

          {/* Job Title & Basic Info */}
          <div style={{
            marginBottom: 32,
            paddingBottom: 24,
            borderBottom: '1px solid #E5E7EB'
          }}>
            <h1 style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#1F2937',
              margin: '0 0 16px 0'
            }}>
              {jobData.title}
            </h1>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              marginTop: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={18} color="#667eea" />
                <div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{t('jobPreview.department')}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>
                    {departmentName}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={18} color="#667eea" />
                <div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{t('jobPreview.location')}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>
                    {jobData.location} • {getRemotePolicyLabel()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={18} color="#667eea" />
                <div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{t('jobPreview.employmentType')}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>
                    {getEmploymentTypeLabel()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <GraduationCap size={18} color="#667eea" />
                <div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{t('jobPreview.experience')}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>
                    {getExperienceLevelLabel()}
                  </div>
                </div>
              </div>

              {(jobData.salaryMin || jobData.salaryMax) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DollarSign size={18} color="#667eea" />
                  <div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{t('jobPreview.salaryRange')}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>
                      {formatSalary()}
                    </div>
                  </div>
                </div>
              )}

              {jobData.deadline && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={18} color="#667eea" />
                  <div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{t('jobPreview.deadline')}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>
                      {new Date(jobData.deadline).toLocaleDateString(locale)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Intro Text (Ön Yazı) */}
          {jobData.introText && (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#1F2937',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <FileText size={20} color="#6366F1" />
                {t('jobPreview.intro')}
              </h3>
              <div 
                dangerouslySetInnerHTML={{ __html: jobData.introText }}
                style={{
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: '#374151',
                  padding: 20,
                  background: '#EEF2FF',
                  borderRadius: 12,
                  border: '1px solid #C7D2FE'
                }}
              />
            </div>
          )}

          {/* Job Description */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#1F2937',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Briefcase size={20} color="#667eea" />
              {t('jobPreview.description')}
            </h3>
            <div 
              dangerouslySetInnerHTML={{ __html: jobData.description }}
              style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: '#374151',
                padding: 20,
                background: '#F9FAFB',
                borderRadius: 12,
                border: '1px solid #E5E7EB'
              }}
            />
          </div>

          {/* Requirements */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#1F2937',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <GraduationCap size={20} color="#667eea" />
              {t('jobPreview.requirements')}
            </h3>
            <div 
              dangerouslySetInnerHTML={{ __html: jobData.requirements }}
              style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: '#374151',
                padding: 20,
                background: '#F9FAFB',
                borderRadius: 12,
                border: '1px solid #E5E7EB'
              }}
            />
          </div>

          {/* Keywords */}
          {jobData.keywords && jobData.keywords.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#1F2937',
                marginBottom: 12
              }}>
                {t('jobPreview.keywords')}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(typeof jobData.keywords === 'string' ? 
                  jobData.keywords.split(',').map(k => k.trim()) : 
                  jobData.keywords
                ).filter(k => k).map((keyword, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '6px 14px',
                      background: '#EEF2FF',
                      color: '#667eea',
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 500
                    }}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {Object.keys(languages).length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#1F2937',
                marginBottom: 12
              }}>
                {t('jobPreview.languages')}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {Object.entries(languages).map(([name, level], idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 16px',
                      background: '#F0F9FF',
                      border: '1px solid #BAE6FD',
                      borderRadius: 8,
                      fontSize: 14
                    }}
                  >
                    <span style={{ fontWeight: 600, color: '#0369A1' }}>{name}</span>
                    <span style={{ color: '#6B7280', margin: '0 6px' }}>•</span>
                    <span style={{ color: '#0369A1' }}>{level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preferred Majors */}
          {jobData.preferredMajors && (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#1F2937',
                marginBottom: 12
              }}>
                {t('jobPreview.preferredMajors')}
              </h3>
              <p style={{
                fontSize: 14,
                color: '#374151',
                lineHeight: 1.6,
                padding: 12,
                background: '#F9FAFB',
                borderRadius: 8,
                margin: 0
              }}>
                {jobData.preferredMajors}
              </p>
            </div>
          )}

          {/* Outro Text (Sonuç Yazı / What We Offer) */}
          {jobData.outroText && (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#1F2937',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <Gift size={20} color="#10B981" />
                {jobData.outroTemplateName || t('jobPreview.outro')}
              </h3>
              <div 
                dangerouslySetInnerHTML={{ __html: jobData.outroText }}
                style={{
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: '#374151',
                  padding: 20,
                  background: '#ECFDF5',
                  borderRadius: 12,
                  border: '1px solid #A7F3D0'
                }}
              />
            </div>
          )}
        </div>

        {/* Footer - Action Buttons */}
        <div style={{
          padding: '20px 32px',
          borderTop: '2px solid #E5E7EB',
          display: 'flex',
          gap: 12,
          justifyContent: 'flex-end',
          background: '#F9FAFB'
        }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              border: '2px solid #E5E7EB',
              borderRadius: 10,
              background: 'white',
              color: '#374151',
              fontSize: 15,
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
          >
            {viewOnly ? t('jobPreview.close') : t('jobPreview.goBack')}
          </button>
          {!viewOnly && <button
            onClick={onPublish}
            disabled={isLoading}
            style={{
              padding: '12px 32px',
              border: 'none',
              borderRadius: 10,
              background: isLoading ? '#D1D5DB' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: 15,
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s',
              boxShadow: isLoading ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }
            }}
          >
            {isLoading ? (
              <>
                <div style={{
                  width: 16,
                  height: 16,
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite'
                }} />
                {t('jobPreview.publishing')}
              </>
            ) : (
              <>
                <Eye size={18} />
                {t('jobPreview.saveJob')}
              </>
            )}
          </button>}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default JobPreviewModal;
