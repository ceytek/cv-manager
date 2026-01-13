import { gql } from '@apollo/client';

export const JOB_OUTRO_TEMPLATES_QUERY = gql`
  query JobOutroTemplates($activeOnly: Boolean) {
    jobOutroTemplates(activeOnly: $activeOnly) {
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

export const CREATE_JOB_OUTRO_TEMPLATE = gql`
  mutation CreateJobOutroTemplate($input: JobOutroTemplateInput!) {
    createJobOutroTemplate(input: $input) {
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

export const UPDATE_JOB_OUTRO_TEMPLATE = gql`
  mutation UpdateJobOutroTemplate($id: String!, $input: JobOutroTemplateInput!) {
    updateJobOutroTemplate(id: $id, input: $input) {
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

export const DELETE_JOB_OUTRO_TEMPLATE = gql`
  mutation DeleteJobOutroTemplate($id: String!) {
    deleteJobOutroTemplate(id: $id) {
      success
      message
    }
  }
`;

export const TOGGLE_JOB_OUTRO_TEMPLATE = gql`
  mutation ToggleJobOutroTemplate($id: String!) {
    toggleJobOutroTemplate(id: $id) {
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


