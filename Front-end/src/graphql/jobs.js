/**
 * GraphQL queries and mutations for Jobs
 * Completely separate from auth/users/departments
 */
import { gql } from '@apollo/client';

/**
 * Query to fetch all jobs with optional filters
 */
export const JOBS_QUERY = gql`
  query Jobs(
    $includeInactive: Boolean = false
    $status: String
    $departmentId: String
    $searchTerm: String
  ) {
    jobs(
      includeInactive: $includeInactive
      status: $status
      departmentId: $departmentId
      searchTerm: $searchTerm
    ) {
      id
      title
      departmentId
  department { id name }
      description
      descriptionPlain
      requirements
      requirementsPlain
      keywords
      location
      remotePolicy
      employmentType
      experienceLevel
      requiredEducation
      preferredMajors
      requiredLanguages
      salaryMin
      salaryMax
      salaryCurrency
      deadline
      startDate
      status
      isActive
      createdAt
      updatedAt
  analysisCount
    }
  }
`;

/**
 * Mutation to create a new job
 */
export const CREATE_JOB_MUTATION = gql`
  mutation CreateJob($input: JobInput!) {
    createJob(input: $input) {
      id
      title
      departmentId
      description
      descriptionPlain
      requirements
      requirementsPlain
      keywords
      location
      remotePolicy
      employmentType
      experienceLevel
      requiredEducation
      preferredMajors
      requiredLanguages
      salaryMin
      salaryMax
      salaryCurrency
      deadline
      startDate
      status
      isActive
      createdAt
      updatedAt
    }
  }
`;

/**
 * Mutation to update an existing job
 */
export const UPDATE_JOB_MUTATION = gql`
  mutation UpdateJob($id: String!, $input: JobUpdateInput!) {
    updateJob(id: $id, input: $input) {
      id
      title
      departmentId
      description
      descriptionPlain
      requirements
      requirementsPlain
      keywords
      location
      remotePolicy
      employmentType
      experienceLevel
      requiredEducation
      preferredMajors
      requiredLanguages
      salaryMin
      salaryMax
      salaryCurrency
      deadline
      startDate
      status
      isActive
      createdAt
      updatedAt
    }
  }
`;

/**
 * Mutation to toggle job active status
 */
export const TOGGLE_JOB_ACTIVE_MUTATION = gql`
  mutation ToggleJobActive($id: String!) {
    toggleJobActive(id: $id) {
      id
      title
      status
      isActive
      updatedAt
    }
  }
`;

/**
 * Mutation to generate job description with AI
 */
export const GENERATE_JOB_WITH_AI_MUTATION = gql`
  mutation GenerateJobWithAI($input: GenerateJobWithAIInput!) {
    generateJobWithAi(input: $input) {
      success
      jobData
      message
    }
  }
`;
