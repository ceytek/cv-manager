/**
 * CV Evaluation Analysis Component
 * AI-powered CV to Job matching interface
 * 3-column layout: Job Selection | Candidate Selection | Summary & Analysis
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@apollo/client/react';
import { Search, CheckCircle2, ArrowLeft } from 'lucide-react';
import { JOBS_QUERY } from '../../graphql/jobs';
import { CANDIDATES_QUERY } from '../../graphql/cvs';
import { DEPARTMENTS_QUERY } from '../../graphql/departments';
import { ANALYZE_JOB_CANDIDATES_MUTATION, APPLICATIONS_QUERY } from '../../graphql/applications';
import CVAnalysisResults from './CVAnalysisResults';
import CVAnalysisProgressModal from '../CVAnalysisProgressModal';

const CVEvaluationAnalysis = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  // State management
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [jobSearchTerm, setJobSearchTerm] = useState('');
  const [candidateSearchTerm, setCandidateSearchTerm] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  
  // Progress modal state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressState, setProgressState] = useState({
    currentCandidate: 0,
    totalCandidates: 0,
    processedCandidates: 0,
    currentCandidateName: '',
    status: 'analyzing'
  });

  // GraphQL Mutation for analysis
  const [analyzeJobCandidates] = useMutation(ANALYZE_JOB_CANDIDATES_MUTATION, {
    refetchQueries: [
      {
        query: APPLICATIONS_QUERY,
        variables: { jobId: selectedJob?.id }
      }
    ]
  });

  // Fetch departments
  const { data: departmentsData } = useQuery(DEPARTMENTS_QUERY, { variables: { includeInactive: false } });
  const departments = departmentsData?.departments || [];

  // Fetch jobs
  const { data: jobsData, loading: jobsLoading } = useQuery(JOBS_QUERY, {
    variables: {
      includeInactive: false,
      status: 'active',
    },
  });
  const jobs = jobsData?.jobs || [];

  // Fetch candidates (only when department is selected)
  const { data: candidatesData, loading: candidatesLoading } = useQuery(CANDIDATES_QUERY, {
    variables: {
      departmentId: selectedDepartment || null,
    },
    skip: !selectedDepartment,
  });
  const candidates = candidatesData?.candidates || [];

  // Filter jobs by search term
  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
    (job.id && job.id.toLowerCase().includes(jobSearchTerm.toLowerCase()))
  );

  // Filter candidates by search term
  const filteredCandidates = candidates.filter(candidate =>
    candidate.name?.toLowerCase().includes(candidateSearchTerm.toLowerCase())
  );

  // Handle candidate selection toggle
  const toggleCandidateSelection = (candidate) => {
    setSelectedCandidates(prev => {
      const isSelected = prev.find(c => c.id === candidate.id);
      if (isSelected) {
        return prev.filter(c => c.id !== candidate.id);
      } else {
        return [...prev, candidate];
      }
    });
  };

  // Handle start analysis - Call real GraphQL mutation
  const handleStartAnalysis = async () => {
    if (!selectedJob || selectedCandidates.length === 0) {
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisError(null);
    
    // Show progress modal
    setShowProgressModal(true);
    setProgressState({
      currentCandidate: 0,
      totalCandidates: selectedCandidates.length,
      processedCandidates: 0,
      currentCandidateName: '',
      status: 'analyzing'
    });

    try {
      // Call the mutation
      const { data } = await analyzeJobCandidates({
        variables: {
          input: {
            jobId: selectedJob.id,
            candidateIds: selectedCandidates.map(c => c.id)
          },
          language: i18n.language === 'tr' ? 'turkish' : 'english'
        }
      });

      if (data?.analyzeJobCandidates?.success) {
        // Show success
        setProgressState(prev => ({
          ...prev,
          status: 'success'
        }));
        
        // Close modal and show results after delay
        setTimeout(() => {
          setShowProgressModal(false);
          setIsAnalyzing(false);
          setShowResults(true);
        }, 2000);
      } else {
        throw new Error(data?.analyzeJobCandidates?.message || 'Analysis failed');
      }

    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisError(error.message || 'Failed to analyze candidates');
      setProgressState(prev => ({
        ...prev,
        status: 'error'
      }));
      
      // Close modal after showing error
      setTimeout(() => {
        setShowProgressModal(false);
        setIsAnalyzing(false);
      }, 3000);
    }
  };

  // Show results page if analysis is complete
  if (showResults) {
    return (
      <CVAnalysisResults
        jobId={selectedJob?.id}
        selectedJob={selectedJob}
        selectedCandidates={selectedCandidates}
        onBack={() => setShowResults(false)}
      />
    );
  }

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            color: '#374151',
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={16} />
          {t('cvEvaluation.backButton')}
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1F2937', margin: 0 }}>
          {t('cvEvaluation.analysisTitle')}
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>
          {t('cvEvaluation.analysisSubtitle')}
        </p>
      </div>

      {/* 3 Column Layout */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 400px',
        gap: 20,
        overflow: 'hidden',
      }}>
        {/* Column 1: Job Selection */}
        <JobSelectionPanel
          jobs={filteredJobs}
          selectedJob={selectedJob}
          onSelectJob={setSelectedJob}
          searchTerm={jobSearchTerm}
          onSearchChange={setJobSearchTerm}
          loading={jobsLoading}
        />

        {/* Column 2: Candidate Selection */}
        <CandidateSelectionPanel
          departments={departments}
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
          candidates={filteredCandidates}
          selectedCandidates={selectedCandidates}
          onToggleCandidate={toggleCandidateSelection}
          searchTerm={candidateSearchTerm}
          onSearchChange={setCandidateSearchTerm}
          loading={candidatesLoading}
        />

        {/* Column 3: Summary & Analysis */}
        <SummaryPanel
          selectedJob={selectedJob}
          selectedCandidates={selectedCandidates}
          isAnalyzing={isAnalyzing}
          analysisProgress={analysisProgress}
          analysisError={analysisError}
          onStartAnalysis={handleStartAnalysis}
        />
      </div>

      {/* Progress Modal */}
      <CVAnalysisProgressModal
        isOpen={showProgressModal}
        currentCandidate={progressState.currentCandidate}
        totalCandidates={progressState.totalCandidates}
        processedCandidates={progressState.processedCandidates}
        currentCandidateName={progressState.currentCandidateName}
        status={progressState.status}
      />
    </div>
  );
};

// ========================================
// Job Selection Panel Component
// ========================================
const JobSelectionPanel = ({ jobs, selectedJob, onSelectJob, searchTerm, onSearchChange, loading }) => {
  const { t } = useTranslation();
  
  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      border: '1px solid #E5E7EB',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: 20, borderBottom: '1px solid #E5E7EB' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1F2937', marginBottom: 12 }}>
          {t('cvEvaluation.step1')}
        </h2>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}
          />
          <input
            type="text"
            placeholder={t('cvEvaluation.searchJobs')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              border: '1px solid #D1D5DB',
              borderRadius: 8,
              fontSize: 14,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Job List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>{t('common.loading')}</div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>{t('cvEvaluation.noJobsFound')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {jobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                isSelected={selectedJob?.id === job.id}
                onSelect={() => onSelectJob(job)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Job Card Component
const JobCard = ({ job, isSelected, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: 16,
        border: isSelected ? '2px solid #3B82F6' : '1px solid #E5E7EB',
        borderRadius: 8,
        cursor: 'pointer',
        background: isSelected ? '#EFF6FF' : (isHovered ? '#F9FAFB' : 'white'),
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Radio Button */}
      <div style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        border: isSelected ? '6px solid #3B82F6' : '2px solid #D1D5DB',
        flexShrink: 0,
      }} />

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', marginBottom: 4 }}>
          {job.title}
        </div>
        <div style={{ fontSize: 12, color: '#6B7280' }}>
          Ref: {job.id ? job.id.slice(0, 8).toUpperCase() : 'N/A'}
        </div>
      </div>
    </div>
  );
};

// ========================================
// Candidate Selection Panel Component
// ========================================
const CandidateSelectionPanel = ({
  departments,
  selectedDepartment,
  onDepartmentChange,
  candidates,
  selectedCandidates,
  onToggleCandidate,
  searchTerm,
  onSearchChange,
  loading,
}) => {
  const { t } = useTranslation();
  
  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      border: '1px solid #E5E7EB',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: 20, borderBottom: '1px solid #E5E7EB' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1F2937', marginBottom: 12 }}>
          {t('cvEvaluation.step2')}
        </h2>

        {/* Department Dropdown */}
        <select
          value={selectedDepartment}
          onChange={(e) => onDepartmentChange(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #D1D5DB',
            borderRadius: 8,
            fontSize: 14,
            marginBottom: 12,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">{t('cvEvaluation.allDepartments')}</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}
          />
          <input
            type="text"
            placeholder={t('cvEvaluation.searchCandidates')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              border: '1px solid #D1D5DB',
              borderRadius: 8,
              fontSize: 14,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Candidate List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {!selectedDepartment ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
            {t('cvEvaluation.selectJob')}
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>{t('common.loading')}</div>
        ) : candidates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>{t('cvEvaluation.noCandidatesFound')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {candidates.map(candidate => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                isSelected={selectedCandidates.some(c => c.id === candidate.id)}
                onToggle={() => onToggleCandidate(candidate)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Candidate Card Component
const CandidateCard = ({ candidate, isSelected, onToggle }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Extract last position from parsed_data if available
  const getLastPosition = () => {
    // This would come from parsed_data.experience[0] in real implementation
    // For now, use department as fallback
    return candidate.department?.name || 'Pozisyon bilgisi yok';
  };

  return (
    <div
      onClick={onToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: 16,
        border: isSelected ? '2px solid #3B82F6' : '1px solid #E5E7EB',
        borderRadius: 8,
        cursor: 'pointer',
        background: isSelected ? '#EFF6FF' : (isHovered ? '#F9FAFB' : 'white'),
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Checkbox */}
      <div style={{
        width: 20,
        height: 20,
        borderRadius: 4,
        border: isSelected ? 'none' : '2px solid #D1D5DB',
        background: isSelected ? '#3B82F6' : 'white',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {isSelected && <CheckCircle2 size={20} color="white" />}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', marginBottom: 4 }}>
          {candidate.name || 'İsim bilgisi yok'}
        </div>
        <div style={{ fontSize: 12, color: '#6B7280' }}>
          Son Pozisyon: {getLastPosition()}
        </div>
      </div>
    </div>
  );
};

// ========================================
// Summary Panel Component
// ========================================
const SummaryPanel = ({ selectedJob, selectedCandidates, isAnalyzing, analysisProgress, analysisError, onStartAnalysis }) => {
  const { t } = useTranslation();
  const canStartAnalysis = selectedJob && selectedCandidates.length > 0;

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      border: '1px solid #E5E7EB',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: 20, borderBottom: '1px solid #E5E7EB' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1F2937' }}>
          {t('cvEvaluation.step3')}
        </h2>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Start Analysis Button - Moved to top */}
        <button
          onClick={onStartAnalysis}
          disabled={!canStartAnalysis || isAnalyzing}
          style={{
            width: '100%',
            padding: '14px 24px',
            background: canStartAnalysis && !isAnalyzing ? '#3B82F6' : '#D1D5DB',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            cursor: canStartAnalysis && !isAnalyzing ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s',
          }}
        >
          {t('cvEvaluation.startAnalysis')}
        </button>

        {/* Selected Job */}
        <div>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#6B7280',
            marginBottom: 8,
            letterSpacing: '0.5px',
          }}>
            {t('cvEvaluation.selectedJob')}
          </div>
          {selectedJob ? (
            <div style={{
              padding: 12,
              background: '#F9FAFB',
              borderRadius: 8,
              border: '1px solid #E5E7EB',
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', marginBottom: 4 }}>
                {selectedJob.title}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>
                Ref: {selectedJob.id ? selectedJob.id.slice(0, 8).toUpperCase() : 'N/A'}
              </div>
            </div>
          ) : (
            <div style={{
              padding: 12,
              background: '#F9FAFB',
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              color: '#9CA3AF',
              fontSize: 13,
              textAlign: 'center',
            }}>
              {t('cvEvaluation.noJobSelected')}
            </div>
          )}
        </div>

        {/* Selected Candidates */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#6B7280',
            marginBottom: 8,
            letterSpacing: '0.5px',
          }}>
            {t('cvEvaluation.selectedCandidates', { count: selectedCandidates.length })}
          </div>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: 300,
          }}>
            {selectedCandidates.length === 0 ? (
              <div style={{
                padding: 12,
                background: '#F9FAFB',
                borderRadius: 8,
                border: '1px solid #E5E7EB',
                color: '#9CA3AF',
                fontSize: 13,
                textAlign: 'center',
              }}>
                {t('cvEvaluation.noCandidateSelected')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedCandidates.map(candidate => (
                  <div
                    key={candidate.id}
                    style={{
                      padding: 10,
                      background: '#F9FAFB',
                      borderRadius: 6,
                      fontSize: 13,
                      color: '#374151',
                    }}
                  >
                    {candidate.name || 'İsim bilgisi yok'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Analysis Progress (shown when analyzing) */}
        {isAnalyzing && (
          <div>
            <div style={{
              fontSize: 13,
              color: '#6B7280',
              marginBottom: 8,
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span>{t('cvEvaluation.analyzing')}</span>
              <span>{analysisProgress}%</span>
            </div>
            <div style={{
              height: 8,
              background: '#E5E7EB',
              borderRadius: 4,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                background: '#3B82F6',
                width: `${analysisProgress}%`,
                transition: 'width 0.3s',
              }} />
            </div>
          </div>
        )}

        {/* Error Message */}
        {analysisError && (
          <div style={{
            padding: 12,
            background: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: 8,
            marginBottom: 16,
          }}>
            <div style={{ color: '#DC2626', fontSize: 14, fontWeight: 500 }}>
              ❌ Analysis Failed
            </div>
            <div style={{ color: '#991B1B', fontSize: 13, marginTop: 4 }}>
              {analysisError}
            </div>
          </div>
        )}

        {/* Start Analysis Button - Bottom (when candidates selected) */}
        {selectedCandidates.length > 0 && (
          <button
            onClick={onStartAnalysis}
            disabled={!canStartAnalysis || isAnalyzing}
            style={{
              width: '100%',
              padding: '14px 24px',
              background: canStartAnalysis && !isAnalyzing ? '#3B82F6' : '#D1D5DB',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: canStartAnalysis && !isAnalyzing ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
              marginTop: 'auto',
            }}
          >
            {t('cvEvaluation.startAnalysis')}
          </button>
        )}
      </div>
    </div>
  );
};

export default CVEvaluationAnalysis;
