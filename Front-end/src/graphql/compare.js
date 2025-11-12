import { gql } from '@apollo/client';

export const COMPARE_CANDIDATES_QUERY = gql`
  query CompareCandidates($candidateId1: String!, $candidateId2: String!, $jobId: String, $language: String) {
    compareCandidates(candidateId1: $candidateId1, candidateId2: $candidateId2, jobId: $jobId, language: $language) {
      candidateA {
        name
        totalExperienceYears
        languages { language level }
        education { school department years }
        skills { common unique }
      }
      candidateB {
        name
        totalExperienceYears
        languages { language level }
        education { school department years }
        skills { common unique }
      }
      aiEvaluation {
        candidateA { strengths suitablePositions }
        candidateB { strengths suitablePositions }
      }
    }
  }
`;
