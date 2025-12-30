/**
 * GraphQL queries and mutations for CV-to-Job Applications (Analysis Results)
 */

import { gql } from '@apollo/client';

/**
 * Query to fetch applications (analysis results) for a specific job
 */
export const APPLICATIONS_QUERY = gql`
  query Applications($jobId: String, $candidateId: String, $status: String) {
    applications(jobId: $jobId, candidateId: $candidateId, status: $status) {
      id
      jobId
      candidateId
      analysisData
      overallScore
      status
      analyzedAt
      reviewedAt
      reviewedBy
      notes
      createdAt
      updatedAt
      hasInterviewSession
      hasLikertSession
      interviewSessionStatus
      likertSessionStatus
      rejectionNote
      rejectedAt
      rejectionTemplateId
      
      job {
        id
        title
        departmentId
        department { id name }
        location
        employmentType
        experienceLevel
        requiredEducation
        interviewEnabled
        likertEnabled
      }
      
      candidate {
        id
        name
        email
        phone
        cvFileName
        cvFilePath
        cvLanguage
        parsedData
        location
        birthYear
        experienceMonths
        cvPhotoPath
        status
        departmentId
        uploadedAt
        department {
          id
          name
        }
      }
    }
  }
`;

/**
 * Mutation to analyze candidates for a job
 */
export const ANALYZE_JOB_CANDIDATES_MUTATION = gql`
  mutation AnalyzeJobCandidates($input: AnalyzeJobCandidatesInput!, $language: String) {
    analyzeJobCandidates(input: $input, language: $language) {
      success
      message
    }
  }
`;

/**
 * Subscription to receive real-time application updates for a job
 */
export const APPLICATION_UPDATES_SUBSCRIPTION = gql`
  subscription ApplicationUpdates($jobId: String!) {
    applicationUpdates(jobId: $jobId) {
      id
      jobId
      candidateId
      analysisData
      overallScore
      status
      analyzedAt
      reviewedAt
      reviewedBy
      notes
      createdAt
      updatedAt
      rejectionNote
      rejectedAt
      rejectionTemplateId
      job { id title departmentId department { id name } }
      candidate { id name email phone cvFileName cvFilePath cvLanguage parsedData location birthYear experienceMonths cvPhotoPath status departmentId uploadedAt }
    }
  }
`;
