/**
 * Usage History Page Component
 * Shows company's credit consumption history by period
 */
import React, { useState, useEffect } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import { History, Upload, Brain, Calendar, FileText, ChevronRight, CheckCircle } from 'lucide-react';
import { SUBSCRIPTION_STATUS_QUERY } from '../../graphql/multiTenancy';
import { GET_USAGE_HISTORY, GET_USAGE_SESSION_DETAIL } from '../../graphql/usageHistory';
import UsageSessionDetailModal from './UsageSessionDetailModal';
import { generateBillingPeriods, getCurrentPeriod, formatDate } from '../../utils/periodCalculator';

const UsageHistoryPage = () => {
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [activeTab, setActiveTab] = useState('cv_analyses'); // 'cv_analyses' or 'cv_uploads'

  // Lazy query for fetching session details
  const [fetchSessionDetail, { data: sessionDetailData, loading: sessionDetailLoading }] = useLazyQuery(GET_USAGE_SESSION_DETAIL);

  // Fetch subscription status to get billing periods
  const { data: subscriptionData, loading: subLoading, error: subError } = useQuery(SUBSCRIPTION_STATUS_QUERY, {
    fetchPolicy: 'network-only',
  });

  // Debug subscription loading
  useEffect(() => {
    console.log('🔐 Subscription Query State:', {
      loading: subLoading,
      error: subError,
      data: subscriptionData
    });
  }, [subLoading, subError, subscriptionData]);

  // Calculate billing periods when subscription data loads
  useEffect(() => {
    console.log('📅 Subscription Data:', subscriptionData?.subscriptionStatus);
    
    if (subscriptionData?.subscriptionStatus) {
      const sub = subscriptionData.subscriptionStatus;
      const plan = sub.plan;
      
      console.log('📋 Plan limits:', plan);
      console.log('📍 Start date:', sub.startDate);
      console.log('🔄 Billing cycle:', sub.billingCycle);
      
      // Check if unlimited plan
      const unlimited = plan?.cv_limit === null || plan?.cv_limit === -1;
      setIsUnlimited(unlimited);
      
      console.log('♾️ Is unlimited:', unlimited);
      
      if (!unlimited && sub.isActive && sub.startDate) {
        const billingPeriods = generateBillingPeriods(
          sub.startDate,
          sub.billingCycle || 'monthly'
        );
        console.log('📆 Generated periods:', billingPeriods);
        setPeriods(billingPeriods);
        
        // Set current period as default
        const current = getCurrentPeriod(billingPeriods);
        console.log('✅ Current period:', current);
        if (current) {
          setSelectedPeriod(current);
        }
      } else if (unlimited) {
        // For unlimited plans, trigger initial fetch
        console.log('♾️ Setting unlimited period');
        setSelectedPeriod({ start: null, end: null, label: 'Tüm Geçmiş' });
      }
    } else if (!subLoading && !subscriptionData) {
      // Fallback: if subscription query fails, show all history
      console.log('⚠️ No subscription data, showing all history');
      setIsUnlimited(true);
      setSelectedPeriod({ start: null, end: null, label: 'Tüm Geçmiş' });
    }
  }, [subscriptionData, subLoading]);

  // Fetch usage history for selected period and resource type
  const { data: historyData, loading: historyLoading, refetch, error: historyError } = useQuery(GET_USAGE_HISTORY, {
    variables: {
      resourceType: activeTab,
      periodStart: isUnlimited || !selectedPeriod ? undefined : selectedPeriod?.start,
      periodEnd: isUnlimited || !selectedPeriod ? undefined : selectedPeriod?.end,
    },
    skip: false, // Never skip, let backend handle null periods
    fetchPolicy: 'network-only',
  });

  // Debug logging
  useEffect(() => {
    console.log('🔍 Usage History Debug:', {
      activeTab,
      isUnlimited,
      selectedPeriod,
      periodStart: isUnlimited || !selectedPeriod ? undefined : selectedPeriod?.start,
      periodEnd: isUnlimited || !selectedPeriod ? undefined : selectedPeriod?.end,
      historyData,
      historyError,
      loading: historyLoading
    });
  }, [activeTab, selectedPeriod, isUnlimited, historyData, historyError, historyLoading]);

  // Refetch when tab or period changes
  useEffect(() => {
    if (selectedPeriod || isUnlimited) {
      console.log('🔄 Refetching usage history...');
      refetch({
        resourceType: activeTab,
        periodStart: isUnlimited || !selectedPeriod ? undefined : selectedPeriod?.start,
        periodEnd: isUnlimited || !selectedPeriod ? undefined : selectedPeriod?.end,
      });
    }
  }, [activeTab, selectedPeriod, isUnlimited, refetch]);

  const usageHistory = historyData?.getUsageHistory || [];

  // Calculate totals
  const totalCount = usageHistory.reduce((sum, item) => sum + item.count, 0);
  const sessionCount = usageHistory.length;

  // Handle session detail click
  const handleViewDetail = async (item) => {
    setSelectedSession(item);
    await fetchSessionDetail({ variables: { batchNumber: item.batchNumber } });
  };

  // Combine item with fetched detail
  const sessionWithDetail = selectedSession && sessionDetailData?.getUsageSessionDetail
    ? { ...selectedSession, ...sessionDetailData.getUsageSessionDetail }
    : selectedSession;

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
          <History size={32} color="#3B82F6" />
          Kullanım Geçmişi
        </h1>
        <p style={{
          fontSize: 16,
          color: '#6B7280'
        }}>
          Kredi kullanımınızı dönemsel olarak inceleyin
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        <StatCard
          icon={<Calendar size={24} color="#3B82F6" />}
          label="Seçili Dönem"
          value={isUnlimited ? 'Tüm Geçmiş' : (selectedPeriod?.label || '-')}
          bgColor="#EFF6FF"
        />
        <StatCard
          icon={<FileText size={24} color="#10B981" />}
          label="Toplam Oturum"
          value={sessionCount}
          bgColor="#ECFDF5"
        />
        <StatCard
          icon={<TrendingUp size={24} color="#F59E0B" />}
          label="Toplam İşlem"
          value={totalCount}
          bgColor="#FFFBEB"
        />
      </div>

      {/* Tabs and Period Selector */}
      <div style={{
        background: 'white',
        borderRadius: 16,
        border: '1px solid #E5E7EB',
        overflow: 'hidden'
      }}>
        {/* Header with tabs and period selector */}
        <div style={{
          padding: 24,
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: 8,
            background: '#F3F4F6',
            padding: 4,
            borderRadius: 8
          }}>
            <TabButton
              icon={<Upload size={18} />}
              label="CV Yüklemeleri"
              isActive={activeTab === 'cv_upload'}
              onClick={() => setActiveTab('cv_upload')}
            />
            <TabButton
              icon={<Brain size={18} />}
              label="AI Analizleri"
              isActive={activeTab === 'ai_analysis'}
              onClick={() => setActiveTab('ai_analysis')}
            />
          </div>

          {/* Period Selector */}
          <UsagePeriodSelector
            periods={periods}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            isUnlimited={isUnlimited}
          />
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          {/* Loading State */}
          {(subLoading || historyLoading) && (
            <div style={{
              textAlign: 'center',
              padding: 60,
              color: '#9CA3AF'
            }}>
              <div className="spinner" style={{
                width: 40,
                height: 40,
                border: '4px solid #F3F4F6',
                borderTop: '4px solid #3B82F6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }} />
              <p>Yükleniyor...</p>
            </div>
          )}

          {/* Empty State */}
          {!subLoading && !historyLoading && usageHistory.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: 60,
              color: '#9CA3AF'
            }}>
              <AlertCircle size={48} style={{ margin: '0 auto 16px' }} />
              <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
                Bu dönemde kayıt bulunamadı
              </p>
              <p style={{ fontSize: 14 }}>
                {activeTab === 'cv_upload' ? 'CV yükleme' : 'AI analiz'} işlemi yapılmadı
              </p>
            </div>
          )}

          {/* Usage History List */}
          {!subLoading && !historyLoading && usageHistory.length > 0 && (
            <div style={{
              display: 'grid',
              gap: 12
            }}>
              {usageHistory.map((item) => (
                <UsageSessionCard
                  key={item.id}
                  item={item}
                  resourceType={activeTab}
                  onViewDetail={handleViewDetail}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {sessionWithDetail && (
        <UsageSessionDetailModal
          session={sessionWithDetail}
          onClose={() => setSelectedSession(null)}
          loading={sessionDetailLoading}
        />
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, label, value, bgColor }) => (
  <div style={{
    background: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    padding: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 16
  }}>
    <div style={{
      width: 48,
      height: 48,
      borderRadius: 10,
      background: bgColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {icon}
    </div>
    <div>
      <div style={{
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 4
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 20,
        fontWeight: 700,
        color: '#1F2937'
      }}>
        {value}
      </div>
    </div>
  </div>
);

// Tab Button Component
const TabButton = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '10px 20px',
      border: 'none',
      background: isActive ? 'white' : 'transparent',
      color: isActive ? '#1F2937' : '#6B7280',
      borderRadius: 6,
      fontSize: 14,
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      transition: 'all 0.2s',
      boxShadow: isActive ? '0 1px 3px 0 rgba(0, 0, 0, 0.1)' : 'none'
    }}
  >
    {icon}
    {label}
  </button>
);

// Usage Session Card Component
const UsageSessionCard = ({ item, resourceType, onViewDetail }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getIcon = () => {
    return resourceType === 'cv_upload' 
      ? <Upload size={20} color="#3B82F6" />
      : <Brain size={20} color="#7C3AED" />;
  };

  const getLabel = () => {
    return resourceType === 'cv_upload' 
      ? 'CV Yükleme'
      : 'AI Analizi';
  };

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'all 0.2s',
        transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
        boxShadow: isHovered 
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
        {/* Icon */}
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          background: resourceType === 'cv_upload' ? '#EFF6FF' : '#F5F3FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {getIcon()}
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#1F2937',
            marginBottom: 4
          }}>
            {getLabel()} - {item.count} kayıt
          </div>
          <div style={{
            fontSize: 13,
            color: '#6B7280',
            display: 'flex',
            gap: 16
          }}>
            <span>{formatDate(item.createdAt)}</span>
            <span>•</span>
            <span>Batch: {item.batchNumber}</span>
          </div>
        </div>

        {/* Count Badge */}
        <div style={{
          padding: '6px 16px',
          borderRadius: 20,
          background: resourceType === 'cv_upload' ? '#DBEAFE' : '#EDE9FE',
          color: resourceType === 'cv_upload' ? '#1E40AF' : '#6B21A8',
          fontSize: 14,
          fontWeight: 600
        }}>
          {item.count}
        </div>
      </div>

      {/* View Detail Button */}
      <button
        onClick={() => onViewDetail(item)}
        style={{
          marginLeft: 16,
          padding: '8px 20px',
          background: isHovered ? '#3B82F6' : '#EFF6FF',
          color: isHovered ? 'white' : '#3B82F6',
          border: 'none',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap'
        }}
      >
        Detay Gör
      </button>
    </div>
  );
};

export default UsageHistoryPage;
