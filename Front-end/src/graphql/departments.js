/**
 * GraphQL queries and mutations for Departments
 * Completely separate from auth/users
 */
import { gql } from '@apollo/client';

/**
 * Query to fetch all departments
 */
export const DEPARTMENTS_QUERY = gql`
  query Departments($includeInactive: Boolean = false) {
    departments(includeInactive: $includeInactive) {
      id
      name
      isActive
      color
      icon
      createdAt
      updatedAt
      jobCount
      candidateCount
    }
  }
`;

/**
 * Mutation to create a new department
 */
export const CREATE_DEPARTMENT_MUTATION = gql`
  mutation CreateDepartment($input: DepartmentInput!) {
    createDepartment(input: $input) {
      id
      name
      isActive
      color
      icon
      createdAt
      updatedAt
    }
  }
`;

/**
 * Mutation to update an existing department
 */
export const UPDATE_DEPARTMENT_MUTATION = gql`
  mutation UpdateDepartment($id: String!, $input: DepartmentUpdateInput!) {
    updateDepartment(id: $id, input: $input) {
      id
      name
      isActive
      color
      icon
      createdAt
      updatedAt
    }
  }
`;

/**
 * Mutation to toggle department active status
 */
export const TOGGLE_DEPARTMENT_ACTIVE_MUTATION = gql`
  mutation ToggleDepartmentActive($id: String!) {
    toggleDepartmentActive(id: $id) {
      id
      name
      isActive
      color
      icon
      createdAt
      updatedAt
    }
  }
`;

/**
 * Mutation to delete department permanently
 */
export const DELETE_DEPARTMENT_MUTATION = gql`
  mutation DeleteDepartment($id: String!) {
    deleteDepartment(id: $id)
  }
`;

/**
 * Query to check if department has related records
 */
export const DEPARTMENT_HAS_RELATED_RECORDS_QUERY = gql`
  query DepartmentHasRelatedRecords($id: String!) {
    departmentHasRelatedRecords(id: $id)
  }
`;
