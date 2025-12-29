import { gql } from '@apollo/client';

// ============================================
// Company Queries
// ============================================

export const MY_COMPANY_QUERY = gql`
  query MyCompany {
    myCompany {
      id
      companyCode
      name
      subdomain
      customDomain
      logoUrl
      themeColors
      contactEmail
      contactPhone
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const COMPANY_BY_CODE_QUERY = gql`
  query CompanyByCode($code: String!) {
    companyByCode(code: $code) {
      id
      companyCode
      name
      subdomain
      logoUrl
      themeColors
    }
  }
`;

// ============================================
// Subscription Queries
// ============================================

export const SUBSCRIPTION_PLANS_QUERY = gql`
  query SubscriptionPlans {
    subscriptionPlans {
      id
      slug
      name
      description
      cvLimit
      jobLimit
      userLimit
      monthlyPrice
      yearlyPrice
      features
      isWhiteLabel
      isActive
      displayOrder
    }
  }
`;

export const MY_SUBSCRIPTION_QUERY = gql`
  query MySubscription {
    mySubscription {
      id
      companyId
      planId
      status
      trialEndDate
      startDate
      endDate
      billingCycle
      nextBillingDate
      autoRenew
      plan {
        id
        slug
        name
        description
        cvLimit
        jobLimit
        userLimit
        monthlyPrice
        yearlyPrice
        features
        isWhiteLabel
      }
    }
  }
`;

export const SUBSCRIPTION_STATUS_QUERY = gql`
  query SubscriptionStatus {
    subscriptionStatus {
      hasSubscription
      status
      isActive
      isTrial
      isTrialExpired
      trialEndDate
      startDate
      nextBillingDate
      billingCycle
      autoRenew
      plan
      limits
      features
    }
  }
`;

// ============================================
// Usage Queries
// ============================================

export const USAGE_STATS_QUERY = gql`
  query UsageStats {
    usageStats {
      cvUpload {
        limitReached
        currentUsage
        limit
        remaining
        isUnlimited
        percentageUsed
      }
      jobPost {
        limitReached
        currentUsage
        limit
        remaining
        isUnlimited
        percentageUsed
      }
      aiAnalysis {
        limitReached
        currentUsage
        limit
        remaining
        isUnlimited
        percentageUsed
      }
      userAccount {
        limitReached
        currentUsage
        limit
        remaining
        isUnlimited
        percentageUsed
      }
      apiCall {
        limitReached
        currentUsage
        limit
        remaining
        isUnlimited
        percentageUsed
      }
    }
  }
`;

// Sidebar subscription usage (compact)
export const SUBSCRIPTION_USAGE_QUERY = gql`
  query SubscriptionUsage {
    subscriptionUsage {
      planName
      cvLimit
      usedCvCount
      usagePercent
    }
  }
`;

// ============================================
// Transaction Queries
// ============================================

export const MY_TRANSACTIONS_QUERY = gql`
  query MyTransactions($skip: Int, $limit: Int) {
    myTransactions(skip: $skip, limit: $limit) {
      id
      companyId
      subscriptionId
      transactionType
      amount
      currency
      paymentMethod
      status
      transactionDate
      completedAt
      invoiceNumber
      paymentReference
      description
      notes
    }
  }
`;

// ============================================
// Company Mutations
// ============================================

export const CREATE_COMPANY_MUTATION = gql`
  mutation CreateCompany($input: CreateCompanyInput!) {
    createCompany(input: $input) {
      id
      companyCode
      name
      subdomain
      customDomain
      logoUrl
      themeColors
      contactEmail
      contactPhone
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_COMPANY_MUTATION = gql`
  mutation UpdateCompany($input: UpdateCompanyInput!) {
    updateCompany(input: $input) {
      id
      companyCode
      name
      subdomain
      customDomain
      logoUrl
      themeColors
      contactEmail
      contactPhone
      isActive
      updatedAt
    }
  }
`;

// ============================================
// Subscription Mutations
// ============================================

export const CREATE_SUBSCRIPTION_MUTATION = gql`
  mutation CreateSubscription($input: CreateSubscriptionInput!) {
    createSubscription(input: $input) {
      id
      companyId
      planId
      status
      trialEndDate
      startDate
      billingCycle
      nextBillingDate
      autoRenew
      plan {
        id
        name
        slug
      }
    }
  }
`;

export const CHANGE_SUBSCRIPTION_PLAN_MUTATION = gql`
  mutation ChangeSubscriptionPlan($input: ChangePlanInput!) {
    changeSubscriptionPlan(input: $input) {
      id
      planId
      status
      billingCycle
      nextBillingDate
      plan {
        id
        name
        slug
      }
    }
  }
`;

export const CANCEL_SUBSCRIPTION_MUTATION = gql`
  mutation CancelSubscription($immediate: Boolean!) {
    cancelSubscription(immediate: $immediate) {
      message
      success
    }
  }
`;
