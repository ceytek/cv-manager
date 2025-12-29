/**
 * Job Service
 * Handles all job-related operations
 * Completely separate from users/auth/departments services
 */
import client from '../config/apolloClient';
import {
  JOBS_QUERY,
  CREATE_JOB_MUTATION,
  UPDATE_JOB_MUTATION,
  TOGGLE_JOB_ACTIVE_MUTATION,
} from '../graphql/jobs';

class JobsService {
  /**
   * List all jobs with optional filters
   * @param {Object} filters - Filter options
   * @param {boolean} filters.includeInactive - Include inactive jobs
   * @param {string} filters.status - Filter by status (draft/active/closed/archived)
   * @param {string} filters.departmentId - Filter by department
   * @param {string} filters.searchTerm - Search in title/description
   * @returns {Promise<Array>} List of jobs
   */
  async listJobs(filters = {}) {
    try {
      const { data } = await client.query({
        query: JOBS_QUERY,
        variables: {
          includeInactive: filters.includeInactive || false,
          status: filters.status || null,
          departmentId: filters.departmentId || null,
          searchTerm: filters.searchTerm || null,
        },
        fetchPolicy: 'network-only',
      });
      return data.jobs;
    } catch (error) {
      console.error('Error listing jobs:', error);
      throw new Error(error.message || 'İş ilanları yüklenirken hata oluştu');
    }
  }

  /**
   * Create a new job
   * @param {Object} jobData - Job creation data
   * @returns {Promise<Object>} Created job
   */
  async createJob(jobData) {
    try {
      const { data } = await client.mutate({
        mutation: CREATE_JOB_MUTATION,
        variables: {
          input: {
            title: jobData.title,
            departmentId: jobData.departmentId,
            description: jobData.description,
            requirements: jobData.requirements,
            keywords: jobData.keywords || [],
            location: jobData.location,
            remotePolicy: jobData.remotePolicy || 'office',
            employmentType: jobData.employmentType || 'full-time',
            experienceLevel: jobData.experienceLevel || 'mid',
            requiredEducation: jobData.requiredEducation || null,
            preferredMajors: jobData.preferredMajors || null,
            requiredLanguages: jobData.requiredLanguages || {},
            salaryMin: jobData.salaryMin || null,
            salaryMax: jobData.salaryMax || null,
            salaryCurrency: jobData.salaryCurrency || 'TRY',
            deadline: jobData.deadline || null,
            startDate: jobData.startDate || null,
            status: jobData.status || 'draft',
            isActive: jobData.isActive !== undefined ? jobData.isActive : true,
          },
        },
        refetchQueries: [{ query: JOBS_QUERY, variables: { includeInactive: false } }],
      });
      return data.createJob;
    } catch (error) {
      console.error('Error creating job:', error);
      throw new Error(error.message || 'İş ilanı oluşturulurken hata oluştu');
    }
  }

  /**
   * Update an existing job
   * @param {string} id - Job ID
   * @param {Object} jobData - Job update data
   * @returns {Promise<Object>} Updated job
   */
  async updateJob(id, jobData) {
    try {
      const input = {};
      
      // Only include fields that are provided
      if (jobData.title !== undefined) input.title = jobData.title;
      if (jobData.departmentId !== undefined) input.departmentId = jobData.departmentId;
      if (jobData.description !== undefined) input.description = jobData.description;
      if (jobData.requirements !== undefined) input.requirements = jobData.requirements;
      if (jobData.keywords !== undefined) input.keywords = jobData.keywords;
      if (jobData.location !== undefined) input.location = jobData.location;
      if (jobData.remotePolicy !== undefined) input.remotePolicy = jobData.remotePolicy;
      if (jobData.employmentType !== undefined) input.employmentType = jobData.employmentType;
      if (jobData.experienceLevel !== undefined) input.experienceLevel = jobData.experienceLevel;
      if (jobData.requiredEducation !== undefined) input.requiredEducation = jobData.requiredEducation;
      if (jobData.preferredMajors !== undefined) input.preferredMajors = jobData.preferredMajors;
      if (jobData.requiredLanguages !== undefined) input.requiredLanguages = jobData.requiredLanguages;
      if (jobData.salaryMin !== undefined) input.salaryMin = jobData.salaryMin;
      if (jobData.salaryMax !== undefined) input.salaryMax = jobData.salaryMax;
      if (jobData.salaryCurrency !== undefined) input.salaryCurrency = jobData.salaryCurrency;
      if (jobData.deadline !== undefined) input.deadline = jobData.deadline;
      if (jobData.startDate !== undefined) input.startDate = jobData.startDate;
      if (jobData.status !== undefined) input.status = jobData.status;
      if (jobData.isActive !== undefined) input.isActive = jobData.isActive;

      const { data } = await client.mutate({
        mutation: UPDATE_JOB_MUTATION,
        variables: { id, input },
        refetchQueries: [{ query: JOBS_QUERY, variables: { includeInactive: false } }],
      });
      return data.updateJob;
    } catch (error) {
      console.error('Error updating job:', error);
      throw new Error(error.message || 'İş ilanı güncellenirken hata oluştu');
    }
  }

  /**
   * Toggle job active status
   * @param {string} id - Job ID
   * @returns {Promise<Object>} Updated job
   */
  async toggleJobActive(id) {
    try {
      const { data } = await client.mutate({
        mutation: TOGGLE_JOB_ACTIVE_MUTATION,
        variables: { id },
        refetchQueries: [{ query: JOBS_QUERY, variables: { includeInactive: false } }],
      });
      return data.toggleJobActive;
    } catch (error) {
      console.error('Error toggling job status:', error);
      throw new Error(error.message || 'İş ilanı durumu değiştirilirken hata oluştu');
    }
  }
}

export default new JobsService();
