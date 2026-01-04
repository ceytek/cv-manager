/**
 * CV Evaluation Main Page Component
 * Welcome screen with navigation to evaluation tools
 * Supports initialView prop to land directly on 'analysis', 'jobs', or 'welcome'.
 */
import React, { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import CVEvaluationAnalysis from './CVEvaluationAnalysis';
import JobsOverview from './JobsOverview';
import JobDetails from './JobDetails';
import { DEPARTMENTS_QUERY } from '../../graphql/departments';

const CVEvaluationPage = ({ initialView = 'jobs', initialJob = null }) => {
  // Default to 'jobs' view - treat 'welcome' as 'jobs' for backward compatibility
  const effectiveInitialView = initialView === 'welcome' ? 'jobs' : initialView;
  const [currentView, setCurrentView] = useState(effectiveInitialView); // 'analysis' | 'jobs' | 'job-details'
  const [selectedJob, setSelectedJob] = useState(initialJob);
  
  // Fetch departments for job detail modal
  const { data: departmentsData } = useQuery(DEPARTMENTS_QUERY, {
    variables: { includeInactive: false },
  });
  const departments = departmentsData?.departments || [];

  // Update internal view when parent changes initialView (e.g., dashboard quick action)
  useEffect(() => {
    const newView = initialView === 'welcome' ? 'jobs' : initialView;
    if (newView && ['analysis', 'jobs', 'job-details'].includes(newView)) {
      setCurrentView(newView);
    }
    // If initialJob is provided, set it and go to job-details view
    if (initialJob) {
      setSelectedJob(initialJob);
      setCurrentView('job-details');
    }
  }, [initialView, initialJob]);

  // Show analysis page
  if (currentView === 'analysis') {
    return <CVEvaluationAnalysis onBack={() => setCurrentView('jobs')} />;
  }
  if (currentView === 'job-details') {
    return <JobDetails job={selectedJob} onBack={() => setCurrentView('jobs')} departments={departments} />;
  }

  // Default: Show jobs list (job listings overview)
  return (
    <JobsOverview 
      onGoToAIEvaluation={() => setCurrentView('analysis')} 
      onOpenDetails={(job) => { setSelectedJob(job); setCurrentView('job-details'); }} 
    />
  );
};

export default CVEvaluationPage;
