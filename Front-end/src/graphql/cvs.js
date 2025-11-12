/**
 * GraphQL queries and mutations for CV Upload
 * Modular - separate from other features
 */
import { gql } from '@apollo/client';

/**
 * Query to get all candidates
 */
export const CANDIDATES_QUERY = gql`
  query Candidates($departmentId: String, $status: String) {
    candidates(departmentId: $departmentId, status: $status) {
      id
      name
      email
      phone
  location
  birthYear
  experienceMonths
      cvFileName
      cvFilePath
      cvFileSize
      cvLanguage
      status
      departmentId
      uploadedAt
      updatedAt
      department {
        id
        name
      }
    }
  }
`;

/**
 * Mutation to upload multiple CV files
 */
export const UPLOAD_CVS_MUTATION = gql`
  mutation UploadCVs($files: [Upload!]!, $departmentId: String!) {
    uploadCvs(files: $files, departmentId: $departmentId) {
      successful {
        fileName
        filePath
        fileSize
      }
      failed {
        fileName
        reason
      }
      totalUploaded
      totalFailed
    }
  }
`;
