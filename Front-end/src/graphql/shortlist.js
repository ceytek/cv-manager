/**
 * GraphQL queries and mutations for Shortlist (Long List / Short List) feature
 * 
 * Flow:
 * - Tümü (Pool) → Long List'e Ekle → Long List
 * - Long List → Short List'e Ekle → Short List
 * - Long List → Long List'ten Çıkar → Tümü
 * - Short List → Short List'ten Çıkar → Tümü
 */

import { gql } from '@apollo/client';

// ============================================
// Longlist Toggle Mutations
// ============================================

export const TOGGLE_LONGLIST = gql`
  mutation ToggleLonglist($input: LonglistToggleInput!) {
    toggleLonglist(input: $input) {
      success
      message
      applicationId
      isInLonglist
    }
  }
`;

export const BULK_TOGGLE_LONGLIST = gql`
  mutation BulkToggleLonglist($input: BulkLonglistInput!) {
    bulkToggleLonglist(input: $input) {
      success
      message
      updatedCount
      applicationIds
    }
  }
`;

// ============================================
// Shortlist Toggle Mutations
// ============================================

export const TOGGLE_SHORTLIST = gql`
  mutation ToggleShortlist($input: ShortlistToggleInput!) {
    toggleShortlist(input: $input) {
      success
      message
      applicationId
      isShortlisted
    }
  }
`;

export const BULK_TOGGLE_SHORTLIST = gql`
  mutation BulkToggleShortlist($input: BulkShortlistInput!) {
    bulkToggleShortlist(input: $input) {
      success
      message
      updatedCount
      applicationIds
    }
  }
`;

// ============================================
// Shortlist Share Queries & Mutations
// ============================================

export const GET_SHORTLIST_SHARES = gql`
  query GetShortlistShares($jobId: String, $listType: String) {
    shortlistShares(jobId: $jobId, listType: $listType) {
      id
      jobId
      token
      title
      message
      expiresAt
      isActive
      createdAt
      viewedAt
      viewCount
      shareUrl
      isExpired
      listType
      jobTitle
      shortlistedCount
      creatorName
    }
  }
`;

export const GET_SHORTLIST_SHARE = gql`
  query GetShortlistShare($id: String!) {
    shortlistShare(id: $id) {
      id
      jobId
      token
      title
      message
      expiresAt
      isActive
      createdAt
      viewedAt
      viewCount
      shareUrl
      isExpired
      jobTitle
      shortlistedCount
      creatorName
    }
  }
`;

export const CREATE_SHORTLIST_SHARE = gql`
  mutation CreateShortlistShare($input: ShortlistShareInput!) {
    createShortlistShare(input: $input) {
      success
      message
      share {
        id
        jobId
        token
        title
        shareUrl
        expiresAt
        listType
        shortlistedCount
      }
    }
  }
`;

export const DELETE_SHORTLIST_SHARE = gql`
  mutation DeleteShortlistShare($id: String!) {
    deleteShortlistShare(id: $id) {
      success
      message
    }
  }
`;

// ============================================
// Public Shortlist Query (for Hiring Manager)
// ============================================

export const GET_PUBLIC_SHORTLIST = gql`
  query GetPublicShortlist($token: String!) {
    publicShortlist(token: $token) {
      id
      title
      message
      jobTitle
      jobLocation
      jobDepartment
      companyName
      companyLogo
      listType
      candidates {
        id
        name
        email
        phone
        overallScore
        shortlistNote
        shortlistedAt
        experienceSummary
        educationSummary
        skills
        location
        cvUrl
      }
      candidateCount
      createdAt
      expiresAt
      isExpired
    }
  }
`;

// ============================================
// List Types for filtering
// ============================================

export const LIST_TYPES = {
  ALL: 'all',
  LONG_LIST: 'longlist',
  SHORT_LIST: 'shortlist',
  OFFER: 'offer',
  HIRED: 'hired',
};

export const LIST_TYPE_LABELS = {
  tr: {
    all: 'Tümü',
    longlist: 'Long List',
    shortlist: 'Short List',
    offer: 'Teklif Verilenler',
    hired: 'İşe Alınanlar',
  },
  en: {
    all: 'All',
    longlist: 'Long List',
    shortlist: 'Short List',
    offer: 'Offer',
    hired: 'Hired',
  },
};
