/**
 * Departments Management Page
 * Admin-only page for managing departments
 * Card-based layout with job counts
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  DEPARTMENTS_QUERY,
  CREATE_DEPARTMENT_MUTATION,
  UPDATE_DEPARTMENT_MUTATION,
  TOGGLE_DEPARTMENT_ACTIVE_MUTATION,
  DELETE_DEPARTMENT_MUTATION,
  DEPARTMENT_HAS_RELATED_RECORDS_QUERY,
} from '../graphql/departments';
import client from '../apolloClient';
import { Edit2, Trash2, Plus, Briefcase, Building2, List, LayoutGrid } from 'lucide-react';

const DepartmentsPage = ({ initialShowAddForm = false, onAddFormClosed }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: '', isActive: true });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name }
  const [cannotDeleteModal, setCannotDeleteModal] = useState(null); // { name }
  const [showAddForm, setShowAddForm] = useState(initialShowAddForm);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'list'

  // Handle initialShowAddForm prop change
  React.useEffect(() => {
    if (initialShowAddForm) {
      setShowAddForm(true);
    }
  }, [initialShowAddForm]);

  // Custom setShowAddForm that also notifies parent when closing
  const handleSetShowAddForm = (value) => {
    setShowAddForm(value);
    if (!value && onAddFormClosed) {
      onAddFormClosed();
    }
  };

  // Fetch departments (including inactive ones to show in admin list)
  const { data, loading, error: queryError, refetch } = useQuery(DEPARTMENTS_QUERY, {
    variables: { includeInactive: true },
    fetchPolicy: 'network-only',
  });

  // Mutations
  const [createDepartment] = useMutation(CREATE_DEPARTMENT_MUTATION, {
    refetchQueries: [{ query: DEPARTMENTS_QUERY, variables: { includeInactive: true } }],
  });

  const [updateDepartment] = useMutation(UPDATE_DEPARTMENT_MUTATION, {
    refetchQueries: [{ query: DEPARTMENTS_QUERY, variables: { includeInactive: true } }],
  });

  const [toggleDepartmentActive] = useMutation(TOGGLE_DEPARTMENT_ACTIVE_MUTATION, {
    refetchQueries: [{ query: DEPARTMENTS_QUERY, variables: { includeInactive: true } }],
  });

  const [deleteDepartment] = useMutation(DELETE_DEPARTMENT_MUTATION, {
    refetchQueries: [{ query: DEPARTMENTS_QUERY, variables: { includeInactive: true } }],
  });

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError(t('departments.nameRequired'));
      return;
    }

    if (formData.name.trim().length < 2) {
      setError(t('departments.nameMinLength'));
      return;
    }

    try {
      if (editingId) {
        // Update existing department
        await updateDepartment({
          variables: {
            id: editingId,
            input: {
              name: formData.name.trim(),
              isActive: formData.isActive,
            },
          },
        });
        setSuccess(t('departments.updateSuccess'));
        setEditingId(null);
      } else {
        // Create new department
        await createDepartment({
          variables: {
            input: {
              name: formData.name.trim(),
              isActive: formData.isActive,
            },
          },
        });
        setSuccess(t('departments.createSuccess'));
      }
      setFormData({ name: '', isActive: true });
      // Force immediate refetch
      await refetch();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || t('departments.errorOccurred'));
    }
  };

  // Handle edit
  const handleEdit = (dept) => {
    setEditingId(dept.id);
    setFormData({ name: dept.name, isActive: dept.isActive });
    setError('');
    setSuccess('');
  };

  // Handle toggle active
  const handleToggleActive = async (id) => {
    try {
      setError('');
      setSuccess('');
      await toggleDepartmentActive({ variables: { id } });
      setSuccess(t('departments.statusChangeSuccess'));
      await refetch();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || t('departments.statusChangeError'));
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', isActive: true });
    setError('');
    setSuccess('');
  };

  // Check if department can be deleted (before showing modal)
  const handleDeleteClick = async (dept) => {
    setError('');
    setSuccess('');
    
    try {
      // First check if department has related records
      const { data } = await client.query({
        query: DEPARTMENT_HAS_RELATED_RECORDS_QUERY,
        variables: { id: dept.id },
        fetchPolicy: 'network-only',
      });
      
      if (data?.departmentHasRelatedRecords) {
        // Has related records - show warning modal
        setCannotDeleteModal({ name: dept.name });
      } else {
        // No related records - show confirmation modal
        setDeleteConfirm({ id: dept.id, name: dept.name });
      }
    } catch (err) {
      setError(err.message || t('departments.deleteError'));
    }
  };

  // Handle delete (after confirmation)
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      setError('');
      setSuccess('');
      await deleteDepartment({ variables: { id: deleteConfirm.id } });
      setSuccess(t('departments.deleteSuccess'));
      setDeleteConfirm(null);
      await refetch();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || t('departments.deleteError'));
      setDeleteConfirm(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">{t('common.loading')}</div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">{t('common.error')}: {queryError.message}</div>
      </div>
    );
  }

  const departments = data?.departments || [];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 24,
      }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1F2937', marginBottom: 8 }}>
            {t('departments.title')}
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280' }}>
            {t('departments.subtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* View Toggle */}
          <div style={{
            display: 'flex',
            background: '#F3F4F6',
            borderRadius: 10,
            padding: 4,
          }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: viewMode === 'list' ? 'white' : 'transparent',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                color: viewMode === 'list' ? '#1F2937' : '#6B7280',
                cursor: 'pointer',
                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <List size={16} />
              {t('departments.listView', 'Liste')}
            </button>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: viewMode === 'cards' ? 'white' : 'transparent',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                color: viewMode === 'cards' ? '#1F2937' : '#6B7280',
                cursor: 'pointer',
                boxShadow: viewMode === 'cards' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <LayoutGrid size={16} />
              {t('departments.cardView', 'Kart')}
            </button>
          </div>
          <button
            onClick={() => { setShowAddForm(true); setEditingId(null); setFormData({ name: '', isActive: true }); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            }}
          >
            <Plus size={18} />
            {t('departments.addNew', 'Yeni Departman')}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          padding: '12px 16px',
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: 8,
          color: '#B91C1C',
          marginBottom: 16,
          fontSize: 14,
        }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{
          padding: '12px 16px',
          background: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: 8,
          color: '#15803D',
          marginBottom: 16,
          fontSize: 14,
        }}>
          {success}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingId) && (
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #E5E7EB',
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#1F2937' }}>
            {editingId ? t('departments.editDepartment', 'Departmanı Düzenle') : t('departments.addNew', 'Yeni Departman')}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 250 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  {t('departments.departmentName', 'Departman Adı')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('departments.namePlaceholder')}
                  required
                  minLength={2}
                  maxLength={100}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                />
              </div>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                fontSize: 14, 
                color: '#374151',
                cursor: 'pointer',
                padding: '10px 0',
              }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                {t('departments.active')}
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    background: '#6366F1',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {editingId ? t('departments.update') : t('departments.save')}
                </button>
                <button
                  type="button"
                  onClick={() => { handleSetShowAddForm(false); handleCancelEdit(); }}
                  style={{
                    padding: '10px 20px',
                    background: '#F3F4F6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {t('departments.cancel')}
                </button>
              </div>
            </div>
            <p style={{ marginTop: 8, fontSize: 12, color: '#9CA3AF' }}>
              {t('departments.lengthInfo')}
            </p>
          </form>
        </div>
      )}

      {/* Department Cards Grid */}
      {viewMode === 'cards' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 20,
        }}>
          {departments.map((dept) => (
            <div
              key={dept.id}
              style={{
                background: 'white',
                borderRadius: 16,
                padding: 20,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: '1px solid #E5E7EB',
                transition: 'all 0.2s',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <span style={{
                  padding: '4px 12px',
                  background: dept.isActive ? '#D1FAE5' : '#FEE2E2',
                  color: dept.isActive ? '#065F46' : '#991B1B',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                }}>
                  {dept.isActive ? t('departments.active') : t('departments.inactive')}
                </span>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                  📅 {new Date(dept.createdAt).toLocaleDateString('tr-TR')}
                </span>
              </div>

              {/* Department Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: dept.color || '#6366F1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Building2 size={22} color="white" />
                </div>
                <h3 style={{ 
                  fontSize: 18, 
                  fontWeight: 600, 
                  color: '#1F2937',
                  margin: 0,
                }}>
                  {dept.name}
                </h3>
              </div>

              {/* Job Count */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 16px',
                background: '#F9FAFB',
                borderRadius: 10,
                marginBottom: 16,
              }}>
                <Briefcase size={18} color={dept.color || '#6366F1'} />
                <span style={{ fontSize: 14, color: '#4B5563' }}>
                  {t('departments.jobCount', 'İlan Sayısı')}:
                </span>
                <span style={{ 
                  fontSize: 16, 
                  fontWeight: 700, 
                  color: dept.jobCount > 0 ? (dept.color || '#6366F1') : '#9CA3AF',
                }}>
                  {dept.jobCount || 0}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleEdit(dept)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '10px 16px',
                    background: '#F3F4F6',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#374151',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
                >
                  <Edit2 size={16} />
                  {t('departments.edit')}
                </button>
                <button
                  onClick={() => handleDeleteClick(dept)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 14px',
                    background: '#FEF2F2',
                    border: 'none',
                    borderRadius: 8,
                    color: '#B91C1C',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#FEE2E2'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#FEF2F2'}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Department List View */}
      {viewMode === 'list' && (
        <div style={{
          background: 'white',
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          border: '1px solid #E5E7EB',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6B7280' }}>
                  {t('departments.department')}
                </th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6B7280' }}>
                  {t('departments.status')}
                </th>
                <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#6B7280' }}>
                  {t('departments.jobCount', 'İlan Sayısı')}
                </th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6B7280' }}>
                  {t('departments.createdAt', 'Oluşturulma')}
                </th>
                <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#6B7280' }}>
                  {t('departments.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept, index) => (
                <tr 
                  key={dept.id}
                  style={{ 
                    borderBottom: index < departments.length - 1 ? '1px solid #E5E7EB' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: dept.color || '#6366F1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Building2 size={18} color="white" />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>
                        {dept.name}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      padding: '4px 12px',
                      background: dept.isActive ? '#D1FAE5' : '#FEE2E2',
                      color: dept.isActive ? '#065F46' : '#991B1B',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 500,
                    }}>
                      {dept.isActive ? t('departments.active') : t('departments.inactive')}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <span style={{ 
                      fontSize: 14, 
                      fontWeight: 600, 
                      color: dept.jobCount > 0 ? (dept.color || '#6366F1') : '#9CA3AF',
                    }}>
                      {dept.jobCount || 0}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: 13, color: '#6B7280' }}>
                    {new Date(dept.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                      <button
                        onClick={() => handleEdit(dept)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          padding: '8px 12px',
                          background: '#F3F4F6',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 500,
                          color: '#374151',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
                      >
                        <Edit2 size={14} />
                        {t('departments.edit')}
                      </button>
                      <button
                        onClick={() => handleDeleteClick(dept)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '8px 10px',
                          background: '#FEF2F2',
                          border: 'none',
                          borderRadius: 6,
                          color: '#B91C1C',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#FEE2E2'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#FEF2F2'}
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

      {/* Empty State */}
      {departments.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 60,
          background: '#F9FAFB',
          borderRadius: 16,
          border: '2px dashed #E5E7EB',
        }}>
          <Building2 size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            {t('departments.noDepartments', 'Henüz departman yok')}
          </h3>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
            {t('departments.createFirst', 'İlk departmanınızı oluşturarak başlayın')}
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              padding: '12px 24px',
              background: '#6366F1',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            {t('departments.addNew', 'Yeni Departman')}
          </button>
        </div>
      )}

      {/* Cannot Delete Warning Modal */}
      {cannotDeleteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 24,
            maxWidth: 400,
            width: '90%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600, color: '#B91C1C' }}>
              ⚠️ {t('departments.cannotDeleteTitle')}
            </h3>
            <p style={{ margin: '0 0 20px', color: '#4B5563', lineHeight: 1.5 }}>
              <strong>"{cannotDeleteModal.name}"</strong> {t('departments.cannotDeleteMessage')}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setCannotDeleteModal(null)}
                style={{
                  padding: '10px 24px',
                  background: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {t('common.ok')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 24,
            maxWidth: 400,
            width: '90%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600 }}>
              {t('departments.deleteConfirmTitle')}
            </h3>
            <p style={{ margin: '0 0 20px', color: '#4B5563', lineHeight: 1.5 }}>
              <strong>"{deleteConfirm.name}"</strong> {t('departments.deleteConfirmMessage')}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '10px 20px',
                  background: '#F3F4F6',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '10px 20px',
                  background: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 500,
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

export default DepartmentsPage;
