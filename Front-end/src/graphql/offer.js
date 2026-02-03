/**
 * GraphQL queries and mutations for Offer (Teklif) Module
 */

import { gql } from '@apollo/client';

// ============================================
// Offer Template Queries & Mutations
// ============================================

export const GET_OFFER_TEMPLATES = gql`
  query GetOfferTemplates($isActive: Boolean) {
    offerTemplates(isActive: $isActive) {
      id
      name
      introText
      outroText
      defaultValidityDays
      defaultBenefits {
        id
        name
        value
        valuePeriod
        isVariable
        category
        icon
      }
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const GET_OFFER_TEMPLATE = gql`
  query GetOfferTemplate($id: String!) {
    offerTemplate(id: $id) {
      id
      name
      introText
      outroText
      defaultValidityDays
      defaultBenefits {
        id
        name
        value
        valuePeriod
        isVariable
        category
        icon
      }
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_OFFER_TEMPLATE = gql`
  mutation CreateOfferTemplate($input: OfferTemplateInput!) {
    createOfferTemplate(input: $input) {
      success
      message
      template {
        id
        name
        introText
        outroText
        defaultValidityDays
        defaultBenefits {
          id
          name
          value
          valuePeriod
          isVariable
          category
          icon
        }
        isActive
        createdAt
      }
    }
  }
`;

export const UPDATE_OFFER_TEMPLATE = gql`
  mutation UpdateOfferTemplate($id: String!, $input: OfferTemplateInput!) {
    updateOfferTemplate(id: $id, input: $input) {
      success
      message
      template {
        id
        name
        introText
        outroText
        defaultValidityDays
        isActive
        updatedAt
      }
    }
  }
`;

export const DELETE_OFFER_TEMPLATE = gql`
  mutation DeleteOfferTemplate($id: String!) {
    deleteOfferTemplate(id: $id) {
      success
      message
    }
  }
`;

export const TOGGLE_OFFER_TEMPLATE = gql`
  mutation ToggleOfferTemplate($id: String!) {
    toggleOfferTemplate(id: $id) {
      success
      message
      template {
        id
        isActive
      }
    }
  }
`;

// ============================================
// Offer Queries & Mutations
// ============================================

export const GET_OFFERS = gql`
  query GetOffers($status: String) {
    offers(status: $status) {
      id
      applicationId
      templateId
      token
      status
      salaryGross
      salaryNet
      currency
      startDate
      validUntil
      introText
      outroText
      customNotes
      benefits {
        id
        name
        value
        valuePeriod
        isVariable
        category
        icon
      }
      pdfPath
      sentAt
      viewedAt
      respondedAt
      responseNote
      revisionCount
      createdAt
      updatedAt
      template {
        id
        name
      }
      candidateName
      candidateEmail
      jobTitle
    }
  }
`;

export const GET_OFFER = gql`
  query GetOffer($id: String!) {
    offer(id: $id) {
      id
      applicationId
      templateId
      token
      status
      salaryGross
      salaryNet
      currency
      startDate
      validUntil
      introText
      outroText
      customNotes
      benefits {
        id
        name
        value
        valuePeriod
        isVariable
        category
        icon
      }
      pdfPath
      sentAt
      viewedAt
      respondedAt
      responseNote
      revisionCount
      createdAt
      updatedAt
      template {
        id
        name
      }
      candidateName
      candidateEmail
      jobTitle
    }
  }
`;

export const GET_OFFER_BY_APPLICATION = gql`
  query GetOfferByApplication($applicationId: String!) {
    offerByApplication(applicationId: $applicationId) {
      id
      applicationId
      templateId
      token
      status
      salaryGross
      salaryNet
      currency
      startDate
      validUntil
      introText
      outroText
      customNotes
      benefits {
        id
        name
        value
        valuePeriod
        isVariable
        category
        icon
      }
      sentAt
      respondedAt
      responseNote
      candidateName
      jobTitle
      createdAt
    }
  }
`;

export const CREATE_OFFER = gql`
  mutation CreateOffer($input: OfferInput!) {
    createOffer(input: $input) {
      success
      message
      offer {
        id
        applicationId
        token
        status
        salaryGross
        salaryNet
        currency
        startDate
        validUntil
        createdAt
      }
    }
  }
`;

export const UPDATE_OFFER = gql`
  mutation UpdateOffer($id: String!, $input: OfferInput!) {
    updateOffer(id: $id, input: $input) {
      success
      message
      offer {
        id
        status
        salaryGross
        salaryNet
        currency
        startDate
        validUntil
        updatedAt
      }
    }
  }
`;

export const DELETE_OFFER = gql`
  mutation DeleteOffer($id: String!) {
    deleteOffer(id: $id) {
      success
      message
    }
  }
`;

export const SEND_OFFER = gql`
  mutation SendOffer($id: String!) {
    sendOffer(id: $id) {
      success
      message
      offer {
        id
        status
        sentAt
      }
    }
  }
`;

export const WITHDRAW_OFFER = gql`
  mutation WithdrawOffer($id: String!) {
    withdrawOffer(id: $id) {
      success
      message
      offer {
        id
        status
      }
    }
  }
`;

export const UPDATE_OFFER_STATUS = gql`
  mutation UpdateOfferStatus($offerId: String!, $status: String!, $note: String) {
    updateOfferStatus(offerId: $offerId, status: $status, note: $note) {
      success
      message
      offer {
        id
        status
        respondedAt
        responseNote
      }
    }
  }
`;

// ============================================
// Public (Candidate Portal) Queries & Mutations
// ============================================

export const GET_OFFER_BY_TOKEN = gql`
  query GetOfferByToken($token: String!) {
    offerByToken(token: $token) {
      id
      status
      companyName
      companyLogo
      jobTitle
      salaryGross
      salaryNet
      currency
      startDate
      validUntil
      introText
      outroText
      benefits {
        id
        name
        value
        valuePeriod
        isVariable
        category
        icon
      }
      pdfPath
      isExpired
      daysRemaining
    }
  }
`;

export const RESPOND_TO_OFFER = gql`
  mutation RespondToOffer($input: OfferResponseInput!) {
    respondToOffer(input: $input) {
      success
      message
    }
  }
`;

// ============================================
// Template Placeholders
// ============================================

export const OFFER_TEMPLATE_PLACEHOLDERS = {
  candidate_name: { 
    tr: 'Aday Adı', 
    en: 'Candidate Name', 
    placeholder: { tr: '{{aday_adi}}', en: '{{candidate_name}}' }
  },
  position: { 
    tr: 'Pozisyon', 
    en: 'Position', 
    placeholder: { tr: '{{pozisyon}}', en: '{{position}}' }
  },
  company: { 
    tr: 'Şirket Adı', 
    en: 'Company Name', 
    placeholder: { tr: '{{sirket}}', en: '{{company}}' }
  },
  start_date: { 
    tr: 'Başlangıç Tarihi', 
    en: 'Start Date', 
    placeholder: { tr: '{{baslangic_tarihi}}', en: '{{start_date}}' }
  },
  salary_gross: { 
    tr: 'Brüt Maaş', 
    en: 'Gross Salary', 
    placeholder: { tr: '{{brut_maas}}', en: '{{gross_salary}}' }
  },
  salary_net: { 
    tr: 'Net Maaş', 
    en: 'Net Salary', 
    placeholder: { tr: '{{net_maas}}', en: '{{net_salary}}' }
  },
  valid_until: { 
    tr: 'Son Kabul Tarihi', 
    en: 'Valid Until', 
    placeholder: { tr: '{{son_kabul_tarihi}}', en: '{{valid_until}}' }
  },
};

// Helper to get placeholder by language
export const getPlaceholder = (key, lang) => {
  const item = OFFER_TEMPLATE_PLACEHOLDERS[key];
  if (!item) return '';
  return item.placeholder[lang] || item.placeholder.tr;
};

// ============================================
// Offer Status Labels
// ============================================

export const OFFER_STATUS = {
  draft: { label: { tr: 'Taslak', en: 'Draft' }, color: '#6B7280', bgColor: '#F3F4F6' },
  sent: { label: { tr: 'Gönderildi', en: 'Sent' }, color: '#3B82F6', bgColor: '#EFF6FF' },
  accepted: { label: { tr: 'Kabul Edildi', en: 'Accepted' }, color: '#10B981', bgColor: '#D1FAE5' },
  rejected: { label: { tr: 'Reddedildi', en: 'Rejected' }, color: '#EF4444', bgColor: '#FEE2E2' },
  revision_requested: { label: { tr: 'Revizyon İstendi', en: 'Revision Requested' }, color: '#F59E0B', bgColor: '#FEF3C7' },
  revised: { label: { tr: 'Revize Edildi', en: 'Revised' }, color: '#8B5CF6', bgColor: '#EDE9FE' },
  expired: { label: { tr: 'Süresi Doldu', en: 'Expired' }, color: '#6B7280', bgColor: '#F3F4F6' },
  withdrawn: { label: { tr: 'Geri Çekildi', en: 'Withdrawn' }, color: '#6B7280', bgColor: '#F3F4F6' },
};
