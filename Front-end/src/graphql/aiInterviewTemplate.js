import { gql } from '@apollo/client';

// ============================================
// AI Interview Email Template Queries
// ============================================

export const GET_AI_INTERVIEW_EMAIL_TEMPLATES = gql`
  query GetAIInterviewEmailTemplates($language: String, $activeOnly: Boolean) {
    aiInterviewEmailTemplates(language: $language, activeOnly: $activeOnly) {
      templates {
        id
        name
        subject
        body
        language
        isActive
        isDefault
        companyId
        createdBy
        createdAt
        updatedAt
      }
      variables {
        key
        labelTr
        labelEn
      }
    }
  }
`;

// ============================================
// AI Interview Email Template Mutations
// ============================================

export const CREATE_AI_INTERVIEW_EMAIL_TEMPLATE = gql`
  mutation CreateAIInterviewEmailTemplate($input: AIInterviewEmailTemplateInput!) {
    createAiInterviewEmailTemplate(input: $input) {
      success
      message
      template {
        id
        name
        subject
        body
        language
        isActive
        isDefault
        companyId
        createdBy
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_AI_INTERVIEW_EMAIL_TEMPLATE = gql`
  mutation UpdateAIInterviewEmailTemplate($id: String!, $input: AIInterviewEmailTemplateUpdateInput!) {
    updateAiInterviewEmailTemplate(id: $id, input: $input) {
      success
      message
      template {
        id
        name
        subject
        body
        language
        isActive
        isDefault
        companyId
        createdBy
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_AI_INTERVIEW_EMAIL_TEMPLATE = gql`
  mutation DeleteAIInterviewEmailTemplate($id: String!) {
    deleteAiInterviewEmailTemplate(id: $id) {
      success
      message
    }
  }
`;

// ============================================
// Default Templates (for initial creation)
// ============================================

export const DEFAULT_AI_INTERVIEW_TEMPLATE_TR = {
  name: 'Varsayılan AI Görüşme Daveti',
  subject: 'AI Görüşme Daveti - {position}',
  body: `Sayın {candidate_name},

{company_name} olarak {position} pozisyonu için başvurunuzu değerlendirdik ve sizi AI destekli görüşmemize davet etmekten mutluluk duyuyoruz.

Görüşme Detayları:
• Görüşme Linki: {interview_link}
• Son Geçerlilik: {expiry_date} - {expiry_time}
• Tahmini Süre: {duration}

Önemli Notlar:
- Görüşmeye sessiz ve rahat bir ortamda katılmanızı öneririz
- İnternet bağlantınızın stabil olduğundan emin olun
- Link tek kullanımlıktır ve belirtilen süre sonrasında geçerliliğini yitirecektir

Başarılar dileriz!

Saygılarımızla,
{company_name} İnsan Kaynakları Ekibi`,
  language: 'TR',
  isActive: true,
  isDefault: true,
};

export const DEFAULT_AI_INTERVIEW_TEMPLATE_EN = {
  name: 'Default AI Interview Invitation',
  subject: 'AI Interview Invitation - {position}',
  body: `Dear {candidate_name},

We at {company_name} have reviewed your application for the {position} position and are pleased to invite you to our AI-powered interview.

Interview Details:
• Interview Link: {interview_link}
• Expires: {expiry_date} - {expiry_time}
• Estimated Duration: {duration}

Important Notes:
- We recommend joining from a quiet and comfortable environment
- Please ensure you have a stable internet connection
- The link is single-use and will expire after the specified time

Best of luck!

Best regards,
{company_name} HR Team`,
  language: 'EN',
  isActive: true,
  isDefault: true,
};
