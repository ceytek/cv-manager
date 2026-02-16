import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react';
import { Video, FileText, Clock, BarChart2, Download, Eye, MapPin, Briefcase, Building2, List, LayoutGrid, Users, Star, Sparkles, FileCheck, ChevronDown, Check, X, Share2, Link2, Copy, Columns3, BotMessageSquare } from 'lucide-react';
import { APPLICATIONS_QUERY } from '../../graphql/applications';
import { 
  TOGGLE_SHORTLIST, BULK_TOGGLE_SHORTLIST, CREATE_SHORTLIST_SHARE, LIST_TYPES,
  TOGGLE_LONGLIST, BULK_TOGGLE_LONGLIST 
} from '../../graphql/shortlist';
import CandidateDetailModal from './CandidateDetailModal';
import LikertResultsModal from './LikertResultsModal';
import InterviewResultsModal from './InterviewResultsModal';
import CandidateHistoryModal from './CandidateHistoryModal';
import JobPreviewModal from '../JobForm/JobPreviewModal';
import SecondInterviewInviteModal from '../SecondInterviewInviteModal';
import SecondInterviewFeedbackModal from '../SecondInterviewFeedbackModal';
import SendRejectionModal from '../SendRejectionModal';
import LikertInviteModal from '../LikertInviteModal';
import { API_BASE_URL } from '../../config/api';
import { GET_SECOND_INTERVIEW_BY_APPLICATION } from '../../graphql/secondInterview';
import { GET_OFFER_BY_APPLICATION, UPDATE_OFFER_STATUS } from '../../graphql/offer';
import OfferPreviewModal from '../OfferPreviewModal';
import ShortlistNoteModal from '../ShortlistNoteModal';
import ShortlistShareModal from '../ShortlistShareModal';
import LonglistShareModal from '../LonglistShareModal';
import PipelineView from './PipelineView';
import CreateOfferModal from '../CreateOfferModal';
import { getInitials } from '../../utils/nameUtils';

// Reuse data coming from parent job
const JobDetails = ({ job, onBack, departments, newlyAnalyzedCandidateIds = [] }) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const pageSize = viewMode === 'list' ? 10 : 8; // 8 cards per page (4x2 grid)
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  
  // Modal states
  const [showLikertResults, setShowLikertResults] = useState(false);
  const [showInterviewResults, setShowInterviewResults] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showJobDetail, setShowJobDetail] = useState(false);
  const [showSecondInterviewInvite, setShowSecondInterviewInvite] = useState(false);
  const [showSecondInterviewFeedback, setShowSecondInterviewFeedback] = useState(false);
  const [secondInterviewData, setSecondInterviewData] = useState(null);
  const [showSendRejection, setShowSendRejection] = useState(false);
  const [showLikertInvite, setShowLikertInvite] = useState(false);
  
  // CV Preview state
  const [cvPreviewUrl, setCvPreviewUrl] = useState(null);
  const [cvPreviewName, setCvPreviewName] = useState('');

  // Offer related states
  const [offerDropdownOpen, setOfferDropdownOpen] = useState(null); // application id
  const [showOfferPreview, setShowOfferPreview] = useState(false);
  const [selectedOfferData, setSelectedOfferData] = useState(null);
  const offerDropdownRef = useRef(null);
  
  // Pipeline → Create Offer modal
  const [pipelineOfferApp, setPipelineOfferApp] = useState(null); // application object for offer modal

  // Shortlist (Long List / Short List) states
  const [listType, setListType] = useState(LIST_TYPES.ALL); // 'all', 'longlist', 'shortlist'
  const [selectedApplicationIds, setSelectedApplicationIds] = useState([]); // for bulk selection
  const [showShortlistNote, setShowShortlistNote] = useState(false);
  const [shortlistNoteTarget, setShortlistNoteTarget] = useState(null); // application for note
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLonglistShareModal, setShowLonglistShareModal] = useState(false);

  // Offer queries and mutations
  const [fetchOffer] = useLazyQuery(GET_OFFER_BY_APPLICATION, { fetchPolicy: 'network-only' });
  const [updateOfferStatus] = useMutation(UPDATE_OFFER_STATUS);
  
  // Longlist mutations
  const [toggleLonglist] = useMutation(TOGGLE_LONGLIST);
  const [bulkToggleLonglist] = useMutation(BULK_TOGGLE_LONGLIST);
  
  // Shortlist mutations
  const [toggleShortlist] = useMutation(TOGGLE_SHORTLIST);
  const [bulkToggleShortlist] = useMutation(BULK_TOGGLE_SHORTLIST);
  const [createShortlistShare] = useMutation(CREATE_SHORTLIST_SHARE);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (offerDropdownRef.current && !offerDropdownRef.current.contains(event.target)) {
        setOfferDropdownOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data, loading, error, refetch } = useQuery(APPLICATIONS_QUERY, {
    variables: { jobId: job?.id },
    skip: !job?.id,
    fetchPolicy: 'cache-and-network',
  });

  const allApplications = data?.applications || [];
  const departmentName = job?.department?.name || '-';
  
  // Helper to check if app is hired (offer accepted)
  const isHired = (app) => {
    return app.status?.toUpperCase() === 'OFFER_ACCEPTED';
  };

  // Helper to check if app has pending offer status (sent or rejected, NOT accepted)
  const hasPendingOfferStatus = (app) => {
    const status = app.status?.toUpperCase();
    return status === 'OFFER_SENT' || status === 'OFFER_REJECTED';
  };

  // Helper to check any offer status (for filtering from other tabs)
  const hasAnyOfferStatus = (app) => {
    const status = app.status?.toUpperCase();
    return status === 'OFFER_SENT' || status === 'OFFER_ACCEPTED' || status === 'OFFER_REJECTED';
  };

  // Filter applications based on list type
  // A candidate can only be in ONE tab at a time
  // Priority: Hired > Offer > Short List > Long List > Pool
  // - İşe Alınanlar: OFFER_ACCEPTED (highest priority)
  // - Teklif Verilenler: OFFER_SENT or OFFER_REJECTED
  // - Short List: in shortlist AND no offer
  // - Long List: in longlist AND not in shortlist AND no offer
  // - Tümü (Pool): not in longlist AND not in shortlist AND no offer
  const applications = useMemo(() => {
    if (listType === LIST_TYPES.HIRED) {
      return allApplications.filter(app => isHired(app));
    }
    if (listType === LIST_TYPES.OFFER) {
      return allApplications.filter(app => hasPendingOfferStatus(app));
    }
    if (listType === LIST_TYPES.SHORT_LIST) {
      return allApplications.filter(app => app.isShortlisted && !hasAnyOfferStatus(app));
    } else if (listType === LIST_TYPES.LONG_LIST) {
      return allApplications.filter(app => app.isInLonglist && !app.isShortlisted && !hasAnyOfferStatus(app));
    }
    // Tümü (Pool): not in longlist AND not in shortlist AND no offer
    return allApplications.filter(app => !app.isInLonglist && !app.isShortlisted && !hasAnyOfferStatus(app));
  }, [allApplications, listType]);
  
  // Count for tabs - each candidate only counted in ONE tab
  const hiredCount = allApplications.filter(app => isHired(app)).length;
  const offerCount = allApplications.filter(app => hasPendingOfferStatus(app)).length;
  const shortlistCount = allApplications.filter(app => app.isShortlisted && !hasAnyOfferStatus(app)).length;
  const longlistCount = allApplications.filter(app => app.isInLonglist && !app.isShortlisted && !hasAnyOfferStatus(app)).length;
  const poolCount = allApplications.filter(app => !app.isInLonglist && !app.isShortlisted && !hasAnyOfferStatus(app)).length;
  
  const totalPages = Math.max(1, Math.ceil(applications.length / pageSize));
  const pageItems = useMemo(() => applications.slice((page - 1) * pageSize, page * pageSize), [applications, page, pageSize]);
  
  // Reset page when list type changes
  useEffect(() => {
    setPage(1);
    setSelectedApplicationIds([]);
  }, [listType]);

  const badge = (label, bg, color) => (
    <span style={{ background: bg, color, padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{label}</span>
  );

  const statusBadge = (s) => {
    const v = (s || '').toLowerCase();
    if (v === 'analyzed' || v === 'accepted') return badge(t('jobDetails.statusEvaluated'), '#D1FAE5', '#065F46');
    if (v === 'rejected') return badge(t('jobDetails.statusRejected'), '#FEE2E2', '#991B1B');
    if (v === 'reviewed') return badge(t('jobDetails.statusReviewed'), '#DBEAFE', '#1E3A8A');
    return badge(t('jobDetails.statusPending'), '#FEF3C7', '#92400E');
  };

  const getScoreColor = (n) => (n >= 80 ? '#10B981' : n >= 60 ? '#F59E0B' : '#EF4444');

  // Get the latest session status for display
  // Priority: Active Interview > Rejection > Completed Interview > Likert > AI Interview
  const getLatestSessionStatus = (app) => {
    // PRIORITY 1: Active invitations (pending/in_progress states) - highest priority
    // This allows re-inviting candidates even after rejection
    
    // Second Interview - invited
    if (app.hasSecondInterview && app.secondInterviewStatus === 'invited') {
      return { text: t('jobDetails.sessionStatus.secondInterviewInvited', 'Mülakat Daveti'), color: '#8B5CF6', bg: '#EDE9FE' };
    }
    
    // Likert Test - pending/in_progress
    if (app.hasLikertSession && (app.likertSessionStatus === 'pending' || app.likertSessionStatus === 'in_progress')) {
      if (app.likertSessionStatus === 'in_progress') {
        return { text: t('jobDetails.sessionStatus.likertInProgress'), color: '#3B82F6', bg: '#DBEAFE' };
      }
      return { text: t('jobDetails.sessionStatus.likertSent'), color: '#8B5CF6', bg: '#EDE9FE' };
    }
    
    // AI Interview - pending/in_progress
    if (app.hasInterviewSession && (app.interviewSessionStatus === 'pending' || app.interviewSessionStatus === 'in_progress')) {
      if (app.interviewSessionStatus === 'in_progress') {
        return { text: t('jobDetails.sessionStatus.interviewInProgress'), color: '#3B82F6', bg: '#DBEAFE' };
      }
      return { text: t('jobDetails.sessionStatus.interviewSent'), color: '#8B5CF6', bg: '#EDE9FE' };
    }
    
    // PRIORITY 2: Second Interview completed/no_show/cancelled statuses
    if (app.secondInterviewStatus === 'completed') {
      if (app.secondInterviewOutcome === 'passed') {
        return { text: t('jobDetails.sessionStatus.secondInterviewPassed', 'Mülakat Başarılı'), color: '#10B981', bg: '#D1FAE5' };
      }
      if (app.secondInterviewOutcome === 'rejected') {
        return { text: t('jobDetails.sessionStatus.secondInterviewRejected', 'Mülakat Red'), color: '#DC2626', bg: '#FEE2E2' };
      }
      if (app.secondInterviewOutcome === 'pending_likert') {
        return { text: t('jobDetails.sessionStatus.secondInterviewLikert', 'Mülakat → Likert'), color: '#3B82F6', bg: '#DBEAFE' };
      }
      return { text: t('jobDetails.sessionStatus.secondInterviewCompleted', 'Mülakat Tamamlandı'), color: '#10B981', bg: '#D1FAE5' };
    }
    if (app.secondInterviewStatus === 'no_show') {
      return { text: t('jobDetails.sessionStatus.secondInterviewNoShow', 'Mülakat - Gelmedi'), color: '#F59E0B', bg: '#FEF3C7' };
    }
    if (app.secondInterviewStatus === 'cancelled') {
      return { text: t('jobDetails.sessionStatus.secondInterviewCancelled', 'Mülakat İptal'), color: '#6B7280', bg: '#F3F4F6' };
    }
    
    // PRIORITY 3: Check offer sent status
    if (app.status?.toUpperCase() === 'OFFER_SENT') {
      return { text: t('jobDetails.sessionStatus.offerSent', 'Teklif Gönderildi'), color: '#10B981', bg: '#D1FAE5' };
    }
    if (app.status?.toUpperCase() === 'OFFER_ACCEPTED') {
      return { text: t('jobDetails.sessionStatus.offerAccepted', 'Teklif Kabul Edildi'), color: '#059669', bg: '#D1FAE5' };
    }
    if (app.status?.toUpperCase() === 'OFFER_REJECTED') {
      return { text: t('jobDetails.sessionStatus.offerRejected', 'Teklif Reddedildi'), color: '#DC2626', bg: '#FEE2E2' };
    }
    
    // PRIORITY 4: Check rejection (but only if no active invitation)
    if (app.status?.toUpperCase() === 'REJECTED' || app.rejectedAt) {
      return { text: t('jobDetails.sessionStatus.rejected', 'Reddedildi'), color: '#DC2626', bg: '#FEE2E2' };
    }
    
    // PRIORITY 4: Completed/Expired states (not active)
    if (app.likertSessionStatus === 'completed') {
      return { text: t('jobDetails.sessionStatus.likertCompleted'), color: '#10B981', bg: '#D1FAE5' };
    }
    if (app.likertSessionStatus === 'expired') {
      return { text: t('jobDetails.sessionStatus.likertExpired'), color: '#EF4444', bg: '#FEE2E2' };
    }
    
    if (app.interviewSessionStatus === 'completed') {
      return { text: t('jobDetails.sessionStatus.interviewCompleted'), color: '#10B981', bg: '#D1FAE5' };
    }
    if (app.interviewSessionStatus === 'expired') {
      return { text: t('jobDetails.sessionStatus.interviewExpired'), color: '#EF4444', bg: '#FEE2E2' };
    }
    
    // Default: CV analyzed
    return { text: t('jobDetails.sessionStatus.cvAnalyzed'), color: '#6B7280', bg: '#F3F4F6' };
  };

  // Check if application has offer status
  const isOfferStatus = (app) => {
    const status = app.status?.toUpperCase();
    return status === 'OFFER_SENT' || status === 'OFFER_ACCEPTED' || status === 'OFFER_REJECTED';
  };

  // Handle viewing offer
  const handleViewOffer = async (applicationId) => {
    try {
      const result = await fetchOffer({ variables: { applicationId } });
      if (result.data?.offerByApplication) {
        setSelectedOfferData(result.data.offerByApplication);
        setShowOfferPreview(true);
      }
    } catch (error) {
      console.error('Error fetching offer:', error);
    }
    setOfferDropdownOpen(null);
  };

  // Handle updating offer status (accept/reject)
  const handleUpdateOfferStatus = async (applicationId, newStatus) => {
    try {
      // First get the offer ID
      const result = await fetchOffer({ variables: { applicationId } });
      if (result.data?.offerByApplication?.id) {
        const offerId = result.data.offerByApplication.id;
        const updateResult = await updateOfferStatus({
          variables: { offerId, status: newStatus }
        });
        if (updateResult.data?.updateOfferStatus?.success) {
          refetch(); // Refresh the applications list
          
          // Switch to HIRED tab when offer is accepted
          if (newStatus === 'accepted') {
            setListType(LIST_TYPES.HIRED);
          }
          
          alert(newStatus === 'accepted' 
            ? t('offer.acceptedSuccess', 'Teklif kabul edildi olarak işaretlendi')
            : t('offer.rejectedSuccess', 'Teklif reddedildi olarak işaretlendi')
          );
        } else {
          alert(updateResult.data?.updateOfferStatus?.message || 'Error updating offer status');
        }
      }
    } catch (error) {
      console.error('Error updating offer status:', error);
      alert('Error updating offer status');
    }
    setOfferDropdownOpen(null);
  };

  // ==========================================
  // Longlist Handlers
  // ==========================================
  
  // Toggle longlist for single application (from Pool to Long List or remove)
  const handleToggleLonglist = async (applicationId, note = null) => {
    try {
      const result = await toggleLonglist({
        variables: { input: { applicationId, note } }
      });
      if (result.data?.toggleLonglist?.success) {
        refetch();
      } else {
        alert(result.data?.toggleLonglist?.message || 'Error toggling longlist');
      }
    } catch (error) {
      console.error('Error toggling longlist:', error);
    }
  };
  
  // Bulk toggle longlist
  const handleBulkToggleLonglist = async (addToLonglist, note = null) => {
    if (selectedApplicationIds.length === 0) return;
    
    try {
      const result = await bulkToggleLonglist({
        variables: { 
          input: { 
            applicationIds: selectedApplicationIds, 
            addToLonglist,
            note 
          } 
        }
      });
      if (result.data?.bulkToggleLonglist?.success) {
        refetch();
        setSelectedApplicationIds([]);
        alert(result.data.bulkToggleLonglist.message);
      } else {
        alert(result.data?.bulkToggleLonglist?.message || 'Error updating longlist');
      }
    } catch (error) {
      console.error('Error bulk toggling longlist:', error);
    }
  };

  // ==========================================
  // Shortlist Handlers
  // ==========================================
  
  // Toggle shortlist for single application (from Long List to Short List or remove to Pool)
  const handleToggleShortlist = async (applicationId, note = null) => {
    try {
      const result = await toggleShortlist({
        variables: { input: { applicationId, note } }
      });
      if (result.data?.toggleShortlist?.success) {
        refetch();
      } else {
        alert(result.data?.toggleShortlist?.message || 'Error toggling shortlist');
      }
    } catch (error) {
      console.error('Error toggling shortlist:', error);
    }
  };
  
  // Open note modal before adding to shortlist
  const handleAddToShortlistWithNote = (applicationId) => {
    setShortlistNoteTarget(applicationId);
    setShowShortlistNote(true);
  };
  
  // Confirm adding to shortlist with note
  const handleConfirmShortlistNote = async (note) => {
    if (shortlistNoteTarget) {
      await handleToggleShortlist(shortlistNoteTarget, note);
    }
    setShowShortlistNote(false);
    setShortlistNoteTarget(null);
  };
  
  // Bulk toggle shortlist
  const handleBulkToggleShortlist = async (addToShortlist, note = null) => {
    if (selectedApplicationIds.length === 0) return;
    
    try {
      const result = await bulkToggleShortlist({
        variables: { 
          input: { 
            applicationIds: selectedApplicationIds, 
            addToShortlist,
            note 
          } 
        }
      });
      if (result.data?.bulkToggleShortlist?.success) {
        refetch();
        setSelectedApplicationIds([]);
        alert(result.data.bulkToggleShortlist.message);
      } else {
        alert(result.data?.bulkToggleShortlist?.message || 'Error updating shortlist');
      }
    } catch (error) {
      console.error('Error bulk toggling shortlist:', error);
    }
  };
  
  // Toggle selection for single application
  const handleToggleSelection = (applicationId) => {
    setSelectedApplicationIds(prev => 
      prev.includes(applicationId)
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    );
  };
  
  // Select/deselect all on current page
  const handleToggleSelectAll = () => {
    const pageAppIds = pageItems.map(app => app.id);
    const allSelected = pageAppIds.every(id => selectedApplicationIds.includes(id));
    
    if (allSelected) {
      setSelectedApplicationIds(prev => prev.filter(id => !pageAppIds.includes(id)));
    } else {
      setSelectedApplicationIds(prev => [...new Set([...prev, ...pageAppIds])]);
    }
  };
  
  // Check if all on page are selected
  const isAllPageSelected = pageItems.length > 0 && pageItems.every(app => selectedApplicationIds.includes(app.id));
  const isSomePageSelected = pageItems.some(app => selectedApplicationIds.includes(app.id));

  // ==========================================
  // Pipeline Drag-and-Drop Handler
  // ==========================================
  const handleMoveToStage = async (applicationId, fromStage, toStage) => {
    try {
      // Define allowed transitions and execute corresponding mutations
      // Pool → Long List
      if (fromStage === 'all' && toStage === 'longlist') {
        await handleToggleLonglist(applicationId);
      }
      // Long List → Short List
      else if (fromStage === 'longlist' && toStage === 'shortlist') {
        await handleToggleShortlist(applicationId);
      }
      // Long List → Pool (remove from longlist)
      else if (fromStage === 'longlist' && toStage === 'all') {
        await handleToggleLonglist(applicationId);
      }
      // Short List → Pool (remove from shortlist, which moves to pool)
      else if (fromStage === 'shortlist' && toStage === 'all') {
        await handleToggleShortlist(applicationId);
      }
      // Short List → Long List (remove from shortlist = back to longlist since isInLonglist stays true)
      else if (fromStage === 'shortlist' && toStage === 'longlist') {
        await handleToggleShortlist(applicationId);
      }
      // Pool → Short List (need to add to longlist first, then shortlist)
      else if (fromStage === 'all' && toStage === 'shortlist') {
        await handleToggleLonglist(applicationId);
        // Small delay to ensure longlist is set before shortlisting
        setTimeout(async () => {
          await handleToggleShortlist(applicationId);
        }, 300);
      }
      // Offer → Hired (manually accept the offer)
      else if (fromStage === 'offer' && toStage === 'hired') {
        // Find the offer for this application and set it to accepted
        const result = await fetchOffer({ variables: { applicationId } });
        if (result.data?.offerByApplication?.id) {
          const offerId = result.data.offerByApplication.id;
          const updateResult = await updateOfferStatus({
            variables: { offerId, status: 'accepted' }
          });
          if (updateResult.data?.updateOfferStatus?.success) {
            refetch();
          }
        }
      }
      // Unsupported move
      else {
        console.warn(`Unsupported move: ${fromStage} → ${toStage}`);
      }
    } catch (error) {
      console.error('Error moving candidate to stage:', error);
    }
  };

  // Pipeline → Open Create Offer modal when dragging to Offer stage
  const handlePipelineOpenOffer = (applicationId) => {
    const app = allApplications.find(a => a.id === applicationId);
    if (app) {
      setPipelineOfferApp(app);
    }
  };

  // Pipeline card click handlers
  const handlePipelineClickCandidate = (app) => {
    setSelectedCandidate({
      ...app,
      id: app.id,
      applicationId: app.id,
      candidateId: app.candidateId,
      candidateName: app.candidate?.name,
      score: app.overallScore || 0,
      analysisData: app.analysisData || {},
      candidate: app.candidate,
    });
  };

  const handlePipelineClickHistory = (app) => {
    setSelectedApp(app);
    setShowHistory(true);
  };

  return (
    <div style={{ padding: 24 }}>
      <button onClick={onBack} style={{ padding: '8px 16px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', fontSize: 14, marginBottom: 16 }}>{t('jobDetails.backToJobs')}</button>

      {/* Job header - Simplified */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, marginBottom: 12 }}>{job?.title}</h1>
          <button 
            onClick={() => setShowJobDetail(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6, 
              padding: '8px 16px', 
              background: '#3B82F6', 
              color: 'white', 
              border: 'none', 
              borderRadius: 8, 
              cursor: 'pointer', 
              fontSize: 14,
              fontWeight: 500 
            }}
          >
            <Eye size={16} />
            {t('jobDetails.viewDetail')}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 24, color: '#374151', fontSize: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={16} color="#6B7280" />
            <span>{job?.location || '-'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Briefcase size={16} color="#6B7280" />
            <span>{job?.employmentType || '-'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building2 size={16} color="#6B7280" />
            <span>{departmentName}</span>
          </div>
        </div>
      </div>

      {/* Applications list */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'visible' }}>
        {/* Header with Title, Tabs, and Controls */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #E5E7EB' }}>
          {/* Top row: Title and Share button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>
              {t('jobDetails.cvAnalyses', { count: allApplications.length })}
            </div>
            
            {/* Share buttons container */}
            <div style={{ display: 'flex', gap: 8 }}>
              {/* Share Long List button - only show if there are longlist candidates */}
              {longlistCount > 0 && (
                <button
                  onClick={() => setShowLonglistShareModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <Share2 size={15} />
                  {t('longlist.share', 'Long List Paylaş')}
                </button>
              )}
              
              {/* Share Short List button - only show if there are shortlisted candidates */}
              {shortlistCount > 0 && (
                <button
                  onClick={() => setShowShareModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <Share2 size={15} />
                  {t('shortlist.share', 'Short List Paylaş')}
                </button>
              )}
            </div>
          </div>
          
          {/* Bottom row: Tabs and View Mode */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* List Type Tabs - hidden in pipeline mode */}
            <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 10, padding: 4, opacity: viewMode === 'pipeline' ? 0.4 : 1, pointerEvents: viewMode === 'pipeline' ? 'none' : 'auto' }}>
              <button
                onClick={() => setListType(LIST_TYPES.ALL)}
                style={{
                  padding: '8px 16px',
                  background: listType === LIST_TYPES.ALL ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  color: listType === LIST_TYPES.ALL ? '#111827' : '#6B7280',
                  boxShadow: listType === LIST_TYPES.ALL ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {t('shortlist.pool', 'Tümü')} ({poolCount})
              </button>
              <button
                onClick={() => setListType(LIST_TYPES.LONG_LIST)}
                style={{
                  padding: '8px 16px',
                  background: listType === LIST_TYPES.LONG_LIST ? 'linear-gradient(135deg, #DBEAFE, #BFDBFE)' : 'transparent',
                  border: listType === LIST_TYPES.LONG_LIST ? '1px solid #3B82F6' : 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: listType === LIST_TYPES.LONG_LIST ? 600 : 500,
                  color: listType === LIST_TYPES.LONG_LIST ? '#1D4ED8' : '#6B7280',
                  boxShadow: listType === LIST_TYPES.LONG_LIST ? '0 1px 3px rgba(59, 130, 246, 0.2)' : 'none',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <List size={14} color={listType === LIST_TYPES.LONG_LIST ? '#3B82F6' : '#6B7280'} />
                Long List ({longlistCount})
              </button>
              <button
                onClick={() => setListType(LIST_TYPES.SHORT_LIST)}
                style={{
                  padding: '8px 16px',
                  background: listType === LIST_TYPES.SHORT_LIST ? 'linear-gradient(135deg, #FEF3C7, #FDE68A)' : 'transparent',
                  border: listType === LIST_TYPES.SHORT_LIST ? '1px solid #F59E0B' : 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  color: listType === LIST_TYPES.SHORT_LIST ? '#B45309' : '#6B7280',
                  boxShadow: listType === LIST_TYPES.SHORT_LIST ? '0 1px 3px rgba(245, 158, 11, 0.2)' : 'none',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Star size={14} fill={listType === LIST_TYPES.SHORT_LIST ? '#F59E0B' : 'none'} />
                Short List ({shortlistCount})
              </button>
              <button
                onClick={() => setListType(LIST_TYPES.OFFER)}
                style={{
                  padding: '8px 16px',
                  background: listType === LIST_TYPES.OFFER ? 'linear-gradient(135deg, #D1FAE5, #A7F3D0)' : 'transparent',
                  border: listType === LIST_TYPES.OFFER ? '1px solid #10B981' : 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: listType === LIST_TYPES.OFFER ? 600 : 500,
                  color: listType === LIST_TYPES.OFFER ? '#065F46' : '#6B7280',
                  boxShadow: listType === LIST_TYPES.OFFER ? '0 1px 3px rgba(16, 185, 129, 0.2)' : 'none',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Check size={14} color={listType === LIST_TYPES.OFFER ? '#10B981' : '#6B7280'} />
                {t('offer.tab', 'Teklif Verilenler')} ({offerCount})
              </button>
              <button
                onClick={() => setListType(LIST_TYPES.HIRED)}
                style={{
                  padding: '8px 16px',
                  background: listType === LIST_TYPES.HIRED ? 'linear-gradient(135deg, #DBEAFE, #BFDBFE)' : 'transparent',
                  border: listType === LIST_TYPES.HIRED ? '1px solid #3B82F6' : 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: listType === LIST_TYPES.HIRED ? 600 : 500,
                  color: listType === LIST_TYPES.HIRED ? '#1D4ED8' : '#6B7280',
                  boxShadow: listType === LIST_TYPES.HIRED ? '0 1px 3px rgba(59, 130, 246, 0.2)' : 'none',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Users size={14} color={listType === LIST_TYPES.HIRED ? '#3B82F6' : '#6B7280'} />
                {t('hired.tab', 'İşe Alınanlar')} ({hiredCount})
              </button>
            </div>
            
            {/* View Mode Toggle */}
            <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 8, padding: 4 }}>
              <button
                onClick={() => { setViewMode('list'); setPage(1); }}
                style={{
                  padding: '6px 12px',
                  background: viewMode === 'list' ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  color: viewMode === 'list' ? '#111827' : '#6B7280',
                  boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <List size={16} />
                {t('jobDetails.listView', 'Liste')}
              </button>
              <button
                onClick={() => { setViewMode('grid'); setPage(1); }}
                style={{
                  padding: '6px 12px',
                  background: viewMode === 'grid' ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  color: viewMode === 'grid' ? '#111827' : '#6B7280',
                  boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <LayoutGrid size={16} />
                {t('jobDetails.gridView', 'Kart')}
              </button>
              <button
                onClick={() => { setViewMode('pipeline'); }}
                style={{
                  padding: '6px 12px',
                  background: viewMode === 'pipeline' ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  color: viewMode === 'pipeline' ? '#111827' : '#6B7280',
                  boxShadow: viewMode === 'pipeline' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <Columns3 size={16} />
                Pipeline
              </button>
            </div>
          </div>
        </div>
        
        {/* Bulk Selection Toolbar - Only show when items are selected */}
        {selectedApplicationIds.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
            borderBottom: '1px solid #93C5FD',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#1D4ED8' }}>
                {selectedApplicationIds.length} {t('shortlist.selected', 'aday seçildi')}
              </span>
              <button
                onClick={() => setSelectedApplicationIds([])}
                style={{
                  padding: '4px 8px',
                  background: 'transparent',
                  border: '1px solid #93C5FD',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12,
                  color: '#1D4ED8',
                }}
              >
                {t('shortlist.clearSelection', 'Seçimi Temizle')}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {/* Tümü tab'ında: Sadece "Long List'e Ekle" */}
              {listType === LIST_TYPES.ALL && (
                <button
                  onClick={() => handleBulkToggleLonglist(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  <List size={14} />
                  {t('longlist.addToLonglist', 'Long List\'e Ekle')}
                </button>
              )}
              
              {/* Long List tab'ında: "Short List'e Ekle" + "Long List'ten Çıkar" */}
              {listType === LIST_TYPES.LONG_LIST && (
                <>
                  <button
                    onClick={() => handleBulkToggleShortlist(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    <Star size={14} />
                    {t('shortlist.addToShortlist', 'Short List\'e Ekle')}
                  </button>
                  <button
                    onClick={() => handleBulkToggleLonglist(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      background: '#6B7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    <X size={14} />
                    {t('longlist.removeFromLonglist', 'Long List\'ten Çıkar')}
                  </button>
                </>
              )}
              
              {/* Short List tab'ında: Sadece "Short List'ten Çıkar" */}
              {listType === LIST_TYPES.SHORT_LIST && (
                <button
                  onClick={() => handleBulkToggleShortlist(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    background: '#DC2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  <X size={14} />
                  {t('shortlist.removeFromShortlist', 'Short List\'ten Çıkar')}
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* ============ PIPELINE VIEW ============ */}
        {viewMode === 'pipeline' ? (
          loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>{t('common.loading')}</div>
          ) : error ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#DC2626' }}>{t('common.error')}: {error.message}</div>
          ) : (
            <PipelineView
              allApplications={allApplications}
              onMoveToStage={handleMoveToStage}
              onClickCandidate={handlePipelineClickCandidate}
              onClickHistory={handlePipelineClickHistory}
              onPreviewCV={(url, name) => { setCvPreviewUrl(url); setCvPreviewName(name); }}
              getScoreColor={getScoreColor}
              getLatestSessionStatus={getLatestSessionStatus}
              isHired={isHired}
              hasPendingOfferStatus={hasPendingOfferStatus}
              hasAnyOfferStatus={hasAnyOfferStatus}
              onOpenOfferModal={handlePipelineOpenOffer}
            />
          )
        ) : (
        <>
        {/* Table Header - Only for List View */}
        {viewMode === 'list' && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '40px 30px 2.2fr 1fr 1.4fr 0.5fr 1.3fr 155px', 
            padding: '14px 24px', 
            borderBottom: '1px solid #E5E7EB',
            fontSize: 12, 
            fontWeight: 500, 
            color: '#6B7280',
            alignItems: 'center',
          }}>
            {/* Checkbox header */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <input
                type="checkbox"
                checked={isAllPageSelected}
                onChange={handleToggleSelectAll}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#3B82F6' }}
                title={isAllPageSelected ? t('shortlist.deselectAll', 'Tümünü Kaldır') : t('shortlist.selectAll', 'Tümünü Seç')}
              />
            </div>
            {/* Star header */}
            <div></div>
            <div>{t('jobDetails.candidate')}</div>
            <div>{t('jobDetails.analysisDate')}</div>
            <div>{t('jobDetails.compatibilityScore')}</div>
            <div></div>
            <div>{t('jobDetails.lastStatus')}</div>
            <div></div>
          </div>
        )}

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>{t('common.loading')}</div>
        ) : error ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#DC2626' }}>{t('common.error')}: {error.message}</div>
        ) : pageItems.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>{t('jobDetails.noAnalysisFound')}</div>
        ) : viewMode === 'grid' ? (
          /* ============ GRID VIEW ============ */
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: 20, 
            padding: 24,
          }}>
            {pageItems.map((app, index) => {
              const candidateName = app.candidate?.name || '—';
              const initials = getInitials(candidateName);
              const avatarColors = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444'];
              const avatarColor = avatarColors[index % avatarColors.length];
              const status = getLatestSessionStatus(app);
              const score = app.overallScore || 0;
              const isNewlyAnalyzedCard = newlyAnalyzedCandidateIds.includes(app.candidate?.id);
              
              return (
                <div 
                  key={app.id}
                  style={{
                    background: isNewlyAnalyzedCard ? 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 50%, white 100%)' : 'white',
                    border: isNewlyAnalyzedCard ? '2px solid #F59E0B' : '1px solid #E5E7EB',
                    borderRadius: 16,
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    boxShadow: isNewlyAnalyzedCard ? '0 4px 12px rgba(245, 158, 11, 0.2)' : 'none',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3B82F6';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = isNewlyAnalyzedCard ? '#F59E0B' : '#E5E7EB';
                    e.currentTarget.style.boxShadow = isNewlyAnalyzedCard ? '0 4px 12px rgba(245, 158, 11, 0.2)' : 'none';
                  }}
                >
                  {/* NEW badge for newly analyzed candidates */}
                  {isNewlyAnalyzedCard && (
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                      color: 'white',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 6,
                      letterSpacing: '0.5px',
                      boxShadow: '0 2px 4px rgba(217, 119, 6, 0.3)',
                      textTransform: 'uppercase',
                    }}>
                      NEW
                    </div>
                  )}
                  {/* Avatar */}
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: avatarColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 20,
                    marginBottom: 16,
                  }}>
                    {initials}
                  </div>
                  
                  {/* Name */}
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: 15, 
                    color: '#111827',
                    marginBottom: 4,
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}>
                    {candidateName}
                    {app.candidate?.inTalentPool && (
                      <span 
                        title={
                          app.candidate?.talentPoolTags?.length > 0
                            ? `${t('jobDetails.inTalentPool', 'Yetenek Havuzunda')}: ${app.candidate.talentPoolTags.map(tag => tag.name).join(', ')}`
                            : t('jobDetails.inTalentPool', 'Yetenek Havuzunda')
                        }
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: '#FEF3C7',
                          border: '2px solid #F59E0B',
                          cursor: 'help',
                        }}
                      >
                        <Star size={12} fill="#D97706" color="#D97706" />
                      </span>
                    )}
                  </div>
                  
                  {/* Email */}
                  <div style={{ 
                    fontSize: 12, 
                    color: '#9CA3AF',
                    marginBottom: 12,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {app.candidate?.email || '-'}
                  </div>
                  
                  {/* Status Badge */}
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    background: 'white',
                    border: `1px solid ${status.color}`,
                    color: status.color,
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 500,
                    marginBottom: 20,
                  }}>
                    {status.text}
                  </span>
                  
                  {/* Score Section */}
                  <div style={{ width: '100%', marginBottom: 20 }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: 8,
                    }}>
                      <span style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {t('jobDetails.compatibility', 'UYUMLULUK')}
                      </span>
                      <span style={{ 
                        fontSize: 16, 
                        fontWeight: 700, 
                        color: getScoreColor(score),
                      }}>
                        {score}%
                      </span>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: 6, 
                      background: '#E5E7EB', 
                      borderRadius: 3, 
                      overflow: 'hidden',
                    }}>
                      <div style={{ 
                        width: `${score}%`, 
                        height: '100%', 
                        background: getScoreColor(score), 
                        borderRadius: 3,
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: 16,
                    paddingTop: 16,
                    borderTop: '1px solid #F3F4F6',
                    width: '100%',
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedApp(app);
                        setShowHistory(true);
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 8,
                        borderRadius: 8,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Clock size={18} color="#6B7280" />
                      <span style={{ fontSize: 10, color: '#6B7280' }}>{t('jobDetails.timeline', 'Timeline')}</span>
                    </button>
                    
                    {app.candidate?.cvFilePath && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCvPreviewUrl(`${API_BASE_URL}${app.candidate.cvFilePath.replace('/app', '')}`);
                          setCvPreviewName(app.candidate?.name || 'CV');
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 8,
                          borderRadius: 8,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#FEF3C7'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <Eye size={18} color="#F59E0B" />
                        <span style={{ fontSize: 10, color: '#6B7280' }}>CV</span>
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCandidate({
                          ...app, // Include all fields from app including status
                          id: app.id,
                          applicationId: app.id,
                          candidateId: app.candidateId,
                          candidateName: app.candidate?.name,
                          score: app.overallScore || 0,
                          analysisData: app.analysisData || {},
                          candidate: app.candidate,
                        });
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 8,
                        borderRadius: 8,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <BarChart2 size={18} color="#6B7280" />
                      <span style={{ fontSize: 10, color: '#6B7280' }}>{t('jobDetails.analysis', 'Analiz')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ============ LIST VIEW ============ */
          pageItems.map((app, index) => {
            const candidateName = app.candidate?.name || '—';
            const initials = getInitials(candidateName);
            const avatarColors = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444'];
            const avatarColor = avatarColors[index % avatarColors.length];
            const isSelected = selectedApplicationIds.includes(app.id);
            const isShortlisted = app.isShortlisted;
            const isInLonglist = app.isInLonglist;
            const isNewlyAnalyzed = newlyAnalyzedCandidateIds.includes(app.candidate?.id);
            
            // Row background based on list status
            const getRowBackground = () => {
              // Newly analyzed candidates get orange highlight (same as star color)
              if (isNewlyAnalyzed) return 'linear-gradient(90deg, #FEF3C7 0%, #FFFBEB 50%, white 100%)';
              if (isShortlisted) return 'linear-gradient(90deg, #FFFBEB 0%, white 100%)';
              if (isInLonglist) return 'linear-gradient(90deg, #EFF6FF 0%, white 100%)';
              return 'white';
            };
            const getRowBorderLeft = () => {
              // Newly analyzed candidates get orange border
              if (isNewlyAnalyzed) return '3px solid #F59E0B';
              if (isShortlisted) return '3px solid #F59E0B';
              if (isInLonglist) return '3px solid #3B82F6';
              return '3px solid transparent';
            };
            
            return (
              <div 
                key={app.id} 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40px 30px 2.2fr 1fr 1.4fr 0.5fr 1.3fr 155px', 
                  padding: '16px 24px', 
                  borderBottom: '1px solid #F3F4F6', 
                  alignItems: 'center',
                  transition: 'background 0.15s',
                  background: getRowBackground(),
                  borderLeft: getRowBorderLeft(),
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isShortlisted && !isInLonglist && !isNewlyAnalyzed) e.currentTarget.style.background = '#FAFAFA';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = getRowBackground();
                }}
              >
                {/* NEW badge for newly analyzed candidates */}
                {isNewlyAnalyzed && (
                  <div style={{
                    position: 'absolute',
                    top: 4,
                    left: 8,
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: 'white',
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 4,
                    letterSpacing: '0.5px',
                    boxShadow: '0 1px 3px rgba(217, 119, 6, 0.3)',
                    textTransform: 'uppercase',
                  }}>
                    NEW
                  </div>
                )}
                {/* Checkbox for selection */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelection(app.id)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#3B82F6' }}
                  />
                </div>
                
                {/* Action button based on current tab */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {/* Tümü tab: Long List'e ekle butonu */}
                  {listType === LIST_TYPES.ALL && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleLonglist(app.id);
                      }}
                      style={{
                        padding: 4,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.15s',
                      }}
                      title={t('longlist.addToLonglist', 'Long List\'e Ekle')}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <List size={18} color="#3B82F6" />
                    </button>
                  )}
                  
                  {/* Long List tab: Short List'e ekle butonu (yıldız) */}
                  {listType === LIST_TYPES.LONG_LIST && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToShortlistWithNote(app.id);
                      }}
                      style={{
                        padding: 4,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.15s',
                      }}
                      title={t('shortlist.addToShortlist', 'Short List\'e Ekle')}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Star size={18} color="#D1D5DB" fill="none" />
                    </button>
                  )}
                  
                  {/* Short List tab: Shortlist'te olduğunu gösteren dolu yıldız */}
                  {listType === LIST_TYPES.SHORT_LIST && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleShortlist(app.id);
                      }}
                      style={{
                        padding: 4,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.15s',
                      }}
                      title={app.shortlistNote || t('shortlist.inShortlist', 'Short List\'te - Çıkarmak için tıklayın')}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Star size={18} color="#F59E0B" fill="#F59E0B" />
                    </button>
                  )}
                </div>
                
                {/* Candidate with Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: avatarColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: 14,
                    flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#111827', fontWeight: 600, fontSize: 14 }}>
                      {candidateName}
                      {app.candidate?.inTalentPool && (
                        <span 
                          title={
                            app.candidate?.talentPoolTags?.length > 0
                              ? `${t('jobDetails.inTalentPool', 'Yetenek Havuzunda')}: ${app.candidate.talentPoolTags.map(tag => tag.name).join(', ')}`
                              : t('jobDetails.inTalentPool', 'Yetenek Havuzunda')
                          }
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            background: '#FEF3C7',
                            border: '2px solid #F59E0B',
                            cursor: 'help',
                          }}
                        >
                          <Star size={12} fill="#D97706" color="#D97706" />
                        </span>
                      )}
                    </div>
                    {app.candidate?.email && (
                      <div style={{ color: '#6B7280', fontSize: 12 }}>{app.candidate.email}</div>
                    )}
                  </div>
                </div>
                
                {/* Analysis Date */}
                <div style={{ color: '#6B7280', fontSize: 14 }}>
                  {app.analyzedAt ? new Date(app.analyzedAt).toLocaleDateString('tr-TR') : '-'}
                </div>
                
                {/* Score */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden', maxWidth: 100 }}>
                    <div style={{ width: `${app.overallScore || 0}%`, height: '100%', background: getScoreColor(app.overallScore || 0), borderRadius: 3 }} />
                  </div>
                  <span style={{ minWidth: 40, fontWeight: 600, color: getScoreColor(app.overallScore || 0), fontSize: 14 }}>
                    {app.overallScore || 0}%
                  </span>
                </div>
                
                {/* Session Icons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {app.hasInterviewSession && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedApp(app);
                        setShowInterviewResults(true);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 30,
                        height: 30,
                        padding: 0,
                        background: app.interviewSessionStatus === 'completed' ? '#D1FAE5' : '#F3F4F6',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        color: app.interviewSessionStatus === 'completed' ? '#10B981' : '#6B7280',
                        transition: 'all 0.15s',
                      }}
                      title={app.interviewSessionStatus === 'completed' ? t('jobDetails.sessionStatus.interviewCompleted') : t('jobDetails.sessionStatus.interviewSent')}
                    >
                      <BotMessageSquare size={15} />
                    </button>
                  )}
                  {app.hasSecondInterview && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedApp(app);
                        // Show feedback modal for all statuses - it will show info for completed interviews
                        setSecondInterviewData({ application: app });
                        setShowSecondInterviewFeedback(true);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 30,
                        height: 30,
                        padding: 0,
                        background: app.secondInterviewStatus === 'completed' ? '#D1FAE5' 
                          : app.secondInterviewStatus === 'invited' ? '#EDE9FE' 
                          : '#F3F4F6',
                        border: 'none',
                        borderRadius: 6,
                        cursor: app.secondInterviewStatus === 'invited' ? 'pointer' : 'default',
                        color: app.secondInterviewStatus === 'completed' ? '#10B981' 
                          : app.secondInterviewStatus === 'invited' ? '#8B5CF6'
                          : '#6B7280',
                        transition: 'all 0.15s',
                      }}
                      title={app.secondInterviewStatus === 'completed' 
                        ? t('jobDetails.sessionStatus.secondInterviewCompleted', 'Mülakat Tamamlandı') 
                        : app.secondInterviewStatus === 'invited'
                        ? t('jobDetails.sessionStatus.secondInterviewInvited', 'Mülakat Daveti')
                        : t('jobDetails.sessionStatus.secondInterviewNoShow', 'Mülakat - Gelmedi')}
                    >
                      <Users size={15} />
                    </button>
                  )}
                  {app.hasLikertSession && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedApp(app);
                        setShowLikertResults(true);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 30,
                        height: 30,
                        padding: 0,
                        background: app.likertSessionStatus === 'completed' ? '#D1FAE5' : '#F3F4F6',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        color: app.likertSessionStatus === 'completed' ? '#10B981' : '#6B7280',
                        transition: 'all 0.15s',
                      }}
                      title={app.likertSessionStatus === 'completed' ? t('jobDetails.sessionStatus.likertCompleted') : t('jobDetails.sessionStatus.likertSent')}
                    >
                      <FileText size={15} />
                    </button>
                  )}
                </div>
                
                {/* Status Badge with Dot + Offer Actions */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {(() => {
                    const status = getLatestSessionStatus(app);
                    const hasOffer = isOfferStatus(app);
                    return (
                      <>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          background: 'white',
                          border: `1px solid ${status.color}20`,
                          color: status.color,
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                        }}>
                          <span style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: status.color,
                          }} />
                          {status.text}
                        </span>
                        
                        {/* Offer Actions Button */}
                        {hasOffer && (
                          <div ref={offerDropdownOpen === app.id ? offerDropdownRef : null} style={{ position: 'relative' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOfferDropdownOpen(offerDropdownOpen === app.id ? null : app.id);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                                padding: '6px 10px',
                                background: status.color + '15',
                                border: `1px solid ${status.color}30`,
                                borderRadius: 8,
                                cursor: 'pointer',
                                color: status.color,
                                fontSize: 12,
                                fontWeight: 500,
                                transition: 'all 0.2s',
                              }}
                              title={t('offer.actions', 'Teklif İşlemleri')}
                            >
                              <FileCheck size={14} />
                              <ChevronDown size={12} style={{ 
                                transform: offerDropdownOpen === app.id ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s'
                              }} />
                            </button>
                            
                            {/* Dropdown Menu */}
                            {offerDropdownOpen === app.id && (
                              <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: 4,
                                background: 'white',
                                border: '1px solid #E5E7EB',
                                borderRadius: 8,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                zIndex: 1000,
                                minWidth: 180,
                                overflow: 'hidden',
                              }}>
                                {/* View Offer */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewOffer(app.id);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    width: '100%',
                                    padding: '10px 14px',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    color: '#374151',
                                    textAlign: 'left',
                                    transition: 'background 0.15s',
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                  <Eye size={15} color="#6B7280" />
                                  {t('offer.viewOffer', 'Teklifi Görüntüle')}
                                </button>
                                
                                {/* Only show accept/reject if status is OFFER_SENT */}
                                {app.status?.toUpperCase() === 'OFFER_SENT' && (
                                  <>
                                    <div style={{ height: 1, background: '#E5E7EB' }} />
                                    
                                    {/* Accept Offer */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(t('offer.confirmAccept', 'Teklifi kabul edildi olarak işaretlemek istediğinize emin misiniz?'))) {
                                          handleUpdateOfferStatus(app.id, 'accepted');
                                        }
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: 13,
                                        color: '#059669',
                                        textAlign: 'left',
                                        transition: 'background 0.15s',
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = '#D1FAE5'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                      <Check size={15} color="#059669" />
                                      {t('offer.markAccepted', 'Kabul Edildi')}
                                    </button>
                                    
                                    {/* Reject Offer */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(t('offer.confirmReject', 'Teklifi reddedildi olarak işaretlemek istediğinize emin misiniz?'))) {
                                          handleUpdateOfferStatus(app.id, 'rejected');
                                        }
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: 13,
                                        color: '#DC2626',
                                        textAlign: 'left',
                                        transition: 'background 0.15s',
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = '#FEE2E2'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                      <X size={15} color="#DC2626" />
                                      {t('offer.markRejected', 'Reddedildi')}
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
                
                {/* Actions - Icon Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {/* View History */}
                  <button
                    onClick={() => {
                      setSelectedApp(app);
                      setShowHistory(true);
                    }}
                    title={t('jobDetails.viewHistory')}
                    style={{
                      padding: 8,
                      background: 'transparent',
                      border: '1px solid #E5E7EB',
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F3F4F6';
                      e.currentTarget.style.borderColor = '#9CA3AF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = '#E5E7EB';
                    }}
                  >
                    <Clock size={16} color="#6B7280" />
                  </button>
                  
                  {/* View Analysis */}
                  <button
                    onClick={() => {
                      setSelectedCandidate({
                        ...app, // Include all fields from app including status
                        id: app.id,
                        applicationId: app.id,
                        candidateId: app.candidateId,
                        candidateName: app.candidate?.name,
                        score: app.overallScore || 0,
                        analysisData: app.analysisData || {},
                        candidate: app.candidate,
                      });
                    }}
                    title={t('jobDetails.viewAnalysis')}
                    style={{
                      padding: 8,
                      background: 'transparent',
                      border: '1px solid #E5E7EB',
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#EEF2FF';
                      e.currentTarget.style.borderColor = '#818CF8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = '#E5E7EB';
                    }}
                  >
                    <BarChart2 size={16} color="#6366F1" />
                  </button>
                  
                  {/* Preview CV */}
                  {app.candidate?.cvFilePath ? (
                    <button
                      onClick={() => {
                        setCvPreviewUrl(`${API_BASE_URL}${app.candidate.cvFilePath.replace('/app', '')}`);
                        setCvPreviewName(app.candidate?.name || 'CV');
                      }}
                      title={t('jobDetails.previewCV', 'CV Görüntüle')}
                      style={{
                        padding: 8,
                        background: 'transparent',
                        border: '1px solid #E5E7EB',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#FEF3C7';
                        e.currentTarget.style.borderColor = '#F59E0B';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = '#E5E7EB';
                      }}
                    >
                      <Eye size={16} color="#F59E0B" />
                    </button>
                  ) : (
                    <div
                      title={t('jobDetails.noCVAvailable', 'CV not available')}
                      style={{
                        padding: 8,
                        background: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.5,
                        cursor: 'not-allowed',
                      }}
                    >
                      <Eye size={16} color="#9CA3AF" />
                    </div>
                  )}

                  {/* Download CV */}
                  {app.candidate?.cvFilePath ? (
                    <a
                      href={`${API_BASE_URL}${app.candidate.cvFilePath.replace('/app', '')}`}
                      download
                      title={t('jobDetails.downloadCV')}
                      style={{
                        padding: 8,
                        background: 'transparent',
                        border: '1px solid #E5E7EB',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#ECFDF5';
                        e.currentTarget.style.borderColor = '#34D399';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = '#E5E7EB';
                      }}
                    >
                      <Download size={16} color="#10B981" />
                    </a>
                  ) : (
                    <div
                      title={t('jobDetails.noCVAvailable', 'CV not available')}
                      style={{
                        padding: 8,
                        background: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.5,
                        cursor: 'not-allowed',
                      }}
                    >
                      <Download size={16} color="#9CA3AF" />
                    </div>
                  )}
              </div>
            </div>
            );
          })
        )}

        {/* Pagination */}
        {applications.length > pageSize && (
          <div style={{ padding: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 6, background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>{t('jobDetails.previous')}</button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} style={{ padding: '8px 12px', border: page === i + 1 ? 'none' : '1px solid #E5E7EB', borderRadius: 6, background: page === i + 1 ? '#3B82F6' : 'white', color: page === i + 1 ? 'white' : '#374151', cursor: 'pointer', fontWeight: page === i + 1 ? 700 : 400 }}>{i + 1}</button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 6, background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>{t('jobDetails.next')}</button>
          </div>
        )}
        </>
        )}
      </div>
      
      {/* CV Preview Modal */}
      {cvPreviewUrl && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: 20,
          }}
          onClick={() => { setCvPreviewUrl(null); setCvPreviewName(''); }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              width: '100%',
              maxWidth: 900,
              height: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '16px 24px',
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'white' }}>
                <FileText size={22} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                    {t('jobDetails.cvPreview', 'CV Önizleme')}
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>{cvPreviewName}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <a
                  href={cvPreviewUrl}
                  download
                  style={{
                    padding: '6px 14px',
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: 6,
                    color: 'white',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                >
                  <Download size={14} />
                  {t('jobDetails.downloadCV')}
                </a>
                <button
                  onClick={() => { setCvPreviewUrl(null); setCvPreviewName(''); }}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: 8,
                    padding: 8,
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                >
                  <X size={20} color="white" />
                </button>
              </div>
            </div>
            {/* PDF Content */}
            <div style={{ flex: 1, background: '#F3F4F6' }}>
              <iframe
                src={cvPreviewUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                title="CV Preview"
              />
            </div>
          </div>
        </div>
      )}

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <CandidateDetailModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          jobId={job?.id}
          jobTitle={job?.title}
          application={selectedCandidate}
          onRefetch={(action) => {
            // Switch to Offer tab when an offer is sent - do this FIRST before any other operations
            if (action === 'offer_sent') {
              setListType(LIST_TYPES.OFFER);
              setSelectedCandidate(null); // Close the modal
              // Delay refetch to ensure state updates are processed first
              setTimeout(() => refetch(), 100);
            } else {
              refetch();
            }
          }}
        />
      )}
      
      {/* Likert Results Modal */}
      {showLikertResults && selectedApp && (
        <LikertResultsModal
          isOpen={showLikertResults}
          onClose={() => {
            setShowLikertResults(false);
            setSelectedApp(null);
          }}
          applicationId={selectedApp.id}
          candidateName={selectedApp.candidate?.name}
          jobTitle={job?.title}
        />
      )}
      
      {/* Interview Results Modal */}
      {showInterviewResults && selectedApp && (
        <InterviewResultsModal
          isOpen={showInterviewResults}
          onClose={() => {
            setShowInterviewResults(false);
            setSelectedApp(null);
          }}
          applicationId={selectedApp.id}
          candidateName={selectedApp.candidate?.name}
          jobTitle={job?.title}
        />
      )}
      
      {/* Candidate History Modal */}
      {showHistory && selectedApp && (
        <CandidateHistoryModal
          isOpen={showHistory}
          onClose={() => {
            setShowHistory(false);
            setSelectedApp(null);
          }}
          applicationId={selectedApp.id}
          candidateName={selectedApp.candidate?.name}
          jobTitle={job?.title}
          applicationData={selectedApp}
          onViewLikertResults={() => {
            setShowHistory(false);
            setShowLikertResults(true);
          }}
          onViewInterviewResults={() => {
            setShowHistory(false);
            setShowInterviewResults(true);
          }}
        />
      )}
      
      {/* Job Detail Modal */}
      {showJobDetail && (
        <JobPreviewModal
          isOpen={showJobDetail}
          onClose={() => setShowJobDetail(false)}
          jobData={{
            title: job?.title,
            departmentId: job?.department?.id,
            location: job?.location,
            remotePolicy: job?.remotePolicy || job?.remoteType,
            employmentType: job?.employmentType,
            experienceLevel: job?.experienceLevel,
            salaryMin: job?.salaryMin,
            salaryMax: job?.salaryMax,
            salaryCurrency: job?.salaryCurrency || 'TRY',
            description: job?.description,
            requirements: job?.requirements,
            keywords: job?.keywords || [],
            requiredLanguages: job?.requiredLanguages,
            preferredMajors: job?.preferredMajors,
            introText: job?.introText,
            outroText: job?.outroText,
            deadline: job?.deadline,
            isDisabledFriendly: job?.isDisabledFriendly,
          }}
          departments={departments || []}
          viewOnly={true}
        />
      )}
      
      {/* Second Interview Invite Modal */}
      {showSecondInterviewInvite && selectedApp && (
        <SecondInterviewInviteModal
          key={`second-interview-${selectedApp?.id || 'new'}`}
          isOpen={showSecondInterviewInvite}
          onClose={() => {
            setShowSecondInterviewInvite(false);
            setSelectedApp(null);
          }}
          candidate={selectedApp.candidate}
          application={selectedApp}
          jobTitle={job?.title}
          existingInterview={selectedApp?.secondInterview || null}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
      
      {/* Second Interview Feedback Modal */}
      {showSecondInterviewFeedback && selectedApp && (
        <SecondInterviewFeedbackModal
          isOpen={showSecondInterviewFeedback}
          onClose={() => {
            setShowSecondInterviewFeedback(false);
            setSecondInterviewData(null);
            setSelectedApp(null);
          }}
          application={selectedApp}
          onSuccess={() => {
            refetch();
          }}
          onOpenRejectionModal={(app) => {
            setShowSecondInterviewFeedback(false);
            setSelectedApp(app);
            setShowSendRejection(true);
          }}
          onOpenLikertModal={(app) => {
            setShowSecondInterviewFeedback(false);
            setSelectedApp(app);
            setShowLikertInvite(true);
          }}
        />
      )}

      {/* Send Rejection Modal */}
      {showSendRejection && selectedApp && (
        <SendRejectionModal
          isOpen={showSendRejection}
          onClose={() => {
            setShowSendRejection(false);
            setSelectedApp(null);
          }}
          candidate={selectedApp.candidate}
          application={selectedApp}
          jobId={job?.id}
          jobTitle={job?.title}
          onSuccess={() => {
            refetch();
            setShowSendRejection(false);
            setSelectedApp(null);
          }}
        />
      )}

      {/* Likert Invite Modal */}
      {showLikertInvite && selectedApp && (
        <LikertInviteModal
          key={`likert-${selectedApp?.id || 'new'}`}
          isOpen={showLikertInvite}
          onClose={() => {
            setShowLikertInvite(false);
            setSelectedApp(null);
          }}
          candidate={selectedApp.candidate}
          application={selectedApp}
          jobId={job?.id}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {/* Offer Preview Modal */}
      {showOfferPreview && selectedOfferData && (
        <OfferPreviewModal
          isOpen={showOfferPreview}
          onClose={() => {
            setShowOfferPreview(false);
            setSelectedOfferData(null);
          }}
          offerData={selectedOfferData}
          candidateName={selectedOfferData.candidateName}
          jobTitle={selectedOfferData.jobTitle || job?.title}
        />
      )}

      {/* Shortlist Note Modal */}
      {showShortlistNote && (
        <ShortlistNoteModal
          isOpen={showShortlistNote}
          onClose={() => {
            setShowShortlistNote(false);
            setShortlistNoteTarget(null);
          }}
          onConfirm={handleConfirmShortlistNote}
          candidateName={
            allApplications.find(app => app.id === shortlistNoteTarget)?.candidate?.name
          }
        />
      )}

      {/* Shortlist Share Modal */}
      {showShareModal && (
        <ShortlistShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          jobId={job?.id}
          jobTitle={job?.title}
          shortlistCount={shortlistCount}
        />
      )}

      {/* Longlist Share Modal */}
      {showLonglistShareModal && (
        <LonglistShareModal
          isOpen={showLonglistShareModal}
          onClose={() => setShowLonglistShareModal(false)}
          jobId={job?.id}
          jobTitle={job?.title}
          longlistCount={longlistCount}
        />
      )}

      {/* Pipeline → Create Offer Modal */}
      {pipelineOfferApp && (
        <CreateOfferModal
          key={`pipeline-offer-${pipelineOfferApp.id}`}
          isOpen={!!pipelineOfferApp}
          onClose={() => setPipelineOfferApp(null)}
          candidate={pipelineOfferApp.candidate}
          application={pipelineOfferApp}
          jobTitle={job?.title}
          companyName={''}
          onSuccess={(action) => {
            setPipelineOfferApp(null);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default JobDetails;
