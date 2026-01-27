import { gql } from '@apollo/client';

// ============================================
// Queries
// ============================================

export const GET_LIKERT_TEMPLATES = gql`
  query GetLikertEmailTemplates {
    likertEmailTemplates {
      id
      name
      subject
      body
      language
      isActive
      isDefault
      createdAt
      updatedAt
    }
  }
`;

export const GET_LIKERT_TEMPLATE = gql`
  query GetLikertEmailTemplate($id: String!) {
    likertEmailTemplate(id: $id) {
      id
      name
      subject
      body
      language
      isActive
      isDefault
      createdAt
      updatedAt
    }
  }
`;

export const GET_LIKERT_TEMPLATE_VARIABLES = gql`
  query GetLikertEmailTemplateVariables {
    likertEmailTemplateVariables {
      variables {
        key
        labelTr
        labelEn
      }
    }
  }
`;

// ============================================
// Mutations
// ============================================

export const CREATE_LIKERT_TEMPLATE = gql`
  mutation CreateLikertTemplate($input: LikertEmailTemplateInput!) {
    createLikertTemplate(input: $input) {
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
        createdAt
      }
    }
  }
`;

export const UPDATE_LIKERT_TEMPLATE = gql`
  mutation UpdateLikertTemplate($id: String!, $input: LikertEmailTemplateUpdateInput!) {
    updateLikertTemplate(id: $id, input: $input) {
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
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_LIKERT_TEMPLATE = gql`
  mutation DeleteLikertTemplate($id: String!) {
    deleteLikertTemplate(id: $id) {
      success
      message
    }
  }
`;

// Default template content for new templates
export const DEFAULT_LIKERT_TEMPLATE = {
  subject_tr: 'Likert Testi Daveti - {position}',
  subject_en: 'Likert Test Invitation - {position}',
  body_tr: `Sayın {candidate_name},

{position} pozisyonu için başvurunuz değerlendirilmektedir.

Sürecin bir parçası olarak sizden kısa bir kişilik testi tamamlamanızı istiyoruz. Bu test yaklaşık 10-15 dakika sürmektedir.

🔗 Test Linki: {test_link}
📅 Son Geçerlilik: {expiry_date}

Lütfen linki kullanarak testi tamamlayınız.

Başarılar dileriz,
{company_name}`,
  body_en: `Dear {candidate_name},

Your application for the {position} position is being evaluated.

As part of the process, we would like you to complete a brief personality assessment. This test takes approximately 10-15 minutes.

🔗 Test Link: {test_link}
📅 Expires: {expiry_date}

Please use the link above to complete the assessment.

Best regards,
{company_name}`
};
