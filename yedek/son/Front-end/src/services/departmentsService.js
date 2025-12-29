/**
 * Department Service
 * Handles all department-related operations
 * Completely separate from users/auth services
 */
import client from '../config/apolloClient';
import {
  DEPARTMENTS_QUERY,
  CREATE_DEPARTMENT_MUTATION,
  UPDATE_DEPARTMENT_MUTATION,
  TOGGLE_DEPARTMENT_ACTIVE_MUTATION,
} from '../graphql/departments';

class DepartmentsService {
  /**
   * List all departments
   * @param {boolean} includeInactive - Whether to include inactive departments
   * @returns {Promise<Array>} List of departments
   */
  async listDepartments(includeInactive = false) {
    try {
      const { data } = await client.query({
        query: DEPARTMENTS_QUERY,
        variables: { includeInactive },
        fetchPolicy: 'network-only', // Always fetch fresh data
      });
      return data.departments;
    } catch (error) {
      console.error('Error listing departments:', error);
      throw new Error(error.message || 'Departmanlar yüklenirken hata oluştu');
    }
  }

  /**
   * Create a new department
   * @param {string} name - Department name
   * @param {boolean} isActive - Whether the department is active
   * @returns {Promise<Object>} Created department
   */
  async createDepartment(name, isActive = true) {
    try {
      const { data } = await client.mutate({
        mutation: CREATE_DEPARTMENT_MUTATION,
        variables: {
          input: {
            name,
            isActive,
          },
        },
        refetchQueries: [{ query: DEPARTMENTS_QUERY, variables: { includeInactive: false } }],
      });
      return data.createDepartment;
    } catch (error) {
      console.error('Error creating department:', error);
      throw new Error(error.message || 'Departman oluşturulurken hata oluştu');
    }
  }

  /**
   * Update an existing department
   * @param {string} id - Department ID
   * @param {string} name - New department name (optional)
   * @param {boolean} isActive - New active status (optional)
   * @returns {Promise<Object>} Updated department
   */
  async updateDepartment(id, name = null, isActive = null) {
    try {
      const input = {};
      if (name !== null) input.name = name;
      if (isActive !== null) input.isActive = isActive;

      const { data } = await client.mutate({
        mutation: UPDATE_DEPARTMENT_MUTATION,
        variables: { id, input },
        refetchQueries: [{ query: DEPARTMENTS_QUERY, variables: { includeInactive: false } }],
      });
      return data.updateDepartment;
    } catch (error) {
      console.error('Error updating department:', error);
      throw new Error(error.message || 'Departman güncellenirken hata oluştu');
    }
  }

  /**
   * Toggle department active status
   * @param {string} id - Department ID
   * @returns {Promise<Object>} Updated department
   */
  async toggleDepartmentActive(id) {
    try {
      const { data } = await client.mutate({
        mutation: TOGGLE_DEPARTMENT_ACTIVE_MUTATION,
        variables: { id },
        refetchQueries: [{ query: DEPARTMENTS_QUERY, variables: { includeInactive: false } }],
      });
      return data.toggleDepartmentActive;
    } catch (error) {
      console.error('Error toggling department status:', error);
      throw new Error(error.message || 'Departman durumu değiştirilirken hata oluştu');
    }
  }
}

export default new DepartmentsService();
