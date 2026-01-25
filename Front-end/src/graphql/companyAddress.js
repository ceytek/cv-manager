import { gql } from '@apollo/client';

// ============================================
// Queries
// ============================================

export const GET_COMPANY_ADDRESSES = gql`
  query GetCompanyAddresses($includeInactive: Boolean) {
    companyAddresses(includeInactive: $includeInactive) {
      id
      name
      address
      googleMapsLink
      city
      district
      postalCode
      isDefault
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const GET_COMPANY_ADDRESS = gql`
  query GetCompanyAddress($id: String!) {
    companyAddress(id: $id) {
      id
      name
      address
      googleMapsLink
      city
      district
      postalCode
      isDefault
      isActive
      createdAt
      updatedAt
    }
  }
`;

// ============================================
// Mutations
// ============================================

export const CREATE_COMPANY_ADDRESS = gql`
  mutation CreateCompanyAddress($input: CompanyAddressInput!) {
    createCompanyAddress(input: $input) {
      success
      message
      address {
        id
        name
        address
        googleMapsLink
        city
        district
        postalCode
        isDefault
        isActive
      }
    }
  }
`;

export const UPDATE_COMPANY_ADDRESS = gql`
  mutation UpdateCompanyAddress($input: CompanyAddressUpdateInput!) {
    updateCompanyAddress(input: $input) {
      success
      message
      address {
        id
        name
        address
        googleMapsLink
        city
        district
        postalCode
        isDefault
        isActive
      }
    }
  }
`;

export const DELETE_COMPANY_ADDRESS = gql`
  mutation DeleteCompanyAddress($id: String!) {
    deleteCompanyAddress(id: $id) {
      success
      message
    }
  }
`;
