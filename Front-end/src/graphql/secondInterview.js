/**
 * GraphQL operations for Second Interview (2. Görüşme) feature
 * HR tarafından yapılan manuel görüşme yönetimi
 */
import { gql } from '@apollo/client';

// ============================================
// Fragments
// ============================================

const SECOND_INTERVIEW_FRAGMENT = gql`
  fragment SecondInterviewFields on SecondInterviewType {
    id
    interviewType
    platform
    meetingLink
    locationAddress
    scheduledDate
    scheduledTime
    candidateMessage
    invitationSentAt
    status
    outcome
    feedbackNotes
    feedbackAt
    feedbackBy {
      id
      fullName
    }
    createdAt
    updatedAt
    application {
      id
      overallScore
      candidate {
        id
        name
        email
        phone
        cvPhotoPath
      }
      job {
        id
        title
      }
    }
  }
`;

// ============================================
// Queries
// ============================================

/**
 * Get a single second interview by ID
 */
export const GET_SECOND_INTERVIEW = gql`
  ${SECOND_INTERVIEW_FRAGMENT}
  query GetSecondInterview($id: String!) {
    secondInterview(id: $id) {
      ...SecondInterviewFields
    }
  }
`;

/**
 * Get second interview for a specific application
 */
export const GET_SECOND_INTERVIEW_BY_APPLICATION = gql`
  ${SECOND_INTERVIEW_FRAGMENT}
  query GetSecondInterviewByApplication($applicationId: String!) {
    secondInterviewByApplication(applicationId: $applicationId) {
      ...SecondInterviewFields
    }
  }
`;

/**
 * Get all interviews for a specific application
 */
export const GET_ALL_INTERVIEWS_BY_APPLICATION = gql`
  ${SECOND_INTERVIEW_FRAGMENT}
  query GetAllInterviewsByApplication($applicationId: String!) {
    allInterviewsByApplication(applicationId: $applicationId) {
      ...SecondInterviewFields
    }
  }
`;

/**
 * Check if there's an active interview for a specific application
 */
export const CHECK_ACTIVE_INTERVIEW = gql`
  ${SECOND_INTERVIEW_FRAGMENT}
  query CheckActiveInterview($applicationId: String!) {
    checkActiveInterview(applicationId: $applicationId) {
      ...SecondInterviewFields
    }
  }
`;

/**
 * Get all second interviews for a specific job
 */
export const GET_SECOND_INTERVIEWS_BY_JOB = gql`
  ${SECOND_INTERVIEW_FRAGMENT}
  query GetSecondInterviewsByJob($jobId: String!) {
    secondInterviewsByJob(jobId: $jobId) {
      ...SecondInterviewFields
    }
  }
`;

// ============================================
// Mutations
// ============================================

/**
 * Send second interview invitation to a candidate
 * Creates a new SecondInterview record and updates application status
 */
export const SEND_SECOND_INTERVIEW_INVITE = gql`
  ${SECOND_INTERVIEW_FRAGMENT}
  mutation SendSecondInterviewInvite($input: SecondInterviewInviteInput!) {
    sendSecondInterviewInvite(input: $input) {
      success
      message
      secondInterview {
        ...SecondInterviewFields
      }
    }
  }
`;

/**
 * Submit feedback for a completed second interview
 * Updates status and outcome based on HR's assessment
 */
export const SUBMIT_SECOND_INTERVIEW_FEEDBACK = gql`
  ${SECOND_INTERVIEW_FRAGMENT}
  mutation SubmitSecondInterviewFeedback($input: SecondInterviewFeedbackInput!) {
    submitSecondInterviewFeedback(input: $input) {
      success
      message
      secondInterview {
        ...SecondInterviewFields
      }
    }
  }
`;

/**
 * Cancel a second interview
 * Only allowed if interview is not completed
 */
export const CANCEL_SECOND_INTERVIEW = gql`
  ${SECOND_INTERVIEW_FRAGMENT}
  mutation CancelSecondInterview($id: String!) {
    cancelSecondInterview(id: $id) {
      success
      message
      secondInterview {
        ...SecondInterviewFields
      }
    }
  }
`;

// ============================================
// Constants
// ============================================

/**
 * Interview type options
 */
export const INTERVIEW_TYPES = {
  ONLINE: 'online',
  IN_PERSON: 'in_person',
};

/**
 * Online meeting platform options
 */
export const INTERVIEW_PLATFORMS = {
  ZOOM: 'zoom',
  TEAMS: 'teams',
  GOOGLE_MEET: 'google_meet',
};

/**
 * Interview status options
 */
export const INTERVIEW_STATUS = {
  INVITED: 'invited',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
};

/**
 * Interview outcome options
 */
export const INTERVIEW_OUTCOME = {
  PENDING: 'pending',
  PASSED: 'passed',
  REJECTED: 'rejected',
  PENDING_LIKERT: 'pending_likert',
};
