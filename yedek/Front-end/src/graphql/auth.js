import { gql } from '@apollo/client';

// MUTATIONS
export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      tokenType
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      tokenType
    }
  }
`;

export const FORGOT_PASSWORD_MUTATION = gql`
  mutation ForgotPassword($input: ForgotPasswordInput!) {
    forgotPassword(input: $input) {
      message
      success
    }
  }
`;

export const VERIFY_RESET_TOKEN_MUTATION = gql`
  mutation VerifyResetToken($input: VerifyResetTokenInput!) {
    verifyResetToken(input: $input) {
      message
      success
    }
  }
`;

export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
      message
      success
    }
  }
`;

export const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) {
      message
      success
    }
  }
`;

export const CREATE_USER_MUTATION = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      email
      fullName
  role
      isActive
      isVerified
      createdAt
      updatedAt
    }
  }
`;

export const DEACTIVATE_USER_MUTATION = gql`
  mutation DeactivateUser($userId: Int!) {
    deactivateUser(userId: $userId) {
      message
      success
    }
  }
`;

// QUERIES
export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      fullName
      role
      companyId
      roleId
      isActive
      isVerified
      createdAt
      updatedAt
    }
  }
`;

export const USERS_QUERY = gql`
  query Users {
    users {
      id
      fullName
      email
      role
      isActive
      isVerified
      createdAt
      updatedAt
    }
  }
`;
