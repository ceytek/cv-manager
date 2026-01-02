/**
 * GraphQL queries and mutations for Rejection Templates
 */
import { gql } from '@apollo/client';

// Get all rejection templates
export const GET_REJECTION_TEMPLATES = gql`
  query GetRejectionTemplates {
    rejectionTemplates {
      id
      name
      subject
      body
      language
      isActive
      isDefault
      createdAt
      updatedAt
    }
  }
`;

// Get single rejection template
export const GET_REJECTION_TEMPLATE = gql`
  query GetRejectionTemplate($id: String!) {
    rejectionTemplate(id: $id) {
      id
      name
      subject
      body
      language
      isActive
      isDefault
      createdAt
      updatedAt
    }
  }
`;

// Create rejection template
export const CREATE_REJECTION_TEMPLATE = gql`
  mutation CreateRejectionTemplate($input: RejectionTemplateInput!) {
    createRejectionTemplate(input: $input) {
      success
      message
      template {
        id
        name
        subject
        body
        language
        isActive
        isDefault
        createdAt
      }
    }
  }
`;

// Update rejection template
export const UPDATE_REJECTION_TEMPLATE = gql`
  mutation UpdateRejectionTemplate($id: String!, $input: RejectionTemplateInput!) {
    updateRejectionTemplate(id: $id, input: $input) {
      success
      message
      template {
        id
        name
        subject
        body
        language
        isActive
        isDefault
        createdAt
        updatedAt
      }
    }
  }
`;

// Delete rejection template
export const DELETE_REJECTION_TEMPLATE = gql`
  mutation DeleteRejectionTemplate($id: String!) {
    deleteRejectionTemplate(id: $id) {
      success
      message
    }
  }
`;


