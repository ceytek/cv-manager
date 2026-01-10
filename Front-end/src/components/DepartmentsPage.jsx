/**
 * Departments Management Page
 * Admin-only page for managing departments
 * Modular component - completely separate from users/auth
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
import { Edit2, Trash2, Plus } from 'lucide-react';

const DepartmentsPage = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: '', isActive: true });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name }

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
        // Has related records - show error directly
        setError(t('departments.hasRelatedRecords'));
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
    <div className="table-card">
      <h3>{t('departments.title')}</h3>

      {/* Inline form styled like Users table area */}
  <form onSubmit={handleSubmit} className="mb-4">
        {error && (
          <div className="mb-3 text-sm text-red-600">{error}</div>
        )}
        {success && (
          <div className="mb-3 text-sm text-green-600">{success}</div>
        )}
        <div className="form-row">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t('departments.namePlaceholder')}
            className="text-input"
            required
            minLength={2}
            maxLength={100}
          />
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 select-none">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4"
            />
            {t('departments.active')}
          </label>
          <button
            type="submit"
            className="btn-primary"
            style={{ width: '120px', flex: '0 0 auto', display: 'inline-flex', justifyContent: 'center' }}
          >
            {editingId ? t('departments.update') : t('departments.save')}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="btn-secondary"
              style={{ width: '120px', flex: '0 0 auto', display: 'inline-flex', justifyContent: 'center' }}
            >
              {t('departments.cancel')}
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">{t('departments.lengthInfo')}</p>
      </form>

      {/* Table */}
      <table className="jobs-table">
        <thead>
          <tr>
            <th>{t('departments.department')}</th>
            <th>{t('departments.status')}</th>
            <th className="text-right">{t('departments.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {departments.map((dept) => (
            <tr key={dept.id}>
              <td className="job-title">{dept.name}</td>
              <td>
                <span className={`status-badge ${dept.isActive ? 'green' : 'red'}`}>
                  {dept.isActive ? t('departments.active') : t('departments.inactive')}
                </span>
              </td>
              <td className="text-right">
                <div style={{ display: 'inline-flex', gap: 8 }}>
                  <button
                    onClick={() => handleEdit(dept)}
                    className="icon-button"
                    title={t('departments.edit')}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(dept)}
                    className="icon-button"
                    title={t('common.delete')}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
