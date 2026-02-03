import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Bot, 
  BarChart3, 
  FileText, 
  FileOutput,
  ScrollText,
  Gift,
  ArrowRight
} from 'lucide-react';

const ContentHubPage = ({ onNavigate }) => {
  const { t } = useTranslation();

  const categories = [
    {
      id: 'assessment',
      title: t('templates.categoryAssessment', 'Değerlendirme'),
      cards: [
        {
          id: 'interviewTemplates',
          icon: Bot,
          title: t('templates.interviewTemplates', 'AI Mülakat Testleri'),
          description: t('contentHub.interviewDesc', 'Yapay zeka destekli mülakat soru şablonları'),
          color: '#3B82F6',
          bgColor: '#EFF6FF'
        },
        {
          id: 'likertTemplates',
          icon: BarChart3,
          title: t('templates.likertTemplates', 'Likert Testleri'),
          description: t('contentHub.likertDesc', 'Kişilik ve uyumluluk değerlendirme testleri'),
          color: '#10B981',
          bgColor: '#ECFDF5'
        }
      ]
    },
    {
      id: 'content',
      title: t('templates.categoryContent', 'İçerikler'),
      cards: [
        {
          id: 'jobIntroTemplates',
          icon: FileText,
          title: t('templates.jobIntroTemplates', 'İlan Tanıtımları'),
          description: t('contentHub.jobIntroDesc', 'Şirket tanıtım ve ilan giriş metinleri'),
          color: '#8B5CF6',
          bgColor: '#F5F3FF'
        },
        {
          id: 'jobOutroTemplates',
          icon: FileOutput,
          title: t('templates.jobOutroTemplates', 'İlan Sonuçları'),
          description: t('contentHub.jobOutroDesc', 'Sunduklarımız ve yan haklar metinleri'),
          color: '#F59E0B',
          bgColor: '#FFFBEB'
        }
      ]
    },
    {
      id: 'documents',
      title: t('templates.categoryDocuments', 'Belgeler'),
      cards: [
        {
          id: 'agreementTemplates',
          icon: ScrollText,
          title: t('templates.agreementTemplates', 'Sözleşme Şablonları'),
          description: t('contentHub.agreementDesc', 'KVKK ve gizlilik sözleşmeleri'),
          color: '#EC4899',
          bgColor: '#FDF2F8'
        },
        {
          id: 'offerTemplates',
          icon: Gift,
          title: t('templates.offerTemplates', 'Teklif Şablonları'),
          description: t('contentHub.offerDesc', 'İş teklifi mektup şablonları'),
          color: '#14B8A6',
          bgColor: '#F0FDFA'
        }
      ]
    }
  ];

  return (
    <div style={{ padding: '0 0 32px 0' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ 
          fontSize: 24, 
          fontWeight: 700, 
          color: '#111827',
          margin: 0,
          marginBottom: 8
        }}>
          {t('contentHub.title', 'İçerik Merkezi')}
        </h1>
        <p style={{ 
          fontSize: 14, 
          color: '#6B7280',
          margin: 0
        }}>
          {t('contentHub.subtitle', 'Şablonlarınızı ve içeriklerinizi yönetin')}
        </p>
      </div>

      {/* Categories */}
      {categories.map(category => (
        <div key={category.id} style={{ marginBottom: 32 }}>
          {/* Category Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16
          }}>
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {category.title}
            </span>
            <div style={{
              flex: 1,
              height: 1,
              background: '#E5E7EB'
            }} />
          </div>

          {/* Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20
          }}>
            {category.cards.map(card => {
              const IconComponent = card.icon;
              return (
                <div
                  key={card.id}
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: 24,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    border: '1px solid #E5E7EB',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onClick={() => onNavigate?.(card.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    e.currentTarget.style.borderColor = card.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    background: card.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16
                  }}>
                    <IconComponent size={26} color={card.color} strokeWidth={1.5} />
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#111827',
                    margin: 0,
                    marginBottom: 6
                  }}>
                    {card.title}
                  </h3>

                  {/* Description */}
                  <p style={{
                    fontSize: 13,
                    color: '#6B7280',
                    margin: 0,
                    marginBottom: 16,
                    lineHeight: 1.5
                  }}>
                    {card.description}
                  </p>

                  {/* Action Button */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: card.color
                    }}
                  >
                    {t('contentHub.manage', 'YÖNET')}
                    <ArrowRight size={14} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContentHubPage;
