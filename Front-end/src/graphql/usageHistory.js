import { gql } from '@apollo/client';

/**
 * Query to fetch usage history for a company
 * Uses idx_usage_tracking_company_resource index
 */
export const GET_USAGE_HISTORY = gql`
  query GetUsageHistory($resourceType: String!, $periodStart: String, $periodEnd: String) {
    getUsageHistory(resourceType: $resourceType, periodStart: $periodStart, periodEnd: $periodEnd) {
      id
      batchNumber
      resourceType
      count
      createdAt
      periodStart
      periodEnd
      metadata
    }
  }
`;

/**
 * Query to fetch detailed session data by batch number
 * Uses idx_candidates_batch_company and idx_applications_batch_company indexes
 */
export const GET_USAGE_SESSION_DETAIL = gql`
  query GetUsageSessionDetail($batchNumber: String!) {
    getUsageSessionDetail(batchNumber: $batchNumber) {
      batchNumber
      resourceType
      count
      createdAt
      candidates {
        id
        name
        email
        cvFileName
        status
        location
        uploadedAt
      }
      applications {
        id
        jobId
        candidateId
        overallScore
        status
        analyzedAt
        jobTitle
        candidateName
      }
    }
  }
`;

/**
 * Query to fetch only periods that have usage (aggregated)
 */
export const GET_USAGE_PERIODS = gql`
  query GetUsagePeriods {
    getUsagePeriods {
      label
      periodStart
      periodEnd
      totalCredits
      cvAnalyses
      cvUploads
      interviewCompleted
      interviewAIAnalysis
      aiQuestionGeneration
    }
  }
`;
