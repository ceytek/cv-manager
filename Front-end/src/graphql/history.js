import { gql } from '@apollo/client';

/**
 * GraphQL queries and mutations for Application History
 */

// Get all history entries for an application
export const GET_APPLICATION_HISTORY = gql`
  query GetApplicationHistory($applicationId: String!) {
    applicationHistory(applicationId: $applicationId) {
      success
      message
      total
      entries {
        id
        applicationId
        candidateId
        jobId
        actionTypeId
        performedBy
        performedByName
        actionData
        note
        createdAt
        actionType {
          id
          code
          nameTr
          nameEn
          description
          icon
          color
          isSystem
          sortOrder
        }
      }
    }
  }
`;

// Get last status for an application
export const GET_LAST_STATUS = gql`
  query GetLastStatus($applicationId: String!) {
    lastStatus(applicationId: $applicationId) {
      actionCode
      actionNameTr
      actionNameEn
      color
      icon
      createdAt
    }
  }
`;

// Get all available action types
export const GET_ACTION_TYPES = gql`
  query GetActionTypes {
    actionTypes {
      id
      code
      nameTr
      nameEn
      description
      icon
      color
      isSystem
      sortOrder
    }
  }
`;

// Add a history entry
export const ADD_HISTORY_ENTRY = gql`
  mutation AddHistoryEntry($input: CreateHistoryEntryInput!) {
    addHistoryEntry(input: $input) {
      success
      message
      entry {
        id
        createdAt
        actionType {
          code
          nameTr
          nameEn
        }
      }
    }
  }
`;

// Seed action types (admin)
export const SEED_ACTION_TYPES = gql`
  mutation SeedActionTypes {
    seedActionTypes {
      success
      message
    }
  }
`;

// Get recent activities across all applications
export const GET_RECENT_ACTIVITIES = gql`
  query GetRecentActivities($limit: Int = 10) {
    recentActivities(limit: $limit) {
      success
      message
      total
      activities {
        id
        applicationId
        candidateId
        candidateName
        candidateEmail
        jobId
        jobTitle
        actionCode
        actionNameTr
        actionNameEn
        color
        icon
        createdAt
      }
    }
  }
`;

