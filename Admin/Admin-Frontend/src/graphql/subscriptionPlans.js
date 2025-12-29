import { gql } from '@apollo/client';

export const GET_SUBSCRIPTION_PLANS = gql`
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

export const CREATE_SUBSCRIPTION_PLAN = gql`
  mutation CreateSubscriptionPlan(
    $name: String!
    $slug: String!
    $description: String
    $cvLimit: Int!
    $jobLimit: Int!
    $userLimit: Int!
    $monthlyPrice: Float!
    $yearlyPrice: Float!
    $sortOrder: Int
  ) {
    createSubscriptionPlan(
      name: $name
      slug: $slug
      description: $description
      cvLimit: $cvLimit
      jobLimit: $jobLimit
      userLimit: $userLimit
      monthlyPrice: $monthlyPrice
      yearlyPrice: $yearlyPrice
      sortOrder: $sortOrder
    ) {
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
    }
  }
`;
