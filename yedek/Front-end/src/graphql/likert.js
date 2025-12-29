/**
 * GraphQL operations for Likert Test feature
 */
import { gql } from '@apollo/client';

// ========== TEMPLATES ==========

export const GET_LIKERT_TEMPLATES = gql`
  query LikertTemplates {
    likertTemplates {
      id
      name
      description
      scaleType
      language
      isActive
      questionCount
      createdAt
      updatedAt
    }
  }
`;

export const GET_LIKERT_TEMPLATE = gql`
  query LikertTemplate($id: String!) {
    likertTemplate(id: $id) {
      id
      name
      description
      scaleType
      scaleLabels
      language
      isActive
      questionCount
      questions {
        id
        questionText
        questionOrder
        isReverseScored
      }
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_LIKERT_TEMPLATE = gql`
  mutation CreateLikertTemplate($input: LikertTemplateInput!) {
    createLikertTemplate(input: $input) {
      success
      message
      template {
        id
        name
        description
        scaleType
        language
        isActive
        questionCount
      }
    }
  }
`;

export const UPDATE_LIKERT_TEMPLATE = gql`
  mutation UpdateLikertTemplate($id: String!, $input: LikertTemplateInput!) {
    updateLikertTemplate(id: $id, input: $input) {
      success
      message
      template {
        id
        name
        description
        scaleType
        language
        isActive
        questionCount
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

export const TOGGLE_LIKERT_TEMPLATE = gql`
  mutation ToggleLikertTemplate($id: String!) {
    toggleLikertTemplate(id: $id) {
      success
      message
      template {
        id
        isActive
      }
    }
  }
`;

// ========== SESSIONS ==========

export const GET_LIKERT_SESSION = gql`
  query LikertSession($token: String!) {
    likertSession(token: $token) {
      id
      token
      status
      expiresAt
      startedAt
      completedAt
      totalScore
      createdAt
      template {
        id
        name
        description
        scaleType
        language
        questions {
          id
          questionText
          questionOrder
          isReverseScored
        }
      }
      job {
        id
        title
      }
      candidate {
        id
        name
      }
      answers {
        id
        questionId
        score
      }
    }
  }
`;

export const GET_LIKERT_SESSION_BY_APPLICATION = gql`
  query LikertSessionByApplication($applicationId: String!) {
    likertSessionByApplication(applicationId: $applicationId) {
      id
      token
      status
      expiresAt
      startedAt
      completedAt
      totalScore
      createdAt
      template {
        id
        name
        scaleType
        language
        questions {
          id
          questionText
          questionOrder
        }
      }
      job {
        id
        title
      }
      candidate {
        id
        name
      }
      answers {
        id
        questionId
        score
      }
    }
  }
`;

export const CREATE_LIKERT_SESSION = gql`
  mutation CreateLikertSession($input: CreateLikertSessionInput!) {
    createLikertSession(input: $input) {
      success
      message
      likertLink
      session {
        id
        token
        status
        expiresAt
      }
    }
  }
`;

export const START_LIKERT_SESSION = gql`
  mutation StartLikertSession($token: String!) {
    startLikertSession(token: $token) {
      success
      message
      session {
        id
        status
        startedAt
      }
    }
  }
`;

export const SAVE_LIKERT_ANSWER = gql`
  mutation SaveLikertAnswer($sessionToken: String!, $questionId: String!, $score: Int!) {
    saveLikertAnswer(sessionToken: $sessionToken, questionId: $questionId, score: $score) {
      success
      message
    }
  }
`;

export const COMPLETE_LIKERT_SESSION = gql`
  mutation CompleteLikertSession($token: String!) {
    completeLikertSession(token: $token) {
      success
      message
      session {
        id
        status
        completedAt
        totalScore
      }
    }
  }
`;

