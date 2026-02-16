import { gql } from '@apollo/client';

// ============================================
// Tag Queries
// ============================================

export const GET_TALENT_POOL_TAGS = gql`
  query GetTalentPoolTags {
    talentPoolTags {
      id
      name
      color
      isSystem
      isActive
      usageCount
      createdAt
    }
  }
`;

// ============================================
// Entry Queries
// ============================================

export const GET_TALENT_POOL_ENTRIES = gql`
  query GetTalentPoolEntries($filter: TalentPoolFilterInput) {
    talentPoolEntries(filter: $filter) {
      id
      notes
      status
      addedAt
      updatedAt
      candidate {
        id
        name
        email
        phone
        cvPhotoPath
        cvFilePath
        location
        experienceMonths
        cvFileName
      }
      sourceJob {
        id
        title
      }
      addedBy {
        id
        name
      }
      tags {
        id
        name
        color
        isSystem
      }
    }
  }
`;

export const GET_TALENT_POOL_ENTRY = gql`
  query GetTalentPoolEntry($id: String!) {
    talentPoolEntry(id: $id) {
      id
      notes
      status
      addedAt
      updatedAt
      candidate {
        id
        name
        email
        phone
        cvPhotoPath
        cvFilePath
        location
        experienceMonths
        cvFileName
      }
      sourceJob {
        id
        title
      }
      addedBy {
        id
        name
      }
      tags {
        id
        name
        color
        isSystem
      }
    }
  }
`;

export const GET_TALENT_POOL_STATS = gql`
  query GetTalentPoolStats {
    talentPoolStats {
      totalCandidates
      activeCandidates
      archivedCandidates
      totalTags
    }
  }
`;

export const IS_CANDIDATE_IN_TALENT_POOL = gql`
  query IsCandidateInTalentPool($candidateId: String!) {
    isCandidateInTalentPool(candidateId: $candidateId)
  }
`;

// ============================================
// Tag Mutations
// ============================================

export const CREATE_TALENT_POOL_TAG = gql`
  mutation CreateTalentPoolTag($input: TalentPoolTagInput!) {
    createTalentPoolTag(input: $input) {
      success
      message
      tag {
        id
        name
        color
        isSystem
        isActive
        usageCount
        createdAt
      }
    }
  }
`;

export const UPDATE_TALENT_POOL_TAG = gql`
  mutation UpdateTalentPoolTag($id: String!, $input: TalentPoolTagUpdateInput!) {
    updateTalentPoolTag(id: $id, input: $input) {
      success
      message
      tag {
        id
        name
        color
        isSystem
        isActive
        usageCount
        createdAt
      }
    }
  }
`;

export const DELETE_TALENT_POOL_TAG = gql`
  mutation DeleteTalentPoolTag($id: String!) {
    deleteTalentPoolTag(id: $id) {
      success
      message
    }
  }
`;

// ============================================
// Entry Mutations
// ============================================

export const ADD_TO_TALENT_POOL = gql`
  mutation AddToTalentPool($input: TalentPoolEntryInput!) {
    addToTalentPool(input: $input) {
      success
      message
      entry {
        id
        notes
        status
        addedAt
        candidate {
          id
          name
        }
        tags {
          id
          name
          color
        }
      }
    }
  }
`;

export const BULK_ADD_TO_TALENT_POOL = gql`
  mutation BulkAddToTalentPool($input: TalentPoolBulkAddInput!) {
    bulkAddToTalentPool(input: $input) {
      success
      message
      addedCount
      skippedCount
    }
  }
`;

export const UPDATE_TALENT_POOL_ENTRY = gql`
  mutation UpdateTalentPoolEntry($id: String!, $input: TalentPoolEntryUpdateInput!) {
    updateTalentPoolEntry(id: $id, input: $input) {
      success
      message
      entry {
        id
        notes
        tags {
          id
          name
          color
        }
      }
    }
  }
`;

export const ARCHIVE_TALENT_POOL_ENTRY = gql`
  mutation ArchiveTalentPoolEntry($id: String!) {
    archiveTalentPoolEntry(id: $id) {
      success
      message
      entry {
        id
        status
      }
    }
  }
`;

export const RESTORE_TALENT_POOL_ENTRY = gql`
  mutation RestoreTalentPoolEntry($id: String!) {
    restoreTalentPoolEntry(id: $id) {
      success
      message
      entry {
        id
        status
      }
    }
  }
`;

export const REMOVE_FROM_TALENT_POOL = gql`
  mutation RemoveFromTalentPool($id: String!) {
    removeFromTalentPool(id: $id) {
      success
      message
    }
  }
`;

export const ASSIGN_TO_JOB_FROM_POOL = gql`
  mutation AssignToJobFromPool($input: TalentPoolAssignToJobInput!) {
    assignToJobFromPool(input: $input) {
      success
      message
      entry {
        id
      }
    }
  }
`;
