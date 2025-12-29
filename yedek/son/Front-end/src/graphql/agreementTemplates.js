/**
 * GraphQL operations for Agreement Templates
 */
import { gql } from '@apollo/client';

export const AGREEMENT_TEMPLATES_QUERY = gql`
  query AgreementTemplates {
    agreementTemplates {
      id
      name
      content
      isActive
      createdAt
      updatedAt
      creatorName
    }
  }
`;

export const AGREEMENT_TEMPLATE_QUERY = gql`
  query AgreementTemplate($id: String!) {
    agreementTemplate(id: $id) {
      id
      name
      content
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_AGREEMENT_TEMPLATE = gql`
  mutation CreateAgreementTemplate($input: AgreementTemplateInput!) {
    createAgreementTemplate(input: $input) {
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

export const UPDATE_AGREEMENT_TEMPLATE = gql`
  mutation UpdateAgreementTemplate($id: String!, $input: AgreementTemplateInput!) {
    updateAgreementTemplate(id: $id, input: $input) {
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

export const DELETE_AGREEMENT_TEMPLATE = gql`
  mutation DeleteAgreementTemplate($id: String!) {
    deleteAgreementTemplate(id: $id) {
      success
      message
    }
  }
`;

export const TOGGLE_AGREEMENT_TEMPLATE = gql`
  mutation ToggleAgreementTemplate($id: String!) {
    toggleAgreementTemplate(id: $id) {
      success
      message
      template {
        id
        isActive
      }
    }
  }
`;


