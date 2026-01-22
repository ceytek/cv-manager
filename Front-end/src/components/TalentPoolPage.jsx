/**
 * Talent Pool Page Component
 * Displays candidates in the talent pool with filtering, sorting, and management options
 */
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Filter,
  SortAsc,
  SortDesc,
  Tag,
  Users,
  Archive,
  RotateCcw,
  Trash2,
  Edit2,
  Briefcase,
  Calendar,
  MapPin,
  Mail,
  Phone,
  FileText,
  ChevronDown,
  X,
  Sparkles,
  Eye,
  LayoutGrid,
  List,
  Clock,
  User
} from 'lucide-react';
import { 
  GET_TALENT_POOL_ENTRIES, 
  GET_TALENT_POOL_TAGS,
  GET_TALENT_POOL_STATS,
  ARCHIVE_TALENT_POOL_ENTRY,
  RESTORE_TALENT_POOL_ENTRY,
  REMOVE_FROM_TALENT_POOL,
  UPDATE_TALENT_POOL_ENTRY
} from '../graphql/talentPool';
import { API_BASE_URL } from '../config/api';

// Edit Entry Modal Component
const EditEntryModal = ({ entry, tags, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [selectedTags, setSelectedTags] = useState(entry.tags?.map(t => t.id) || []);
  const [notes, setNotes] = useState(entry.notes || '');
  
  const [updateEntry, { loading }] = useMutation(UPDATE_TALENT_POOL_ENTRY);

  const toggleTag = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSave = async () => {
    try {
      await updateEntry({
        variables: {
          id: entry.id,
          input: {
            notes: notes.trim() || null,
            tagIds: selectedTags,
          }
        }
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        width: '90%',
        maxWidth: 500,
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            {t('talentPool.editEntry')}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <X size={20} />
          </button>
        </div>
        
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {/* Candidate Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 16,
            background: '#F9FAFB',
            borderRadius: 12,
            marginBottom: 20,
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: 18,
            }}>
              {entry.candidate?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#111827' }}>{entry.candidate?.name}</div>
              <div style={{ fontSize: 13, color: '#6B7280' }}>{entry.candidate?.email}</div>
            </div>
          </div>

          {/* Tags */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 10 }}>
              {t('talentPool.selectTags')}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {tags.map(tag => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 16,
                      border: isSelected ? `2px solid ${tag.color}` : '2px solid #E5E7EB',
                      background: isSelected ? `${tag.color}15` : 'white',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: isSelected ? tag.color : '#4B5563',
                      fontWeight: 500,
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: tag.color }} />
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
              {t('talentPool.notes')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('talentPool.notesPlaceholder')}
              rows={4}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #E5E7EB',
                fontSize: 14,
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
        }}>
          <button onClick={onClose} className="btn btn-secondary">
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#6366F1',
              color: 'white',
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

const TalentPoolPage = () => {
  const { t } = useTranslation();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [statusFilter, setStatusFilter] = useState('active'); // active, archived, all
  const [sortBy, setSortBy] = useState('addedAt'); // addedAt, candidateName
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [showFilters, setShowFilters] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Queries
  const { data: entriesData, loading: entriesLoading, refetch } = useQuery(GET_TALENT_POOL_ENTRIES, {
    variables: {
      filter: {
        search: searchTerm || null,
        tagIds: selectedTags.length > 0 ? selectedTags : null,
        status: statusFilter === 'all' ? null : statusFilter,
        sortBy,
        sortOrder,
      }
    },
    fetchPolicy: 'cache-and-network',
  });

  const { data: tagsData } = useQuery(GET_TALENT_POOL_TAGS);
  const { data: statsData, refetch: refetchStats } = useQuery(GET_TALENT_POOL_STATS);

  // Mutations
  const [archiveEntry] = useMutation(ARCHIVE_TALENT_POOL_ENTRY);
  const [restoreEntry] = useMutation(RESTORE_TALENT_POOL_ENTRY);
  const [removeEntry] = useMutation(REMOVE_FROM_TALENT_POOL);

  const entries = entriesData?.talentPoolEntries || [];
  const tags = tagsData?.talentPoolTags || [];
  const stats = statsData?.talentPoolStats || { totalCandidates: 0, activeCandidates: 0, archivedCandidates: 0 };

  // Handlers
  const handleArchive = async (id) => {
    try {
      await archiveEntry({ variables: { id } });
      refetch();
      refetchStats();
    } catch (err) {
      console.error('Archive error:', err);
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreEntry({ variables: { id } });
      refetch();
      refetchStats();
    } catch (err) {
      console.error('Restore error:', err);
    }
  };

  const handleRemove = async (id) => {
    try {
      await removeEntry({ variables: { id } });
      refetch();
      refetchStats();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Remove error:', err);
    }
  };

  const toggleTagFilter = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Helper functions
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return t('talentPool.today');
    if (diffDays === 1) return t('talentPool.yesterday');
    if (diffDays < 7) return t('talentPool.daysAgo', { count: diffDays });
    if (diffDays < 30) return t('talentPool.weeksAgo', { count: Math.floor(diffDays / 7) });
    return formatDate(dateString);
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Sparkles size={28} color="#6366F1" />
              {t('talentPool.title')}
            </h1>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '6px 0 0' }}>
              {t('talentPool.subtitle')}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
          <div style={{
            padding: '16px 20px',
            background: 'white',
            borderRadius: 12,
            border: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#EEF2FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Users size={22} color="#6366F1" />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{stats.totalCandidates}</div>
              <div style={{ fontSize: 13, color: '#6B7280' }}>{t('talentPool.totalCandidates')}</div>
            </div>
          </div>
          
          <div style={{
            padding: '16px 20px',
            background: 'white',
            borderRadius: 12,
            border: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#D1FAE5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <User size={22} color="#10B981" />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{stats.activeCandidates}</div>
              <div style={{ fontSize: 13, color: '#6B7280' }}>{t('talentPool.activeCandidates')}</div>
            </div>
          </div>

          <div style={{
            padding: '16px 20px',
            background: 'white',
            borderRadius: 12,
            border: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#FEF3C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Archive size={22} color="#F59E0B" />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{stats.archivedCandidates}</div>
              <div style={{ fontSize: 13, color: '#6B7280' }}>{t('talentPool.archivedCandidates')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{
        background: 'white',
        borderRadius: 12,
        border: '1px solid #E5E7EB',
        padding: 16,
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('talentPool.searchPlaceholder')}
              className="text-input"
              style={{ paddingLeft: 40, width: '100%' }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 8, padding: 4 }}>
            {['active', 'archived', 'all'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: statusFilter === status ? 'white' : 'transparent',
                  color: statusFilter === status ? '#111827' : '#6B7280',
                  fontWeight: 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: statusFilter === status ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {t(`talentPool.status.${status}`)}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #E5E7EB',
                fontSize: 13,
                color: '#374151',
                cursor: 'pointer',
              }}
            >
              <option value="addedAt">{t('talentPool.sortByDate')}</option>
              <option value="candidateName">{t('talentPool.sortByName')}</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              style={{
                padding: 8,
                borderRadius: 8,
                border: '1px solid #E5E7EB',
                background: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {sortOrder === 'asc' ? <SortAsc size={18} color="#6B7280" /> : <SortDesc size={18} color="#6B7280" />}
            </button>
          </div>

          {/* View Mode */}
          <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 8, padding: 4 }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: 8,
                borderRadius: 6,
                border: 'none',
                background: viewMode === 'grid' ? 'white' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LayoutGrid size={18} color={viewMode === 'grid' ? '#6366F1' : '#6B7280'} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: 8,
                borderRadius: 6,
                border: 'none',
                background: viewMode === 'list' ? 'white' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <List size={18} color={viewMode === 'list' ? '#6366F1' : '#6B7280'} />
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              background: showFilters || selectedTags.length > 0 ? '#EEF2FF' : 'white',
              color: showFilters || selectedTags.length > 0 ? '#6366F1' : '#374151',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <Filter size={16} />
            {t('talentPool.filterByTags')}
            {selectedTags.length > 0 && (
              <span style={{
                background: '#6366F1',
                color: 'white',
                padding: '2px 8px',
                borderRadius: 10,
                fontSize: 11,
              }}>
                {selectedTags.length}
              </span>
            )}
          </button>
        </div>

        {/* Tag Filters */}
        {showFilters && (
          <div style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid #E5E7EB',
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {tags.map(tag => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTagFilter(tag.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 16,
                      border: isSelected ? `2px solid ${tag.color}` : '2px solid #E5E7EB',
                      background: isSelected ? `${tag.color}15` : 'white',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: isSelected ? tag.color : '#4B5563',
                      fontWeight: 500,
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: tag.color }} />
                    {tag.name}
                    <span style={{ color: '#9CA3AF', fontSize: 11 }}>({tag.usageCount})</span>
                  </button>
                );
              })}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 16,
                    border: 'none',
                    background: '#FEE2E2',
                    color: '#DC2626',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {t('talentPool.clearFilters')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {entriesLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="loading-spinner" />
        </div>
      ) : entries.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 60,
          background: 'white',
          borderRadius: 12,
          border: '2px dashed #E5E7EB',
        }}>
          <Sparkles size={48} color="#D1D5DB" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>
            {t('talentPool.noEntries')}
          </h3>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
            {t('talentPool.noEntriesDescription')}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 16,
        }}>
          {entries.map(entry => (
            <div
              key={entry.id}
              style={{
                background: 'white',
                borderRadius: 12,
                border: '1px solid #E5E7EB',
                overflow: 'hidden',
                opacity: entry.status === 'archived' ? 0.7 : 1,
              }}
            >
              {/* Header */}
              <div style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                borderBottom: '1px solid #F3F4F6',
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: getAvatarColor(entry.candidate?.name),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 18,
                  flexShrink: 0,
                }}>
                  {getInitials(entry.candidate?.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#111827',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {entry.candidate?.name || t('talentPool.unnamed')}
                  </h3>
                  {entry.candidate?.email && (
                    <div style={{ fontSize: 13, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Mail size={12} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.candidate.email}
                      </span>
                    </div>
                  )}
                </div>
                {entry.status === 'archived' && (
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 12,
                    background: '#FEF3C7',
                    color: '#92400E',
                    fontSize: 11,
                    fontWeight: 600,
                  }}>
                    {t('talentPool.archived')}
                  </span>
                )}
              </div>

              {/* Body */}
              <div style={{ padding: '16px 20px' }}>
                {/* Tags */}
                {entry.tags && entry.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {entry.tags.slice(0, 4).map(tag => (
                      <span
                        key={tag.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          borderRadius: 12,
                          background: `${tag.color}15`,
                          color: tag.color,
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: tag.color }} />
                        {tag.name}
                      </span>
                    ))}
                    {entry.tags.length > 4 && (
                      <span style={{ fontSize: 12, color: '#6B7280' }}>+{entry.tags.length - 4}</span>
                    )}
                  </div>
                )}

                {/* Notes Preview */}
                {entry.notes && (
                  <p style={{
                    margin: '0 0 12px',
                    fontSize: 13,
                    color: '#6B7280',
                    lineHeight: 1.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {entry.notes}
                  </p>
                )}

                {/* Source Job */}
                {entry.sourceJob && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    background: '#F3F4F6',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#4B5563',
                  }}>
                    <Briefcase size={14} />
                    <span>{t('talentPool.fromJob')}:</span>
                    <strong>{entry.sourceJob.title}</strong>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '12px 20px',
                borderTop: '1px solid #F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9CA3AF' }}>
                  <Clock size={14} />
                  {getRelativeTime(entry.addedAt)}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setEditingEntry(entry)}
                    title={t('common.edit')}
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      border: 'none',
                      background: '#EEF2FF',
                      color: '#6366F1',
                      cursor: 'pointer',
                    }}
                  >
                    <Edit2 size={14} />
                  </button>
                  {entry.status === 'active' ? (
                    <button
                      onClick={() => handleArchive(entry.id)}
                      title={t('talentPool.archive')}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        border: 'none',
                        background: '#FEF3C7',
                        color: '#92400E',
                        cursor: 'pointer',
                      }}
                    >
                      <Archive size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRestore(entry.id)}
                      title={t('talentPool.restore')}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        border: 'none',
                        background: '#D1FAE5',
                        color: '#059669',
                        cursor: 'pointer',
                      }}
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteConfirm(entry)}
                    title={t('common.delete')}
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      border: 'none',
                      background: '#FEE2E2',
                      color: '#DC2626',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div style={{
          background: 'white',
          borderRadius: 12,
          border: '1px solid #E5E7EB',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
                  {t('talentPool.candidateColumn')}
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
                  {t('talentPool.tagsColumn')}
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
                  {t('talentPool.sourceColumn')}
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
                  {t('talentPool.addedColumn')}
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
                  {t('talentPool.actionsColumn')}
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr
                  key={entry.id}
                  style={{
                    borderTop: '1px solid #E5E7EB',
                    opacity: entry.status === 'archived' ? 0.7 : 1,
                  }}
                >
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: getAvatarColor(entry.candidate?.name),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: 14,
                      }}>
                        {getInitials(entry.candidate?.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>
                          {entry.candidate?.name}
                        </div>
                        <div style={{ fontSize: 13, color: '#6B7280' }}>
                          {entry.candidate?.email}
                        </div>
                      </div>
                      {entry.status === 'archived' && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 10,
                          background: '#FEF3C7',
                          color: '#92400E',
                          fontSize: 10,
                          fontWeight: 600,
                        }}>
                          {t('talentPool.archived')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {entry.tags?.slice(0, 3).map(tag => (
                        <span
                          key={tag.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 10,
                            background: `${tag.color}15`,
                            color: tag.color,
                            fontSize: 11,
                            fontWeight: 500,
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                      {entry.tags && entry.tags.length > 3 && (
                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>+{entry.tags.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontSize: 13, color: '#4B5563' }}>
                    {entry.sourceJob?.title || '-'}
                  </td>
                  <td style={{ padding: '16px', fontSize: 13, color: '#6B7280' }}>
                    {formatDate(entry.addedAt)}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setEditingEntry(entry)}
                        style={{ padding: 6, borderRadius: 6, border: 'none', background: '#EEF2FF', color: '#6366F1', cursor: 'pointer' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      {entry.status === 'active' ? (
                        <button
                          onClick={() => handleArchive(entry.id)}
                          style={{ padding: 6, borderRadius: 6, border: 'none', background: '#FEF3C7', color: '#92400E', cursor: 'pointer' }}
                        >
                          <Archive size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRestore(entry.id)}
                          style={{ padding: 6, borderRadius: 6, border: 'none', background: '#D1FAE5', color: '#059669', cursor: 'pointer' }}
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteConfirm(entry)}
                        style={{ padding: 6, borderRadius: 6, border: 'none', background: '#FEE2E2', color: '#DC2626', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          tags={tags}
          onClose={() => setEditingEntry(null)}
          onSuccess={() => {
            refetch();
            setEditingEntry(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 24,
            maxWidth: 400,
            width: '90%',
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 600 }}>
              {t('talentPool.removeTitle')}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6B7280' }}>
              <strong>"{deleteConfirm.candidate?.name}"</strong> {t('talentPool.removeMessage')}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-secondary">
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleRemove(deleteConfirm.id)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#DC2626',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TalentPoolPage;
