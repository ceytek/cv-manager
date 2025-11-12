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
} from '../graphql/departments';
import { Edit2, Trash2, Plus } from 'lucide-react';

const DepartmentsPage = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: '', isActive: true });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch departments
  const { data, loading, error: queryError, refetch } = useQuery(DEPARTMENTS_QUERY, {
    variables: { includeInactive: false },
    fetchPolicy: 'network-only',
  });

  // Mutations
  const [createDepartment] = useMutation(CREATE_DEPARTMENT_MUTATION, {
    refetchQueries: [{ query: DEPARTMENTS_QUERY, variables: { includeInactive: false } }],
  });

  const [updateDepartment] = useMutation(UPDATE_DEPARTMENT_MUTATION, {
    refetchQueries: [{ query: DEPARTMENTS_QUERY, variables: { includeInactive: false } }],
  });

  const [toggleDepartmentActive] = useMutation(TOGGLE_DEPARTMENT_ACTIVE_MUTATION, {
    refetchQueries: [{ query: DEPARTMENTS_QUERY, variables: { includeInactive: false } }],
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
          >
            {editingId ? t('departments.update') : t('departments.save')}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="btn-secondary"
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
                    onClick={() => handleToggleActive(dept.id)}
                    className="icon-button"
                    title={dept.isActive ? t('departments.makeInactive') : t('departments.makeActive')}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DepartmentsPage;
