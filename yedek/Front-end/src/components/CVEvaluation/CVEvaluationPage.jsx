/**
 * CV Evaluation Main Page Component
 * Welcome screen with navigation to evaluation tools
 * Supports initialView prop to land directly on 'analysis', 'jobs', or 'welcome'.
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@apollo/client/react';
import { Brain, FileSearch, TrendingUp } from 'lucide-react';
import CVEvaluationAnalysis from './CVEvaluationAnalysis';
import JobsOverview from './JobsOverview';
import JobDetails from './JobDetails';
import { DEPARTMENTS_QUERY } from '../../graphql/departments';

const CVEvaluationPage = ({ initialView = 'welcome' }) => {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState(initialView); // 'welcome' | 'analysis' | 'jobs' | 'job-details'
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Fetch departments for job detail modal
  const { data: departmentsData } = useQuery(DEPARTMENTS_QUERY, {
    variables: { includeInactive: false },
  });
  const departments = departmentsData?.departments || [];

  // Update internal view when parent changes initialView (e.g., dashboard quick action)
  useEffect(() => {
    if (initialView && ['welcome', 'analysis', 'jobs', 'job-details'].includes(initialView)) {
      setCurrentView(initialView);
    }
  }, [initialView]);

  // Show analysis page
  if (currentView === 'analysis') {
    return <CVEvaluationAnalysis onBack={() => setCurrentView('welcome')} />;
  }
  if (currentView === 'jobs') {
    return (
      <JobsOverview 
        onBack={() => setCurrentView('welcome')} 
        onOpenDetails={(job) => { setSelectedJob(job); setCurrentView('job-details'); }} 
      />
    );
  }
  if (currentView === 'job-details') {
    return <JobDetails job={selectedJob} onBack={() => setCurrentView('jobs')} departments={departments} />;
  }

  // Show welcome page
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ 
          fontSize: 28, 
          fontWeight: 700, 
          color: '#1F2937',
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <Brain size={32} color="#2563EB" />
          {t('cvEvaluation.welcomeTitle')}
        </h1>
        <p style={{ 
          fontSize: 16, 
          color: '#6B7280',
          maxWidth: 800
        }}>
          {t('cvEvaluation.welcomeSubtitle')}
        </p>
      </div>

      {/* Action Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: 24,
        marginTop: 40
      }}>
        {/* İş İlanları Card */}
        <ActionCard
          icon={<FileSearch size={48} color="#2563EB" />}
          title={t('cvEvaluation.jobListingsCard.title')}
          description={t('cvEvaluation.jobListingsCard.description')}
          buttonText={t('cvEvaluation.jobListingsCard.button')}
          bgColor="#EFF6FF"
          onClick={() => setCurrentView('jobs')}
        />

        {/* Yapay Zeka ile Değerlendirme Card */}
        <ActionCard
          icon={<Brain size={48} color="#7C3AED" />}
          title={t('cvEvaluation.aiEvaluationCard.title')}
          description={t('cvEvaluation.aiEvaluationCard.description')}
          buttonText={t('cvEvaluation.aiEvaluationCard.button')}
          bgColor="#F5F3FF"
          onClick={() => setCurrentView('analysis')}
        />
      </div>

      {/* Info Section */}
      <div style={{
        marginTop: 48,
        padding: 24,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 16,
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <TrendingUp size={32} />
          <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
            {t('cvEvaluation.aiSystemTitle')}
          </h2>
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.6, opacity: 0.95, maxWidth: 800 }}>
          {t('cvEvaluation.aiSystemDesc')}
        </p>
      </div>
    </div>
  );
};

// Action Card Component
const ActionCard = ({ icon, title, description, buttonText, bgColor, onClick }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      style={{
        background: 'white',
        borderRadius: 16,
        padding: 32,
        border: '1px solid #E5E7EB',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Icon */}
      <div style={{
        width: 80,
        height: 80,
        borderRadius: 16,
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24
      }}>
        {icon}
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: 20,
        fontWeight: 700,
        color: '#1F2937',
        marginBottom: 12
      }}>
        {title}
      </h3>

      {/* Description */}
      <p style={{
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 1.6,
        marginBottom: 24
      }}>
        {description}
      </p>

      {/* Button */}
      <button
        onClick={onClick}
        style={{
          width: '100%',
          padding: '12px 24px',
          background: isHovered ? '#2563EB' : '#3B82F6',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8
        }}
      >
        {buttonText}
        <span style={{ fontSize: 18 }}>→</span>
      </button>
    </div>
  );
};

export default CVEvaluationPage;
