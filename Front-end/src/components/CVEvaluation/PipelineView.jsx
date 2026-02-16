import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import {
  Star,
  Clock,
  FileText,
  Eye,
  BarChart2,
  GripVertical,
  User,
  ChevronRight,
  Info,
  CheckCircle,
  AlertTriangle,
  X,
} from 'lucide-react';
import { getInitials } from '../../utils/nameUtils';
import { API_BASE_URL } from '../../config/api';

// ============================================
// Toast Notification Component
// ============================================
const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    info: { bg: '#EFF6FF', border: '#3B82F6', color: '#1D4ED8', icon: <Info size={18} /> },
    success: { bg: '#ECFDF5', border: '#10B981', color: '#047857', icon: <CheckCircle size={18} /> },
    warning: { bg: '#FFFBEB', border: '#F59E0B', color: '#B45309', icon: <AlertTriangle size={18} /> },
    error: { bg: '#FEF2F2', border: '#EF4444', color: '#B91C1C', icon: <AlertTriangle size={18} /> },
  }[type];

  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 20px',
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        color: config.color,
        fontSize: 14,
        fontWeight: 500,
        maxWidth: 480,
        animation: 'toastSlideIn 0.3s ease-out',
      }}
    >
      {config.icon}
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 2,
          display: 'flex',
          color: config.color,
          opacity: 0.6,
        }}
      >
        <X size={16} />
      </button>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
};

// ============================================
// Pipeline Stage Configuration
// ============================================
const PIPELINE_STAGES = [
  {
    id: 'all',
    gradient: 'linear-gradient(135deg, #6366F1, #4F46E5)',
    lightBg: '#EEF2FF',
    borderColor: '#C7D2FE',
    textColor: '#4338CA',
    arrowColor: '#6366F1',
  },
  {
    id: 'longlist',
    gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)',
    lightBg: '#EFF6FF',
    borderColor: '#BFDBFE',
    textColor: '#1D4ED8',
    arrowColor: '#3B82F6',
  },
  {
    id: 'shortlist',
    gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
    lightBg: '#FFFBEB',
    borderColor: '#FDE68A',
    textColor: '#B45309',
    arrowColor: '#F59E0B',
  },
  {
    id: 'offer',
    gradient: 'linear-gradient(135deg, #10B981, #059669)',
    lightBg: '#ECFDF5',
    borderColor: '#A7F3D0',
    textColor: '#047857',
    arrowColor: '#10B981',
  },
  {
    id: 'hired',
    gradient: 'linear-gradient(135deg, #06B6D4, #0891B2)',
    lightBg: '#ECFEFF',
    borderColor: '#A5F3FC',
    textColor: '#0E7490',
    arrowColor: '#06B6D4',
  },
];

// ============================================
// Draggable Card Component
// ============================================
const DraggableCard = ({ app, stageId, onClickCandidate, onClickHistory, onPreviewCV, getScoreColor, getLatestSessionStatus }) => {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: app.id,
    data: { stageId, app },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const candidateName = app.candidate?.name || '—';
  const initials = getInitials(candidateName);
  const score = app.overallScore || 0;
  const status = getLatestSessionStatus(app);
  const avatarColors = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444'];
  const colorIndex = candidateName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const avatarColor = avatarColors[colorIndex % avatarColors.length];

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'white',
        borderRadius: 10,
        border: '1px solid #E5E7EB',
        padding: 12,
        marginBottom: 8,
        cursor: 'grab',
        boxShadow: isDragging
          ? '0 12px 24px rgba(0,0,0,0.15)'
          : '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.2s, opacity 0.2s',
      }}
      {...attributes}
      {...listeners}
    >
      {/* Top row: Avatar + Name + Grip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: avatarColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 13,
              color: '#111827',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {candidateName}
            {app.candidate?.inTalentPool && (
              <Star size={12} fill="#D97706" color="#D97706" />
            )}
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#9CA3AF',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {app.candidate?.email || '-'}
          </div>
        </div>
        <GripVertical size={16} color="#D1D5DB" style={{ flexShrink: 0 }} />
      </div>

      {/* Score bar */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('jobDetails.compatibility', 'Uyumluluk')}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: getScoreColor(score) }}>
            {score}%
          </span>
        </div>
        <div style={{ width: '100%', height: 5, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
          <div
            style={{
              width: `${score}%`,
              height: '100%',
              background: getScoreColor(score),
              borderRadius: 3,
              transition: 'width 0.3s',
            }}
          />
        </div>
      </div>

      {/* Status badge */}
      <div style={{ marginBottom: 10 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 10px',
            background: status.bg || '#F3F4F6',
            color: status.color,
            borderRadius: 12,
            fontSize: 10,
            fontWeight: 500,
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: status.color }} />
          {status.text}
        </span>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6, borderTop: '1px solid #F3F4F6', paddingTop: 8 }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClickHistory(app);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '5px 0',
            background: 'transparent',
            border: '1px solid #E5E7EB',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 10,
            color: '#6B7280',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Clock size={12} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClickCandidate(app);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '5px 0',
            background: 'transparent',
            border: '1px solid #E5E7EB',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 10,
            color: '#6B7280',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <BarChart2 size={12} />
        </button>
        {app.candidate?.cvFilePath && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreviewCV && onPreviewCV(`${API_BASE_URL}${app.candidate.cvFilePath.replace('/app', '')}`, app.candidate?.name || 'CV');
            }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '5px 0',
              background: 'transparent',
              border: '1px solid #E5E7EB',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 10,
              color: '#6B7280',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FEF3C7'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Eye size={12} color="#F59E0B" />
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================
// Overlay Card (shown while dragging)
// ============================================
const OverlayCard = ({ app, getScoreColor, getLatestSessionStatus }) => {
  const { t } = useTranslation();
  const candidateName = app.candidate?.name || '—';
  const initials = getInitials(candidateName);
  const score = app.overallScore || 0;
  const status = getLatestSessionStatus(app);
  const avatarColors = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444'];
  const colorIndex = candidateName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const avatarColor = avatarColors[colorIndex % avatarColors.length];

  return (
    <div
      style={{
        background: 'white',
        borderRadius: 12,
        border: '2px solid #3B82F6',
        padding: 14,
        width: 260,
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        cursor: 'grabbing',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: avatarColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{candidateName}</div>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{app.candidate?.email || '-'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: getScoreColor(score) }}>{score}%</span>
        <span
          style={{
            padding: '3px 10px',
            background: status.bg || '#F3F4F6',
            color: status.color,
            borderRadius: 12,
            fontSize: 10,
            fontWeight: 500,
          }}
        >
          {status.text}
        </span>
      </div>
    </div>
  );
};

// ============================================
// Droppable Column Component
// ============================================
const PipelineColumn = ({ stage, apps, stageLabel, count, onClickCandidate, onClickHistory, onPreviewCV, getScoreColor, getLatestSessionStatus }) => {
  const { t } = useTranslation();
  const { isOver, setNodeRef } = useDroppable({
    id: stage.id,
  });

  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Arrow Header */}
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <div
          style={{
            background: stage.gradient,
            borderRadius: 10,
            padding: '10px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Chevron decoration */}
          <div
            style={{
              position: 'absolute',
              right: -4,
              top: '50%',
              transform: 'translateY(-50%)',
              opacity: 0.2,
            }}
          >
            <ChevronRight size={40} color="white" />
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 14, zIndex: 1 }}>
            {stageLabel}
          </span>
          <span
            style={{
              background: 'rgba(255,255,255,0.25)',
              color: 'white',
              padding: '2px 10px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              zIndex: 1,
            }}
          >
            {count}
          </span>
        </div>
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          background: isOver ? stage.lightBg : '#FAFAFA',
          border: isOver ? `2px dashed ${stage.arrowColor}` : '2px dashed transparent',
          borderRadius: 10,
          padding: 8,
          minHeight: 200,
          transition: 'all 0.2s ease',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 360px)',
        }}
      >
        <SortableContext items={apps.map(a => a.id)} strategy={verticalListSortingStrategy}>
          {apps.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 16px',
                color: '#D1D5DB',
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              <User size={32} color="#E5E7EB" style={{ marginBottom: 8 }} />
              <span>{t('pipeline.noCandidate', 'Aday yok')}</span>
            </div>
          ) : (
            apps.map((app) => (
              <DraggableCard
                key={app.id}
                app={app}
                stageId={stage.id}
                onClickCandidate={onClickCandidate}
                onClickHistory={onClickHistory}
                onPreviewCV={onPreviewCV}
                getScoreColor={getScoreColor}
                getLatestSessionStatus={getLatestSessionStatus}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
};

// ============================================
// Main PipelineView Component
// ============================================
const PipelineView = ({
  allApplications,
  onMoveToStage,
  onClickCandidate,
  onClickHistory,
  onPreviewCV,
  getScoreColor,
  getLatestSessionStatus,
  isHired,
  hasPendingOfferStatus,
  hasAnyOfferStatus,
  onOpenOfferModal,
}) => {
  const { t } = useTranslation();
  const [activeApp, setActiveApp] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'warning') => {
    setToast({ message, type, key: Date.now() });
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group applications into pipeline stages
  const stageApps = useMemo(() => {
    const pool = allApplications.filter(app => !app.isInLonglist && !app.isShortlisted && !hasAnyOfferStatus(app));
    const longlist = allApplications.filter(app => app.isInLonglist && !app.isShortlisted && !hasAnyOfferStatus(app));
    const shortlist = allApplications.filter(app => app.isShortlisted && !hasAnyOfferStatus(app));
    const offer = allApplications.filter(app => hasPendingOfferStatus(app));
    const hired = allApplications.filter(app => isHired(app));

    return {
      all: pool,
      longlist,
      shortlist,
      offer,
      hired,
    };
  }, [allApplications, isHired, hasPendingOfferStatus, hasAnyOfferStatus]);

  const stageLabels = {
    all: t('shortlist.pool', 'Havuz'),
    longlist: 'Long List',
    shortlist: 'Short List',
    offer: t('offer.tab', 'Teklif'),
    hired: t('hired.tab', 'İşe Alınan'),
  };

  // Find which stage an application belongs to
  const findStageOfApp = (appId) => {
    for (const [stageId, apps] of Object.entries(stageApps)) {
      if (apps.find(a => a.id === appId)) return stageId;
    }
    return null;
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const app = allApplications.find(a => a.id === active.id);
    setActiveApp(app);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveApp(null);

    if (!over) return;

    const fromStage = findStageOfApp(active.id);
    
    // Determine target stage - could be dropping on a column or on a card within a column
    let toStage = over.id;
    // If over.id is not a stage id, it's a card id - find its stage
    if (!stageApps[toStage]) {
      toStage = findStageOfApp(over.id);
      // If still not found, check droppable data
      if (!toStage && over.data?.current?.stageId) {
        toStage = over.data.current.stageId;
      }
    }

    if (!fromStage || !toStage || fromStage === toStage) return;

    // Hired stage: only allowed from Offer stage
    if (toStage === 'hired') {
      if (fromStage === 'offer') {
        // Allow: Offer → Hired (manually accept offer)
        onMoveToStage(active.id, fromStage, toStage);
      } else {
        showToast(t('pipeline.hiredNotDraggable', 'Cannot drag to Hired stage. An offer must be created and accepted first.'), 'warning');
      }
      return;
    }

    // Offer stage → open the Create Offer modal for this candidate
    if (toStage === 'offer') {
      if (onOpenOfferModal) {
        onOpenOfferModal(active.id);
      }
      return;
    }

    // Call parent handler to execute the mutation
    onMoveToStage(active.id, fromStage, toStage);
  };

  const handleDragOver = (event) => {
    // We handle everything in dragEnd
  };

  return (
    <div style={{ padding: '16px 12px', position: 'relative' }}>
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div
          style={{
            display: 'flex',
            gap: 10,
            width: '100%',
          }}
        >
          {PIPELINE_STAGES.map((stage) => (
            <PipelineColumn
              key={stage.id}
              stage={stage}
              apps={stageApps[stage.id] || []}
              stageLabel={stageLabels[stage.id]}
              count={(stageApps[stage.id] || []).length}
              onClickCandidate={onClickCandidate}
              onClickHistory={onClickHistory}
              onPreviewCV={onPreviewCV}
              getScoreColor={getScoreColor}
              getLatestSessionStatus={getLatestSessionStatus}
            />
          ))}
        </div>

        <DragOverlay>
          {activeApp ? (
            <OverlayCard
              app={activeApp}
              getScoreColor={getScoreColor}
              getLatestSessionStatus={getLatestSessionStatus}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default PipelineView;
