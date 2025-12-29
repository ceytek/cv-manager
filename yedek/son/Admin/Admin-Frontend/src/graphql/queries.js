import { gql } from '@apollo/client';

export const ADMIN_LOGIN = gql`
  mutation AdminLogin($username: String!, $password: String!) {
    adminLogin(username: $username, password: $password) {
      token
      adminUser {
        id
        username
        fullName
        isActive
      }
    }
  }
`;

export const GET_COMPANIES = gql`
  query GetCompanies(
    $page: Int!
    $pageSize: Int!
    $search: String
    $planId: String
    $isActive: Boolean
  ) {
    companies(
      page: $page
      pageSize: $pageSize
      search: $search
      planId: $planId
      isActive: $isActive
    ) {
      companies {
        id
        companyCode
        name
        email
        phone
        isActive
        createdAt
        subscription {
          planName
          status
          startDate
          endDate
        }
      }
      total
      page
      pageSize
      totalPages
    }
  }
`;

export const GET_SUBSCRIPTION_PLANS_WITH_COUNT = gql`
  query GetSubscriptionPlansWithCount {
    subscriptionPlansWithCount {
      id
      name
      slug
      description
      cvLimit
      jobLimit
      userLimit
      monthlyPrice
      yearlyPrice
      isActive
      sortOrder
      subscriberCount
    }
  }
`;

export const GET_PLAN_SUBSCRIBERS = gql`
  query GetPlanSubscribers($planId: String!) {
    planSubscribers(planId: $planId) {
      companyId
      companyName
      companyCode
      subscriptionStatus
      startDate
      endDate
      remainingCvQuota
      remainingJobQuota
      remainingUserQuota
    }
  }
`;
