/**
 * GraphQL operations for AI Interview feature
 */
import { gql } from '@apollo/client';

// Query to get interview session by token (public - no auth required)
export const GET_INTERVIEW_SESSION = gql`
  query InterviewSession($token: String!) {
    interviewSession(token: $token) {
      id
      jobId
      candidateId
      applicationId
      token
      status
      expiresAt
      startedAt
      completedAt
      createdAt
      agreementAcceptedAt
      job {
        id
        title
        description
        interviewEnabled
        interviewDurationPerQuestion
        interviewTotalQuestions
        interviewDeadlineHours
        interviewIntroText
        interviewLanguage
        useGlobalTimer
        totalDuration
        agreementTemplateId
        agreementTemplate {
          id
          name
          content
        }
      }
      candidate {
        id
        name
        cvPhotoPath
        cvLanguage
      }
      questions {
        id
        questionText
        questionOrder
        timeLimit
        isAiGenerated
      }
    }
  }
`;

// Query to get interview session by application ID (HR view)
export const GET_INTERVIEW_SESSION_BY_APPLICATION = gql`
  query InterviewSessionByApplication($applicationId: String!) {
    interviewSessionByApplication(applicationId: $applicationId) {
      id
      token
      status
      expiresAt
      startedAt
      completedAt
      invitationSentAt
      createdAt
      template {
        id
        name
        description
        language
        durationPerQuestion
        useGlobalTimer
        totalDuration
        questionCount
      }
      job {
        id
        title
        interviewLanguage
        useGlobalTimer
        totalDuration
      }
      candidate {
        id
        name
      }
      answers {
        id
        questionId
        questionText
        questionOrder
        answerText
        createdAt
      }
    }
  }
`;

// Mutation to create an interview session/invitation
export const CREATE_INTERVIEW_SESSION = gql`
  mutation CreateInterviewSession($input: CreateInterviewSessionInput!) {
    createInterviewSession(input: $input) {
      success
      message
      interviewLink
      session {
        id
        token
        status
        expiresAt
      }
    }
  }
`;

// Mutation to start an interview session
export const START_INTERVIEW_SESSION = gql`
  mutation StartInterviewSession($token: String!) {
    startInterviewSession(token: $token) {
      success
      message
      session {
        id
        token
        status
        startedAt
      }
    }
  }
`;

// Mutation to save an interview answer
export const SAVE_INTERVIEW_ANSWER = gql`
  mutation SaveInterviewAnswer($input: SaveInterviewAnswerInput!) {
    saveInterviewAnswer(input: $input) {
      success
      message
      answer {
        id
        sessionId
        questionId
        answerText
        createdAt
      }
    }
  }
`;

// Mutation to complete an interview session
export const COMPLETE_INTERVIEW_SESSION = gql`
  mutation CompleteInterviewSession($token: String!) {
    completeInterviewSession(token: $token) {
      success
      message
      session {
        id
        token
        status
        completedAt
      }
    }
  }
`;

// Mutation to accept interview agreement
export const ACCEPT_INTERVIEW_AGREEMENT = gql`
  mutation AcceptInterviewAgreement($token: String!) {
    acceptInterviewAgreement(token: $token) {
      success
      message
      session {
        id
        agreementAcceptedAt
      }
    }
  }
`;

