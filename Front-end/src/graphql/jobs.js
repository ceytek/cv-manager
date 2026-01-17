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
      department { id name color }
      introText
      outroText
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
      interviewEnabled
      interviewTemplateId
      interviewDeadlineHours
      agreementTemplateId
      likertEnabled
      likertTemplateId
      likertDeadlineHours
      isDisabledFriendly
      createdAt
      updatedAt
      analysisCount
      recentApplicants
    }
  }
`;

export const JOB_QUERY = gql`
  query Job($id: String!) {
    job(id: $id) {
      id
      title
      departmentId
      department { id name color }
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
      interviewEnabled
      interviewTemplateId
      interviewDeadlineHours
      interviewTemplate {
        id
        name
        questionCount
        language
      }
      agreementTemplateId
      likertEnabled
      likertTemplateId
      likertDeadlineHours
      likertTemplate {
        id
        name
        description
        scaleType
        questionCount
        language
      }
      isDisabledFriendly
      createdAt
      updatedAt
      analysisCount
      recentApplicants
    }
  }
`;

export const UPDATE_JOB_INTERVIEW_SETTINGS = gql`
  mutation UpdateJob($id: String!, $input: JobUpdateInput!) {
    updateJob(id: $id, input: $input) {
      id
      interviewEnabled
      interviewTemplateId
      interviewDeadlineHours
      agreementTemplateId
      likertEnabled
      likertTemplateId
      likertDeadlineHours
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
      introText
      outroText
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
      isDisabledFriendly
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
      introText
      outroText
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
      isDisabledFriendly
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
 * Mutation to delete a job
 */
export const DELETE_JOB_MUTATION = gql`
  mutation DeleteJob($id: String!) {
    deleteJob(id: $id) {
      success
      message
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
