/**
 * GraphQL operations for Interview Templates
 */
import { gql } from '@apollo/client';

export const GET_INTERVIEW_TEMPLATES = gql`
  query InterviewTemplates {
    interviewTemplates {
      id
      name
      description
      introText
      language
      durationPerQuestion
      useGlobalTimer
      totalDuration
      aiAnalysisEnabled
      voiceResponseEnabled
      isAiGenerated
      isActive
      questionCount
      createdAt
      updatedAt
    }
  }
`;

export const GET_INTERVIEW_TEMPLATE = gql`
  query InterviewTemplate($id: String!) {
    interviewTemplate(id: $id) {
      id
      name
      description
      introText
      language
      durationPerQuestion
      useGlobalTimer
      totalDuration
      aiAnalysisEnabled
      voiceResponseEnabled
      isActive
      questionCount
      questions {
        id
        questionText
        questionOrder
        timeLimit
      }
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_INTERVIEW_TEMPLATE = gql`
  mutation CreateInterviewTemplate($input: InterviewTemplateInput!) {
    createInterviewTemplate(input: $input) {
      success
      message
      template {
        id
        name
        description
        introText
        language
        durationPerQuestion
        useGlobalTimer
        totalDuration
        aiAnalysisEnabled
        voiceResponseEnabled
        isActive
        questionCount
      }
    }
  }
`;

export const UPDATE_INTERVIEW_TEMPLATE = gql`
  mutation UpdateInterviewTemplate($id: String!, $input: InterviewTemplateInput!) {
    updateInterviewTemplate(id: $id, input: $input) {
      success
      message
      template {
        id
        name
        description
        introText
        language
        durationPerQuestion
        useGlobalTimer
        totalDuration
        aiAnalysisEnabled
        voiceResponseEnabled
        isActive
        questionCount
      }
    }
  }
`;

export const DELETE_INTERVIEW_TEMPLATE = gql`
  mutation DeleteInterviewTemplate($id: String!) {
    deleteInterviewTemplate(id: $id) {
      success
      message
    }
  }
`;

export const TOGGLE_INTERVIEW_TEMPLATE = gql`
  mutation ToggleInterviewTemplate($id: String!) {
    toggleInterviewTemplate(id: $id) {
      success
      message
      template {
        id
        isActive
      }
    }
  }
`;

export const GENERATE_INTERVIEW_QUESTIONS = gql`
  mutation GenerateInterviewQuestions($input: GenerateInterviewQuestionsInput!) {
    generateInterviewQuestions(input: $input) {
      success
      questions {
        text
        type
      }
      error
    }
  }
`;

export const REGENERATE_SINGLE_QUESTION = gql`
  mutation RegenerateSingleQuestion($input: RegenerateSingleQuestionInput!) {
    regenerateSingleQuestion(input: $input) {
      success
      question {
        text
        type
      }
      error
    }
  }
`;

