import { gql } from '@apollo/client';

export const STATS_QUERY = gql`
  query Stats {
    stats {
      candidateCount
      jobCount
      applicationCount
      departmentCount
    }
  }
`;

export const STATS_SUBSCRIPTION = gql`
  subscription StatsUpdates {
    statsUpdates {
      candidateCount
      jobCount
      applicationCount
      departmentCount
    }
  }
`;

export const DAILY_ACTIVITY_STATS_QUERY = gql`
  query DailyActivityStats($date: String) {
    dailyActivityStats(date: $date) {
      date
      cvUploads
      cvAnalyses
      interviewInvitations
      rejections
      likertInvitations
    }
  }
`;
