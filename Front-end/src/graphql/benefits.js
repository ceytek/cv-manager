/**
 * GraphQL queries and mutations for Benefits (Yan Haklar)
 */

import { gql } from '@apollo/client';

// Benefit Categories
export const BENEFIT_CATEGORIES = {
  financial: { label: { tr: 'Finansal', en: 'Financial' }, color: '#3B82F6', icon: '💰' },
  health: { label: { tr: 'Sağlık', en: 'Health' }, color: '#10B981', icon: '🏥' },
  transportation: { label: { tr: 'Ulaşım', en: 'Transportation' }, color: '#F97316', icon: '🚗' },
  development: { label: { tr: 'Gelişim', en: 'Development' }, color: '#8B5CF6', icon: '📚' },
  lifestyle: { label: { tr: 'Yaşam Tarzı', en: 'Lifestyle' }, color: '#EAB308', icon: '🏃' },
  food: { label: { tr: 'Yemek', en: 'Food' }, color: '#EF4444', icon: '🍽️' },
};

// Value Periods
export const VALUE_PERIODS = {
  daily: { label: { tr: 'Günlük', en: 'Daily' }, shortLabel: { tr: '/gün', en: '/day' } },
  monthly: { label: { tr: 'Aylık', en: 'Monthly' }, shortLabel: { tr: '/ay', en: '/mo' } },
  yearly: { label: { tr: 'Yıllık', en: 'Yearly' }, shortLabel: { tr: '/yıl', en: '/yr' } },
};

/**
 * Query to get all benefits
 */
export const GET_BENEFITS = gql`
  query GetBenefits($category: String, $isActive: Boolean) {
    benefits(category: $category, isActive: $isActive) {
      id
      name
      description
      category
      value
      valuePeriod
      isVariable
      icon
      isActive
      createdAt
      updatedAt
    }
  }
`;

/**
 * Query to get a single benefit
 */
export const GET_BENEFIT = gql`
  query GetBenefit($id: String!) {
    benefit(id: $id) {
      id
      name
      description
      category
      value
      valuePeriod
      isVariable
      icon
      isActive
      createdAt
      updatedAt
    }
  }
`;

/**
 * Mutation to create a benefit
 */
export const CREATE_BENEFIT = gql`
  mutation CreateBenefit($input: BenefitInput!) {
    createBenefit(input: $input) {
      success
      message
      benefit {
        id
        name
        description
        category
        value
        valuePeriod
        isVariable
        icon
        isActive
        createdAt
        updatedAt
      }
    }
  }
`;

/**
 * Mutation to update a benefit
 */
export const UPDATE_BENEFIT = gql`
  mutation UpdateBenefit($id: String!, $input: BenefitInput!) {
    updateBenefit(id: $id, input: $input) {
      success
      message
      benefit {
        id
        name
        description
        category
        value
        valuePeriod
        isVariable
        icon
        isActive
        createdAt
        updatedAt
      }
    }
  }
`;

/**
 * Mutation to delete a benefit
 */
export const DELETE_BENEFIT = gql`
  mutation DeleteBenefit($id: String!) {
    deleteBenefit(id: $id) {
      success
      message
    }
  }
`;
