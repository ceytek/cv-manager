/**
 * CV Evaluation Analysis Component
 * AI-powered CV to Job matching interface
 * 3-column layout: Job Selection | Candidate Selection | Summary & Analysis
 * Supports batch processing to prevent timeout errors
 */
import React, { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useApolloClient } from '@apollo/client/react';
import { Search, CheckCircle2, ArrowLeft, ArrowUpDown, FolderOpen, Sparkles } from 'lucide-react';
import { JOBS_QUERY } from '../../graphql/jobs';
import { CANDIDATES_QUERY } from '../../graphql/cvs';
import { DEPARTMENTS_QUERY } from '../../graphql/departments';
import { ANALYZE_JOB_CANDIDATES_MUTATION, APPLICATIONS_QUERY } from '../../graphql/applications';
import { GET_TALENT_POOL_ENTRIES, GET_TALENT_POOL_TAGS } from '../../graphql/talentPool';
import CVAnalysisResults from './CVAnalysisResults';
import CVAnalysisProgressModal from '../CVAnalysisProgressModal';
import { GRAPHQL_URL } from '../../config/api';

// Batch size for analysis - prevents timeout errors
// Reduced to 3 for safer AI processing time (matches CV upload)
const BATCH_SIZE = 3;

const CVEvaluationAnalysis = ({ onBack, onNavigateToJob }) => {
  const { t, i18n } = useTranslation();
  // State management
  const [selectedJob, setSelectedJob] = useState(null);
  const selectedJobRef = useRef(null); // Ref to track current selected job for callbacks
  
  // Keep ref in sync with state for use in callbacks
  const handleSelectJob = (job) => {
    setSelectedJob(job);
    selectedJobRef.current = job;
  };
  
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [jobDepartmentFilter, setJobDepartmentFilter] = useState('');
  const [jobSearchTerm, setJobSearchTerm] = useState('');
  const [candidateSearchTerm, setCandidateSearchTerm] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  
  // Source type: 'departments' or 'talentPool'
  const [sourceType, setSourceType] = useState('departments');
  const [selectedPoolTags, setSelectedPoolTags] = useState([]);
  
  // Progress modal state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressState, setProgressState] = useState({
    currentCandidate: 0,
    totalCandidates: 0,
    processedCandidates: 0,
    currentCandidateName: '',
    status: 'analyzing'
  });

  // Apollo client for manual mutations (batch processing)
  const apolloClient = useApolloClient();

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
    skip: !selectedDepartment || sourceType !== 'departments',
  });
  const candidates = candidatesData?.candidates || [];

  // Fetch talent pool tags
  const { data: poolTagsData } = useQuery(GET_TALENT_POOL_TAGS, {
    skip: sourceType !== 'talentPool',
  });
  const poolTags = poolTagsData?.talentPoolTags?.filter(t => t.isActive) || [];

  // Fetch talent pool entries
  const { data: poolEntriesData, loading: poolEntriesLoading } = useQuery(GET_TALENT_POOL_ENTRIES, {
    variables: {
      filter: {
        status: 'active',
        tagIds: selectedPoolTags.length > 0 ? selectedPoolTags : null,
      },
    },
    skip: sourceType !== 'talentPool',
  });
  
  // Transform pool entries to candidate format for compatibility
  const poolCandidates = useMemo(() => {
    if (!poolEntriesData?.talentPoolEntries) return [];
    return poolEntriesData.talentPoolEntries.map(entry => ({
      id: entry.candidate.id,
      name: entry.candidate.name,
      email: entry.candidate.email,
      phone: entry.candidate.phone,
      cvPhotoPath: entry.candidate.cvPhotoPath,
      department: null,
      poolTags: entry.tags,
      poolEntryId: entry.id,
      isFromPool: true,
    }));
  }, [poolEntriesData]);

  // Filter jobs by search term
  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
    (job.id && job.id.toLowerCase().includes(jobSearchTerm.toLowerCase()))
  );

  // Get active candidates based on source type
  const activeCandidates = sourceType === 'departments' ? candidates : poolCandidates;
  const activeCandidatesLoading = sourceType === 'departments' ? candidatesLoading : poolEntriesLoading;

  // Filter candidates by search term
  const filteredCandidates = activeCandidates.filter(candidate =>
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

  // Handle select all candidates
  const selectAllCandidates = () => {
    // Check if all filtered candidates are already selected
    const allSelected = filteredCandidates.every(c => 
      selectedCandidates.some(sc => sc.id === c.id)
    );
    
    if (allSelected) {
      // Deselect all filtered candidates
      setSelectedCandidates(prev => 
        prev.filter(sc => !filteredCandidates.some(fc => fc.id === sc.id))
      );
    } else {
      // Select all filtered candidates (add ones not already selected)
      setSelectedCandidates(prev => {
        const newCandidates = filteredCandidates.filter(
          fc => !prev.some(sc => sc.id === fc.id)
        );
        return [...prev, ...newCandidates];
      });
    }
  };

  // Analyze a single batch of candidates
  const analyzeBatch = async (candidateIds, jobId, language) => {
    const token = sessionStorage.getItem('accessToken');
    
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({
        query: `
          mutation AnalyzeJobCandidates($input: AnalyzeJobCandidatesInput!, $language: String) {
            analyzeJobCandidates(input: $input, language: $language) {
              success
              message
            }
          }
        `,
        variables: {
          input: {
            jobId: jobId,
            candidateIds: candidateIds
          },
          language: language
        }
      }),
    });

    return await response.json();
  };

  // Handle start analysis - Process candidates in batches to prevent timeout
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
      currentBatch: 0,
      totalBatches: Math.ceil(selectedCandidates.length / BATCH_SIZE),
      status: 'analyzing'
    });

    // Track results
    let successCount = 0;
    let errorCount = 0;
    let lastError = null;

    try {
      // Split candidates into batches
      const batches = [];
      for (let i = 0; i < selectedCandidates.length; i += BATCH_SIZE) {
        batches.push(selectedCandidates.slice(i, i + BATCH_SIZE));
      }

      const language = i18n.language === 'tr' ? 'turkish' : 'english';
      let processedCount = 0;

      // Process batches sequentially
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const candidateIds = batch.map(c => c.id);
        const candidateNames = batch.map(c => c.name || 'Aday').join(', ');
        
        // Update progress - show current batch being processed
        setProgressState(prev => ({
          ...prev,
          currentBatch: batchIndex + 1,
          currentCandidateName: candidateNames,
        }));

        try {
          const result = await analyzeBatch(candidateIds, selectedJob.id, language);

          if (result.errors) {
            // GraphQL errors
            errorCount += batch.length;
            lastError = result.errors?.[0]?.message || t('cvEvaluation.genericError');
            console.error('Batch error:', result.errors);
          } else if (result.data?.analyzeJobCandidates?.success) {
            successCount += batch.length;
          } else {
            errorCount += batch.length;
            lastError = result.data?.analyzeJobCandidates?.message || t('cvEvaluation.genericError');
          }
        } catch (batchError) {
          // Network/timeout errors
          errorCount += batch.length;
          lastError = batchError.message || t('cvEvaluation.genericError');
          console.error('Batch fetch error:', batchError);
        }

        // Update processed count after each batch
        processedCount += batch.length;
        setProgressState(prev => ({
          ...prev,
          processedCandidates: processedCount
        }));

        // Update progress percentage
        setAnalysisProgress(Math.round((processedCount / selectedCandidates.length) * 100));
      }

      // Final status
      if (errorCount === 0) {
        // All successful
        setProgressState(prev => ({
          ...prev,
          processedCandidates: selectedCandidates.length,
          currentCandidateName: '',
          status: 'success'
        }));
        
        // Refetch applications to show results
        apolloClient.refetchQueries({
          include: [APPLICATIONS_QUERY]
        });
        
        // Close modal and navigate to job details page after delay
        setTimeout(() => {
          setShowProgressModal(false);
          setIsAnalyzing(false);
          // Navigate to job details page instead of showing results internally
          // Use ref to get current value (avoids stale closure issue)
          const currentJob = selectedJobRef.current;
          if (onNavigateToJob && currentJob) {
            // Pass newly analyzed candidate IDs for highlighting
            const analyzedIds = selectedCandidates.map(c => c.id);
            onNavigateToJob(currentJob, analyzedIds);
          } else {
            setShowResults(true);
          }
        }, 2000);
      } else if (successCount > 0) {
        // Partial success
        setProgressState(prev => ({
          ...prev,
          status: 'partial',
          successCount,
          errorCount
        }));
        
        // Refetch to show partial results
        apolloClient.refetchQueries({
          include: [APPLICATIONS_QUERY]
        });
        
        setAnalysisError(`${successCount} ${t('cvEvaluation.successCount')}, ${errorCount} ${t('cvEvaluation.errorCount')}`);
        
        setTimeout(() => {
          setShowProgressModal(false);
          setIsAnalyzing(false);
          // Navigate to job details page even on partial success
          // Use ref to get current value (avoids stale closure issue)
          const currentJob = selectedJobRef.current;
          if (onNavigateToJob && currentJob) {
            // Pass newly analyzed candidate IDs for highlighting
            const analyzedIds = selectedCandidates.map(c => c.id);
            onNavigateToJob(currentJob, analyzedIds);
          } else {
            setShowResults(true);
          }
        }, 3000);
      } else {
        // All failed
        throw new Error(lastError || t('cvEvaluation.genericError'));
      }

    } catch (error) {
      console.error('Analysis error:', error);
      // Check for timeout error (524 status code from Cloudflare)
      let errorMessage;
      if (error.message && (error.message.includes('524') || error.message.includes('timeout'))) {
        errorMessage = t('cvEvaluation.timeoutError');
      } else {
        errorMessage = error.message || t('cvEvaluation.genericError');
      }
      setAnalysisError(errorMessage);
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
          onSelectJob={handleSelectJob}
          searchTerm={jobSearchTerm}
          onSearchChange={setJobSearchTerm}
          loading={jobsLoading}
          departments={departments}
          selectedDepartment={jobDepartmentFilter}
          onDepartmentChange={setJobDepartmentFilter}
        />

        {/* Column 2: Candidate Selection */}
        <CandidateSelectionPanel
          departments={departments}
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
          candidates={filteredCandidates}
          selectedCandidates={selectedCandidates}
          onToggleCandidate={toggleCandidateSelection}
          onSelectAll={selectAllCandidates}
          searchTerm={candidateSearchTerm}
          onSearchChange={setCandidateSearchTerm}
          loading={activeCandidatesLoading}
          sourceType={sourceType}
          onSourceTypeChange={setSourceType}
          poolTags={poolTags}
          selectedPoolTags={selectedPoolTags}
          onPoolTagsChange={setSelectedPoolTags}
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
        currentBatch={progressState.currentBatch}
        totalBatches={progressState.totalBatches}
        successCount={progressState.successCount}
        errorCount={progressState.errorCount}
        status={progressState.status}
      />
    </div>
  );
};

// ========================================
// Job Selection Panel Component
// ========================================
const JobSelectionPanel = ({ jobs, selectedJob, onSelectJob, searchTerm, onSearchChange, loading, departments, selectedDepartment, onDepartmentChange }) => {
  const { t } = useTranslation();
  
  // Filter jobs by department
  const filteredJobs = useMemo(() => {
    if (!jobs || jobs.length === 0) return [];
    
    let filtered = [...jobs];
    
    // Filter by department
    if (selectedDepartment) {
      filtered = filtered.filter(job => job.department?.id === selectedDepartment);
    }
    
    // Sort by newest first
    return filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [jobs, selectedDepartment]);
  
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
            color: selectedDepartment ? '#374151' : '#9CA3AF',
            background: 'white',
            cursor: 'pointer',
            outline: 'none',
            marginBottom: 12,
          }}
        >
          <option value="">{t('cvEvaluation.allDepartments')}</option>
          {departments?.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
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
        ) : filteredJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>{t('cvEvaluation.noJobsFound')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredJobs.map(job => (
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
  onSelectAll,
  searchTerm,
  onSearchChange,
  loading,
  sourceType,
  onSourceTypeChange,
  poolTags,
  selectedPoolTags,
  onPoolTagsChange,
}) => {
  const { t } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [tagDropdownOpen, setTagDropdownOpen] = React.useState(false);
  
  // Check if all candidates are selected
  const allSelected = candidates.length > 0 && candidates.every(c => 
    selectedCandidates.some(sc => sc.id === c.id)
  );
  
  // Get selected department name
  const selectedDeptName = selectedDepartment 
    ? departments.find(d => d.id === selectedDepartment)?.name 
    : t('cvEvaluation.allDepartments');
  const selectedDeptColor = selectedDepartment 
    ? departments.find(d => d.id === selectedDepartment)?.color 
    : null;

  // Get display text for selected tags
  const getSelectedTagsDisplay = () => {
    if (selectedPoolTags.length === 0) {
      return t('cvEvaluation.allTags');
    }
    if (selectedPoolTags.length === 1) {
      const tag = poolTags.find(t => t.id === selectedPoolTags[0]);
      return tag?.name || t('cvEvaluation.allTags');
    }
    return `${selectedPoolTags.length} ${t('cvEvaluation.tagsSelected')}`;
  };

  // Toggle tag selection
  const toggleTagSelection = (tagId) => {
    if (selectedPoolTags.includes(tagId)) {
      onPoolTagsChange(selectedPoolTags.filter(id => id !== tagId));
    } else {
      onPoolTagsChange([...selectedPoolTags, tagId]);
    }
  };

  // Clear all tag selections
  const clearTagSelection = () => {
    onPoolTagsChange([]);
  };
  
  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownOpen && !e.target.closest('.dept-dropdown-container')) {
        setDropdownOpen(false);
      }
      if (tagDropdownOpen && !e.target.closest('.tag-dropdown-container')) {
        setTagDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownOpen, tagDropdownOpen]);

  // Handle source type change - reset filters
  const handleSourceTypeChange = (newType) => {
    onSourceTypeChange(newType);
    if (newType === 'departments') {
      onPoolTagsChange([]);
    } else {
      onDepartmentChange('');
    }
  };
  
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

        {/* Source Type Tabs */}
        <div style={{
          display: 'flex',
          background: '#F3F4F6',
          borderRadius: 8,
          padding: 4,
          marginBottom: 12,
        }}>
          <button
            onClick={() => handleSourceTypeChange('departments')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '8px 12px',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: sourceType === 'departments' ? 'white' : 'transparent',
              color: sourceType === 'departments' ? '#1F2937' : '#6B7280',
              boxShadow: sourceType === 'departments' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <FolderOpen size={14} />
            {t('cvEvaluation.departmentsTab')}
          </button>
          <button
            onClick={() => handleSourceTypeChange('talentPool')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '8px 12px',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: sourceType === 'talentPool' ? 'white' : 'transparent',
              color: sourceType === 'talentPool' ? '#1F2937' : '#6B7280',
              boxShadow: sourceType === 'talentPool' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <Sparkles size={14} />
            {t('cvEvaluation.talentPoolTab')}
          </button>
        </div>

        {/* Department Dropdown - Show when departments tab is active */}
        {sourceType === 'departments' && (
          <div className="dept-dropdown-container" style={{ position: 'relative', marginBottom: 12 }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: 8,
                fontSize: 14,
                background: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'left',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {selectedDeptColor && (
                  <span style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: selectedDeptColor,
                    flexShrink: 0,
                  }} />
                )}
                {selectedDeptName}
              </span>
              <span style={{ 
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                color: '#6B7280',
              }}>▼</span>
            </button>
            
            {dropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                border: '1px solid #D1D5DB',
                borderRadius: 8,
                marginTop: 4,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 50,
                maxHeight: 250,
                overflowY: 'auto',
              }}>
                {/* All Departments Option */}
                <button
                  onClick={() => { onDepartmentChange(''); setDropdownOpen(false); }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: 'none',
                    background: selectedDepartment === '' ? '#EEF2FF' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14,
                    color: '#1F2937',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                  onMouseLeave={(e) => e.currentTarget.style.background = selectedDepartment === '' ? '#EEF2FF' : 'white'}
                >
                  {selectedDepartment === '' && <span style={{ color: '#4F46E5' }}>✓</span>}
                  {t('cvEvaluation.allDepartments')}
                </button>
                
                {departments.map(dept => (
                  <button
                    key={dept.id}
                    onClick={() => { onDepartmentChange(dept.id); setDropdownOpen(false); }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: 'none',
                      background: selectedDepartment === dept.id ? '#EEF2FF' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 14,
                      color: '#1F2937',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = selectedDepartment === dept.id ? '#EEF2FF' : 'white'}
                  >
                    {selectedDepartment === dept.id && <span style={{ color: '#4F46E5' }}>✓</span>}
                    {dept.color && (
                      <span style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: dept.color,
                        flexShrink: 0,
                        marginLeft: selectedDepartment === dept.id ? 0 : 18,
                      }} />
                    )}
                    {dept.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tag Dropdown - Show when talent pool tab is active (Multi-select) */}
        {sourceType === 'talentPool' && (
          <div className="tag-dropdown-container" style={{ position: 'relative', marginBottom: 12 }}>
            <button
              onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: 8,
                fontSize: 14,
                background: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'left',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                {selectedPoolTags.length === 0 ? (
                  <span>{t('cvEvaluation.allTags')}</span>
                ) : selectedPoolTags.length <= 2 ? (
                  // Show tag chips if 1-2 selected
                  selectedPoolTags.map(tagId => {
                    const tag = poolTags.find(t => t.id === tagId);
                    return tag ? (
                      <span
                        key={tag.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 8px',
                          background: `${tag.color}20`,
                          borderRadius: 4,
                          fontSize: 12,
                        }}
                      >
                        <span style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: tag.color,
                        }} />
                        {tag.name}
                      </span>
                    ) : null;
                  })
                ) : (
                  // Show count if more than 2 selected
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    background: '#EEF2FF',
                    borderRadius: 4,
                    fontSize: 12,
                    color: '#4F46E5',
                  }}>
                    {selectedPoolTags.length} {t('cvEvaluation.tagsSelected')}
                  </span>
                )}
              </span>
              <span style={{ 
                transform: tagDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                color: '#6B7280',
                flexShrink: 0,
              }}>▼</span>
            </button>
            
            {tagDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                border: '1px solid #D1D5DB',
                borderRadius: 8,
                marginTop: 4,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 50,
                maxHeight: 300,
                overflowY: 'auto',
              }}>
                {/* Clear Selection Option */}
                <button
                  onClick={() => clearTagSelection()}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: 'none',
                    borderBottom: '1px solid #E5E7EB',
                    background: selectedPoolTags.length === 0 ? '#EEF2FF' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14,
                    color: '#1F2937',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                  onMouseLeave={(e) => e.currentTarget.style.background = selectedPoolTags.length === 0 ? '#EEF2FF' : 'white'}
                >
                  {selectedPoolTags.length === 0 && <span style={{ color: '#4F46E5' }}>✓</span>}
                  <span style={{ marginLeft: selectedPoolTags.length === 0 ? 0 : 18 }}>
                    {t('cvEvaluation.allTags')}
                  </span>
                </button>
                
                {poolTags.map(tag => {
                  const isSelected = selectedPoolTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTagSelection(tag.id)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: 'none',
                        background: isSelected ? '#EEF2FF' : 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 14,
                        color: '#1F2937',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = isSelected ? '#EEF2FF' : 'white'}
                    >
                      {/* Checkbox */}
                      <span style={{
                        width: 16,
                        height: 16,
                        borderRadius: 3,
                        border: isSelected ? 'none' : '2px solid #D1D5DB',
                        background: isSelected ? '#4F46E5' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {isSelected && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                      {tag.color && (
                        <span style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: tag.color,
                          flexShrink: 0,
                        }} />
                      )}
                      {tag.name}
                      {tag.usageCount > 0 && (
                        <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' }}>
                          ({tag.usageCount})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
        {sourceType === 'departments' && !selectedDepartment ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
            {t('cvEvaluation.selectJob')}
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>{t('common.loading')}</div>
        ) : candidates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
            {sourceType === 'talentPool' ? t('cvEvaluation.noCandidatesInPool') : t('cvEvaluation.noCandidatesFound')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Select All Button */}
            <button
              onClick={onSelectAll}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 16px',
                background: allSelected ? '#EEF2FF' : '#F9FAFB',
                border: allSelected ? '2px solid #6366F1' : '1px solid #D1D5DB',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: allSelected ? '#4F46E5' : '#374151',
                cursor: 'pointer',
                marginBottom: 8,
                transition: 'all 0.2s',
              }}
            >
              <CheckCircle2 size={18} color={allSelected ? '#4F46E5' : '#9CA3AF'} />
              {allSelected ? t('cvEvaluation.deselectAll') : t('cvEvaluation.selectAll')}
              <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 400 }}>
                ({candidates.length})
              </span>
            </button>
            
            {candidates.map(candidate => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                isSelected={selectedCandidates.some(c => c.id === candidate.id)}
                onToggle={() => onToggleCandidate(candidate)}
                isFromPool={candidate.isFromPool}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Candidate Card Component
const CandidateCard = ({ candidate, isSelected, onToggle, isFromPool }) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  // Extract last position from parsed_data if available
  const getLastPosition = () => {
    // This would come from parsed_data.experience[0] in real implementation
    // For now, use department as fallback
    if (isFromPool) {
      return t('cvEvaluation.poolCandidateSource');
    }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>
            {candidate.name || 'İsim bilgisi yok'}
          </span>
          {isFromPool && (
            <Sparkles size={14} color="#F59E0B" style={{ flexShrink: 0 }} />
          )}
        </div>
        <div style={{ fontSize: 12, color: '#6B7280' }}>
          {isFromPool ? (
            // Show tags for pool candidates
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {candidate.poolTags?.slice(0, 3).map(tag => (
                <span
                  key={tag.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 6px',
                    background: `${tag.color}20`,
                    color: tag.color,
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                >
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: tag.color,
                  }} />
                  {tag.name}
                </span>
              ))}
              {candidate.poolTags?.length > 3 && (
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                  +{candidate.poolTags.length - 3}
                </span>
              )}
            </div>
          ) : (
            <span>Son Pozisyon: {getLastPosition()}</span>
          )}
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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
            minHeight: 0,
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
              ❌ {t('cvEvaluation.analysisFailed')}
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
