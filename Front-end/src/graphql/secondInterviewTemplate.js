import { gql } from '@apollo/client';

// ============================================
// Queries
// ============================================

export const GET_SECOND_INTERVIEW_TEMPLATES = gql`
  query GetSecondInterviewTemplates($templateType: SecondInterviewTemplateTypeEnum) {
    secondInterviewTemplates(templateType: $templateType) {
      id
      name
      templateType
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

export const GET_SECOND_INTERVIEW_TEMPLATE = gql`
  query GetSecondInterviewTemplate($id: String!) {
    secondInterviewTemplate(id: $id) {
      id
      name
      templateType
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

export const GET_SECOND_INTERVIEW_TEMPLATE_VARIABLES = gql`
  query GetSecondInterviewTemplateVariables {
    secondInterviewTemplateVariables {
      onlineVariables {
        key
        labelTr
        labelEn
      }
      inPersonVariables {
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

export const CREATE_SECOND_INTERVIEW_TEMPLATE = gql`
  mutation CreateSecondInterviewTemplate($input: SecondInterviewTemplateInput!) {
    createSecondInterviewTemplate(input: $input) {
      success
      message
      template {
        id
        name
        templateType
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

export const UPDATE_SECOND_INTERVIEW_TEMPLATE = gql`
  mutation UpdateSecondInterviewTemplate($id: String!, $input: SecondInterviewTemplateUpdateInput!) {
    updateSecondInterviewTemplate(id: $id, input: $input) {
      success
      message
      template {
        id
        name
        templateType
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

export const DELETE_SECOND_INTERVIEW_TEMPLATE = gql`
  mutation DeleteSecondInterviewTemplate($id: String!) {
    deleteSecondInterviewTemplate(id: $id) {
      success
      message
    }
  }
`;

// ============================================
// Constants - Template Types
// ============================================

export const SECOND_INTERVIEW_TEMPLATE_TYPES = {
  ONLINE: 'ONLINE',
  IN_PERSON: 'IN_PERSON'
};

export const SECOND_INTERVIEW_TEMPLATE_TYPE_LABELS = {
  ONLINE: {
    tr: 'Online Görüşme',
    en: 'Online Meeting'
  },
  IN_PERSON: {
    tr: 'Yüz Yüze Görüşme',
    en: 'In-Person Meeting'
  }
};

// Default template content for new templates
export const DEFAULT_ONLINE_TEMPLATE = {
  subject_tr: '2. Görüşme Daveti - {position}',
  subject_en: 'Second Interview Invitation - {position}',
  body_tr: `Sayın {candidate_name},

{position} pozisyonu için yaptığımız ilk görüşme olumlu sonuçlanmıştır. 

Sizi 2. görüşmeye davet etmek istiyoruz:

📅 Tarih: {date}
🕐 Saat: {time}
💻 Platform: {platform}
🔗 Toplantı Linki: {meeting_link}

Görüşmek dileğiyle,
{company_name}`,
  body_en: `Dear {candidate_name},

We are pleased to inform you that your initial interview for the {position} position was successful.

We would like to invite you to a second interview:

📅 Date: {date}
🕐 Time: {time}
💻 Platform: {platform}
🔗 Meeting Link: {meeting_link}

Best regards,
{company_name}`
};

export const DEFAULT_IN_PERSON_TEMPLATE = {
  subject_tr: '2. Görüşme Daveti - {position}',
  subject_en: 'Second Interview Invitation - {position}',
  body_tr: `Sayın {candidate_name},

{position} pozisyonu için yaptığımız ilk görüşme olumlu sonuçlanmıştır. 

Sizi 2. görüşmeye davet etmek istiyoruz:

📅 Tarih: {date}
🕐 Saat: {time}
📍 Adres: {address_name}
   {address_detail}
🗺️ Harita: {google_maps_link}

Görüşmek dileğiyle,
{company_name}`,
  body_en: `Dear {candidate_name},

We are pleased to inform you that your initial interview for the {position} position was successful.

We would like to invite you to a second interview:

📅 Date: {date}
🕐 Time: {time}
📍 Location: {address_name}
   {address_detail}
🗺️ Map: {google_maps_link}

Best regards,
{company_name}`
};
