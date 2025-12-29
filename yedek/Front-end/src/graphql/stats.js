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
