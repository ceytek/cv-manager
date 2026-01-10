import { gql } from '@apollo/client';

export const JOB_INTRO_TEMPLATES_QUERY = gql`
  query JobIntroTemplates($activeOnly: Boolean) {
    jobIntroTemplates(activeOnly: $activeOnly) {
      id
      name
      content
      isActive
      creatorName
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_JOB_INTRO_TEMPLATE = gql`
  mutation CreateJobIntroTemplate($input: JobIntroTemplateInput!) {
    createJobIntroTemplate(input: $input) {
      success
      message
      template {
        id
        name
        content
        isActive
        creatorName
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_JOB_INTRO_TEMPLATE = gql`
  mutation UpdateJobIntroTemplate($id: String!, $input: JobIntroTemplateInput!) {
    updateJobIntroTemplate(id: $id, input: $input) {
      success
      message
      template {
        id
        name
        content
        isActive
        creatorName
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_JOB_INTRO_TEMPLATE = gql`
  mutation DeleteJobIntroTemplate($id: String!) {
    deleteJobIntroTemplate(id: $id) {
      success
      message
    }
  }
`;

export const TOGGLE_JOB_INTRO_TEMPLATE = gql`
  mutation ToggleJobIntroTemplate($id: String!) {
    toggleJobIntroTemplate(id: $id) {
      success
      message
      template {
        id
        name
        content
        isActive
      }
    }
  }
`;

