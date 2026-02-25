import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Bot, 
  Video, 
  ClipboardList, 
  XCircle, 
  Handshake, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

const MessageTemplatesPage = ({ onNavigate }) => {
  const { t } = useTranslation();

  const cards = [
    {
      id: 'firstInterview',
      icon: Bot,
      title: t('interviewMessages.firstInterview', 'AI Görüşmesi'),
      description: t('messageTemplates.aiInterviewDesc', 'Yapay zeka destekli mülakat mesajları'),
      color: '#3B82F6',
      bgColor: '#EFF6FF'
    },
    {
      id: 'secondInterview',
      icon: Video,
      title: t('interviewMessages.secondInterview', 'Yüzyüze/Online Mülakat'),
      description: t('messageTemplates.secondInterviewDesc', 'Görüşme daveti ve planlama şablonları'),
      color: '#8B5CF6',
      bgColor: '#F5F3FF'
    },
    {
      id: 'likertTest',
      icon: ClipboardList,
      title: t('interviewMessages.likertTest', 'Likert Test'),
      description: t('messageTemplates.likertTestDesc', 'Değerlendirme ve envanter gönderimleri'),
      color: '#10B981',
      bgColor: '#ECFDF5'
    },
    {
      id: 'rejectionTemplates',
      icon: XCircle,
      title: t('interviewMessages.rejection', 'Red Mesajı'),
      description: t('messageTemplates.rejectionDesc', 'Olumsuz aday bilgilendirme metinleri'),
      color: '#EF4444',
      bgColor: '#FEF2F2'
    },
    {
      id: 'offer',
      icon: Handshake,
      title: t('interviewMessages.offer', 'Teklif'),
      description: t('messageTemplates.offerDesc', 'İş teklif mektupları ve onay süreçleri'),
      color: '#F59E0B',
      bgColor: '#FFFBEB',
    },
    {
      id: 'confirmation',
      icon: CheckCircle2,
      title: t('interviewMessages.confirmation', 'Onay'),
      description: t('messageTemplates.confirmationDesc', 'Kullanıcı ve yönetici onay mesajları'),
      color: '#8B5CF6',
      bgColor: '#F5F3FF',
      disabled: true
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
          {t('messageTemplates.title', 'Mesaj Şablonları')}
        </h1>
        <p style={{ 
          fontSize: 14, 
          color: '#6B7280',
          margin: 0
        }}>
          {t('messageTemplates.subtitle', 'Aday iletişim şablonlarını yönetin ve düzenleyin')}
        </p>
      </div>

      {/* Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 24
      }}>
        {cards.map(card => {
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
                opacity: card.disabled ? 0.6 : 1,
                cursor: card.disabled ? 'not-allowed' : 'default'
              }}
            >
              {/* Icon */}
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: card.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20
              }}>
                <IconComponent size={28} color={card.color} strokeWidth={1.5} />
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: 18,
                fontWeight: 600,
                color: '#111827',
                margin: 0,
                marginBottom: 8
              }}>
                {card.title}
              </h3>

              {/* Description */}
              <p style={{
                fontSize: 14,
                color: '#6B7280',
                margin: 0,
                marginBottom: 20,
                lineHeight: 1.5
              }}>
                {card.description}
              </p>

              {/* Action Button */}
              <button
                onClick={() => !card.disabled && onNavigate?.(card.id)}
                disabled={card.disabled}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  color: card.disabled ? '#9CA3AF' : card.color,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: card.disabled ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!card.disabled) e.target.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  if (!card.disabled) e.target.style.opacity = '1';
                }}
              >
                {t('messageTemplates.manage', 'YÖNET')}
                <ArrowRight size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MessageTemplatesPage;
