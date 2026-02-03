/**
 * Departments Management Page
 * Admin-only page for managing departments
 * Card-based layout with job counts - Modal-based form
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
import { 
  Edit2, Trash2, Plus, Briefcase, Building2, List, LayoutGrid,
  Users, Calculator, Code, Wrench, Headphones, Megaphone, Scale,
  Factory, Truck, ShoppingCart, HeartPulse, GraduationCap, Globe,
  BarChart2, Shield, FileText, Check, X, XCircle
} from 'lucide-react';

// Predefined department icons
const DEPARTMENT_ICONS = [
  { id: 'building-2', name_tr: 'Genel / Yönetim', name_en: 'General / Management', Icon: Building2 },
  { id: 'briefcase', name_tr: 'İş / Operasyon', name_en: 'Business / Operations', Icon: Briefcase },
  { id: 'users', name_tr: 'İnsan Kaynakları', name_en: 'Human Resources', Icon: Users },
  { id: 'calculator', name_tr: 'Finans / Muhasebe', name_en: 'Finance / Accounting', Icon: Calculator },
  { id: 'code', name_tr: 'Yazılım / IT', name_en: 'Software / IT', Icon: Code },
  { id: 'wrench', name_tr: 'Teknik / Mühendislik', name_en: 'Technical / Engineering', Icon: Wrench },
  { id: 'headphones', name_tr: 'Müşteri Hizmetleri', name_en: 'Customer Service', Icon: Headphones },
  { id: 'megaphone', name_tr: 'Pazarlama', name_en: 'Marketing', Icon: Megaphone },
  { id: 'scale', name_tr: 'Hukuk', name_en: 'Legal', Icon: Scale },
  { id: 'factory', name_tr: 'Üretim', name_en: 'Manufacturing', Icon: Factory },
  { id: 'truck', name_tr: 'Lojistik', name_en: 'Logistics', Icon: Truck },
  { id: 'shopping-cart', name_tr: 'Satın Alma', name_en: 'Procurement', Icon: ShoppingCart },
  { id: 'heart-pulse', name_tr: 'Sağlık / İSG', name_en: 'Health / Safety', Icon: HeartPulse },
  { id: 'graduation-cap', name_tr: 'Eğitim / Akademi', name_en: 'Education / Academy', Icon: GraduationCap },
  { id: 'globe', name_tr: 'Uluslararası', name_en: 'International', Icon: Globe },
  { id: 'bar-chart-2', name_tr: 'Analiz / BI', name_en: 'Analytics / BI', Icon: BarChart2 },
  { id: 'shield', name_tr: 'Güvenlik', name_en: 'Security', Icon: Shield },
  { id: 'file-text', name_tr: 'İdari İşler', name_en: 'Administrative', Icon: FileText },
];

// Predefined color palette for departments
const DEPARTMENT_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#22C55E', // Green
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#0EA5E9', // Sky
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#D946EF', // Fuchsia
  '#EC4899', // Pink
];

// Get icon component by id
const getIconComponent = (iconId) => {
  const found = DEPARTMENT_ICONS.find(i => i.id === iconId);
  return found ? found.Icon : Building2;
};

const DepartmentsPage = ({ initialShowAddForm = false, onAddFormClosed }) => {
  const { t, i18n } = useTranslation();
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  
  // Form state
  const [deptName, setDeptName] = useState('');
  const [deptIcon, setDeptIcon] = useState('building-2');
  const [deptColor, setDeptColor] = useState('#6366F1');
  const [deptActive, setDeptActive] = useState(true);
  const [formError, setFormError] = useState('');
  
  // Other state
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [cannotDeleteModal, setCannotDeleteModal] = useState(null);
  const [viewMode, setViewMode] = useState('cards');
  const [success, setSuccess] = useState('');

  // Handle initialShowAddForm prop change
  React.useEffect(() => {
    if (initialShowAddForm) {
      openCreateModal();
    }
  }, [initialShowAddForm]);

  // Custom close handler that notifies parent
  const closeModal = () => {
    setShowModal(false);
    if (onAddFormClosed) {
      onAddFormClosed();
    }
  };

  // Fetch departments
  const { data, loading, error: queryError, refetch } = useQuery(DEPARTMENTS_QUERY, {
    variables: { includeInactive: true },
    fetchPolicy: 'network-only',
  });

  // Mutations
  const [createDepartment, { loading: creating }] = useMutation(CREATE_DEPARTMENT_MUTATION, {
    refetchQueries: [{ query: DEPARTMENTS_QUERY, variables: { includeInactive: true } }],
  });

  const [updateDepartment, { loading: updating }] = useMutation(UPDATE_DEPARTMENT_MUTATION, {
    refetchQueries: [{ query: DEPARTMENTS_QUERY, variables: { includeInactive: true } }],
  });

  const [deleteDepartment, { loading: deleting }] = useMutation(DELETE_DEPARTMENT_MUTATION, {
    refetchQueries: [{ query: DEPARTMENTS_QUERY, variables: { includeInactive: true } }],
  });

  const openCreateModal = () => {
    setEditingDept(null);
    setDeptName('');
    setDeptIcon('building-2');
    setDeptColor('#6366F1');
    setDeptActive(true);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (dept) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setDeptIcon(dept.icon || 'building-2');
    setDeptColor(dept.color || '#6366F1');
    setDeptActive(dept.isActive);
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!deptName.trim()) {
      setFormError(t('departments.nameRequired'));
      return;
    }

    if (deptName.trim().length < 2) {
      setFormError(t('departments.nameMinLength'));
      return;
    }

    try {
      if (editingDept) {
        await updateDepartment({
          variables: {
            id: editingDept.id,
            input: {
              name: deptName.trim(),
              isActive: deptActive,
              icon: deptIcon,
              color: deptColor,
            },
          },
        });
        setSuccess(t('departments.updateSuccess'));
      } else {
        await createDepartment({
          variables: {
            input: {
              name: deptName.trim(),
              isActive: deptActive,
              icon: deptIcon,
              color: deptColor,
            },
          },
        });
        setSuccess(t('departments.createSuccess'));
      }
      
      await refetch();
      closeModal();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setFormError(err.message || t('departments.errorOccurred'));
    }
  };

  // Check if department can be deleted
  const handleDeleteClick = async (dept) => {
    setFormError('');
    setSuccess('');
    
    try {
      const { data } = await client.query({
        query: DEPARTMENT_HAS_RELATED_RECORDS_QUERY,
        variables: { id: dept.id },
        fetchPolicy: 'network-only',
      });
      
      if (data?.departmentHasRelatedRecords) {
        setCannotDeleteModal({ name: dept.name });
      } else {
        setDeleteConfirm({ id: dept.id, name: dept.name });
      }
    } catch (err) {
      setFormError(err.message || t('departments.deleteError'));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      await deleteDepartment({ variables: { id: deleteConfirm.id } });
      setSuccess(t('departments.deleteSuccess'));
      setDeleteConfirm(null);
      await refetch();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setFormError(err.message || t('departments.deleteError'));
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
  const SelectedIcon = getIconComponent(deptIcon);

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
              }}
            >
              <LayoutGrid size={16} />
              {t('departments.cardView', 'Kart')}
            </button>
          </div>
          <button
            onClick={openCreateModal}
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

      {/* Success Message */}
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

      {/* Department Cards Grid */}
      {viewMode === 'cards' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 20,
        }}>
          {departments.map((dept) => {
            const DeptIcon = getIconComponent(dept.icon);
            return (
            <div
              key={dept.id}
              style={{
                background: 'white',
                borderRadius: 16,
                padding: 20,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: '1px solid #E5E7EB',
                transition: 'all 0.2s',
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
                  <DeptIcon size={22} color="white" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', margin: 0 }}>
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
                <span style={{ fontSize: 16, fontWeight: 700, color: dept.jobCount > 0 ? (dept.color || '#6366F1') : '#9CA3AF' }}>
                  {dept.jobCount || 0}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => openEditModal(dept)}
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
                  }}
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
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
          })}
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
              {departments.map((dept, index) => {
                const DeptIcon = getIconComponent(dept.icon);
                return (
                <tr key={dept.id} style={{ borderBottom: index < departments.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
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
                        <DeptIcon size={18} color="white" />
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
                    <span style={{ fontSize: 14, fontWeight: 600, color: dept.jobCount > 0 ? (dept.color || '#6366F1') : '#9CA3AF' }}>
                      {dept.jobCount || 0}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: 13, color: '#6B7280' }}>
                    {new Date(dept.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                      <button
                        onClick={() => openEditModal(dept)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '8px 12px',
                          background: '#F3F4F6',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 500,
                          color: '#374151',
                          cursor: 'pointer',
                        }}
                      >
                        <Edit2 size={14} />
                        {t('departments.edit')}
                      </button>
                      <button
                        onClick={() => handleDeleteClick(dept)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px 10px',
                          background: '#FEF2F2',
                          border: 'none',
                          borderRadius: 6,
                          color: '#B91C1C',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })}
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
            onClick={openCreateModal}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000 
        }}>
          <div style={{ 
            background: 'white', 
            borderRadius: 16, 
            padding: 28, 
            maxWidth: 480, 
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <h3 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 600, color: '#111827' }}>
              {editingDept ? t('departments.editDepartment', 'Departmanı Düzenle') : t('departments.addNew', 'Yeni Departman Oluştur')}
            </h3>
            
            {/* Department Name Input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                {t('departments.departmentName', 'Departman Adı')}
              </label>
              <input
                type="text"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                placeholder={t('departments.namePlaceholder')}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 10,
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#6366F1'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
              />
            </div>

            {/* Icon Picker */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 10 }}>
                {t('departments.icon', 'İkon')}
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DEPARTMENT_ICONS.map((iconItem) => {
                  const IconComp = iconItem.Icon;
                  const isSelected = deptIcon === iconItem.id;
                  return (
                    <button
                      key={iconItem.id}
                      type="button"
                      onClick={() => setDeptIcon(iconItem.id)}
                      title={i18n.language === 'tr' ? iconItem.name_tr : iconItem.name_en}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: isSelected ? deptColor : '#F3F4F6',
                        border: isSelected ? '2px solid #111827' : '2px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <IconComp size={20} color={isSelected ? 'white' : '#6B7280'} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Picker */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 10 }}>
                {t('departments.color', 'Renk')}
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DEPARTMENT_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setDeptColor(color)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: color,
                      border: deptColor === color ? '3px solid #111827' : '2px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {deptColor === color && <Check size={16} color="white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Checkbox */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 10, 
                fontSize: 14, 
                color: '#374151',
                cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={deptActive}
                  onChange={(e) => setDeptActive(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#6366F1' }}
                />
                {t('departments.active')}
              </label>
            </div>

            {/* Preview */}
            <div style={{ marginBottom: 24, padding: 16, background: '#F9FAFB', borderRadius: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 10 }}>
                {t('common.preview', 'Önizleme')}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: deptColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <SelectedIcon size={22} color="white" />
                </div>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>
                  {deptName || t('departments.namePlaceholder')}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {formError && (
              <div style={{ 
                padding: 12, 
                background: '#FEE2E2', 
                borderRadius: 8, 
                color: '#DC2626', 
                fontSize: 14,
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <XCircle size={16} />
                {formError}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button 
                onClick={closeModal}
                style={{
                  padding: '10px 20px',
                  background: '#F3F4F6',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#374151',
                  cursor: 'pointer',
                }}
              >
                {t('common.cancel', 'İptal')}
              </button>
              <button 
                onClick={handleSave}
                disabled={creating || updating}
                style={{
                  padding: '10px 24px',
                  background: '#6366F1',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {(creating || updating) ? (
                  <div className="loading-spinner" style={{ width: 16, height: 16 }} />
                ) : (
                  <Check size={16} />
                )}
                {t('common.save', 'Kaydet')}
              </button>
            </div>
          </div>
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
                disabled={deleting}
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
