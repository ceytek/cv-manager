import { gql } from '@apollo/client';

export const GET_CALENDAR_EVENTS = gql`
  query CalendarEvents($startDate: String!, $endDate: String!, $eventTypes: [String!]) {
    calendarEvents(startDate: $startDate, endDate: $endDate, eventTypes: $eventTypes) {
      totalCount
      events {
        id
        title
        eventType
        scheduledDate
        scheduledTime
        endTime
        candidateName
        candidateEmail
        candidatePhoto
        jobTitle
        departmentName
        interviewMode
        platform
        meetingLink
        locationAddress
        status
        color
        applicationId
        createdAt
      }
    }
  }
`;
