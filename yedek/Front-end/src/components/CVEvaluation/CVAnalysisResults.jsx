/**
 * CV Analysis Results Component
 * Displays AI-powered CV evaluation results with scores and summaries
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useSubscription } from '@apollo/client/react';
import { ArrowLeft, Search, Loader } from 'lucide-react';
import { APPLICATIONS_QUERY, APPLICATION_UPDATES_SUBSCRIPTION } from '../../graphql/applications';
import CandidateDetailModal from './CandidateDetailModal';

const CVAnalysisResults = ({ jobId, selectedJob, selectedCandidates, onBack }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('score-desc');
  const [educationFilter, setEducationFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Fetch real analysis results - NO automatic polling
  const { data, loading, error, refetch } = useQuery(APPLICATIONS_QUERY, {
    variables: { jobId },
    skip: !jobId,
    fetchPolicy: 'cache-and-network',
  });

  // Use subscription for real-time updates instead of polling
  useSubscription(APPLICATION_UPDATES_SUBSCRIPTION, {
    variables: { jobId },
    onData: () => {
      refetch();
    },
  });

  const applications = data?.applications || [];

  // Transform applications to result format
  const results = applications.map(app => {
    const analysisData = app.analysisData || {};
    const breakdown = analysisData.breakdown || {};
    
    const educationLevel = app.candidate?.parsedData?.education?.[0]?.degree || 'N/A';
    const experienceYears = app.candidate?.parsedData?.experience?.length || 0;

    let scoreColor = '#EF4444';
    if (app.overallScore >= 80) scoreColor = '#10B981';
    else if (app.overallScore >= 60) scoreColor = '#F59E0B';

    return {
      id: app.id,
      applicationId: app.id,
      candidateId: app.candidateId,
      candidateName: app.candidate?.name || 'Unknown',
      score: app.overallScore || 0,
      scoreColor,
      summary: analysisData.summary || 'No summary available',
      skills: analysisData.matched_skills || [],
      experience: experienceYears,
      education: educationLevel,
      analysisData: app.analysisData,
      candidate: app.candidate,
      breakdown,
    };
  });

  // Filter and sort results
  let filteredResults = results.filter(result =>
    result.candidateName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (educationFilter !== 'all') {
    filteredResults = filteredResults.filter(r => r.education === educationFilter);
  }

  if (experienceFilter !== 'all') {
    const expRange = experienceFilter.split('-').map(Number);
    filteredResults = filteredResults.filter(r => 
      r.experience >= expRange[0] && r.experience <= expRange[1]
    );
  }

  filteredResults.sort((a, b) => {
    switch (sortBy) {
      case 'score-desc':
        return b.score - a.score;
      case 'score-asc':
        return a.score - b.score;
      case 'education':
        const eduOrder = { 'Yüksek Lisans': 4, 'Lisans': 3, 'Ön Lisans': 2, 'Lise': 1 };
        return (eduOrder[b.education] || 0) - (eduOrder[a.education] || 0);
      case 'experience':
        return b.experience - a.experience;
      default:
        return 0;
    }
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getScoreBarColor = (score) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        padding: 24, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh' 
      }}>
        <Loader size={48} style={{ animation: 'spin 1s linear infinite', color: '#3B82F6' }} />
        <p style={{ marginTop: 16, color: '#6B7280' }}>Loading analysis results...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding: 24 }}>
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
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div style={{
          padding: 24,
          background: '#FEE2E2',
          border: '1px solid #FCA5A5',
          borderRadius: 12,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: '#DC2626', marginBottom: 8 }}>Error Loading Results</h2>
          <p style={{ color: '#991B1B' }}>{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <>
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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1F2937', margin: 0, marginBottom: 8 }}>
            {t('cvEvaluation.resultsTitle', { jobTitle: selectedJob?.title || 'Job Title' })}
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280' }}>
            {t('cvEvaluation.resultsSubtitle')}
          </p>
        </div>

        {/* Filters Section */}
        <div style={{
          background: 'white',
          padding: 20,
          borderRadius: 12,
          border: '1px solid #E5E7EB',
          marginBottom: 20,
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          {/* Search */}
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <Search
              size={18}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}
            />
            <input
              type="text"
              placeholder={t('cvEvaluation.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: 8,
              fontSize: 14,
              outline: 'none',
              cursor: 'pointer',
              background: 'white',
            }}
          >
            <option value="score-desc">{t('cvEvaluation.sortBy')} {t('cvEvaluation.sortHighToLow')}</option>
            <option value="score-asc">{t('cvEvaluation.sortBy')} {t('cvEvaluation.sortLowToHigh')}</option>
            <option value="education">{t('cvEvaluation.educationLevel')}</option>
            <option value="experience">{t('cvEvaluation.experienceYears')}</option>
          </select>

          {/* Education Filter */}
          <select
            value={educationFilter}
            onChange={(e) => setEducationFilter(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: 8,
              fontSize: 14,
              outline: 'none',
              cursor: 'pointer',
              background: 'white',
            }}
          >
            <option value="all">{t('cvEvaluation.educationLevel')}</option>
            <option value="Yüksek Lisans">Yüksek Lisans</option>
            <option value="Lisans">Lisans</option>
            <option value="Ön Lisans">Ön Lisans</option>
            <option value="Lise">Lise</option>
          </select>

          {/* Experience Filter */}
          <select
            value={experienceFilter}
            onChange={(e) => setExperienceFilter(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: 8,
              fontSize: 14,
              outline: 'none',
              cursor: 'pointer',
              background: 'white',
            }}
          >
            <option value="all">{t('cvEvaluation.experienceFilter.all')}</option>
            <option value="0-2">{t('cvEvaluation.experienceFilter.0-2')}</option>
            <option value="3-5">{t('cvEvaluation.experienceFilter.3-5')}</option>
            <option value="6-10">{t('cvEvaluation.experienceFilter.6-10')}</option>
            <option value="11-99">{t('cvEvaluation.experienceFilter.11plus')}</option>
          </select>
        </div>

        {/* Results Table */}
        <div style={{
          flex: 1,
          background: 'white',
          borderRadius: 12,
          border: '1px solid #E5E7EB',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.2fr 2.5fr 1fr',
            padding: '16px 20px',
            background: '#F9FAFB',
            borderBottom: '1px solid #E5E7EB',
            fontSize: 12,
            fontWeight: 600,
            color: '#6B7280',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            <div>{t('cvEvaluation.candidateName')}</div>
            <div>{t('cvEvaluation.compatibilityScore')}</div>
            <div>{t('cvEvaluation.analysisSummary')}</div>
            <div>{t('cvEvaluation.actions')}</div>
          </div>

          {/* Table Body */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {paginatedResults.length === 0 ? (
              <div style={{
                padding: 60,
                textAlign: 'center',
                color: '#9CA3AF',
                fontSize: 14,
              }}>
                {t('cvEvaluation.noResultsFound')}
              </div>
            ) : (
              paginatedResults.map(result => (
                <ResultRow 
                  key={result.id} 
                  result={result} 
                  getScoreBarColor={getScoreBarColor}
                  onViewDetails={() => setSelectedCandidate(result)}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              padding: 16,
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
            }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: 6,
                  background: 'white',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  color: currentPage === 1 ? '#9CA3AF' : '#374151',
                }}
              >
                ‹
              </button>

              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        padding: '8px 12px',
                        border: page === currentPage ? 'none' : '1px solid #E5E7EB',
                        borderRadius: 6,
                        background: page === currentPage ? '#3B82F6' : 'white',
                        color: page === currentPage ? 'white' : '#374151',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: page === currentPage ? 600 : 400,
                      }}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} style={{ color: '#9CA3AF' }}>...</span>;
                }
                return null;
              })}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: 6,
                  background: 'white',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  color: currentPage === totalPages ? '#9CA3AF' : '#374151',
                }}
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <CandidateDetailModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          jobId={jobId}
          application={selectedCandidate}
        />
      )}
    </>
  );
};

// Result Row Component - Simple version
const ResultRow = ({ result, getScoreBarColor, onViewDetails }) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1.2fr 2.5fr 1fr',
        padding: '20px',
        borderBottom: '1px solid #E5E7EB',
        background: isHovered ? '#F9FAFB' : 'white',
        transition: 'background 0.2s',
        alignItems: 'center',
      }}
    >
      {/* Candidate Name */}
      <div style={{ fontSize: 14, fontWeight: 500, color: '#1F2937' }}>
        {result.candidateName}
      </div>

      {/* Score Bar */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{
            flex: 1,
            height: 8,
            background: '#F3F4F6',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${result.score}%`,
              background: getScoreBarColor(result.score),
              transition: 'width 0.3s',
            }} />
          </div>
          <span style={{
            fontSize: 14,
            fontWeight: 700,
            color: result.scoreColor,
            minWidth: 36,
          }}>
            {result.score}%
          </span>
        </div>
      </div>

      {/* Summary */}
      <div style={{
        fontSize: 13,
        color: '#4B5563',
        lineHeight: 1.5,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {result.summary}
      </div>

      {/* Actions */}
      <div>
        <button
          style={{
            padding: '6px 12px',
            background: 'transparent',
            color: '#3B82F6',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={onViewDetails}
        >
          {t('cvEvaluation.viewDetails')}
        </button>
      </div>
    </div>
  );
};

export default CVAnalysisResults;
