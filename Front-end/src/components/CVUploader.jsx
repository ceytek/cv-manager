/**
 * CVUploader Component - Drag & Drop File Upload
 * Modular, reusable component for CV uploads
 * Supports batch uploading to prevent timeout errors
 */
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import { UPLOAD_CVS_MUTATION } from '../graphql/cvs';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import CVUploadProgressModal from './CVUploadProgressModal';
import { GRAPHQL_URL } from '../config/api';

// Batch size for uploads - prevents timeout errors
// Reduced to 3 for safer AI processing time
const BATCH_SIZE = 3;

// Pagination settings
const FILES_PER_PAGE = 5;

const CVUploader = ({ onUploadComplete, departments }) => {
  const { t } = useTranslation();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Pagination for selected files
  const [currentPage, setCurrentPage] = useState(1);
  
  // Progress modal state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    currentFile: 0,
    totalFiles: 0,
    processedFiles: 0,
    currentFileName: '',
    status: 'processing' // 'processing', 'success', 'error'
  });
  
  // Calculate pagination for selected files
  const totalPages = Math.ceil(selectedFiles.length / FILES_PER_PAGE);
  const startIndex = (currentPage - 1) * FILES_PER_PAGE;
  const paginatedFiles = selectedFiles.slice(startIndex, startIndex + FILES_PER_PAGE);
  
  // Reset to page 1 when files change
  const handleFilesChange = (files) => {
    setSelectedFiles(files);
    setCurrentPage(1);
  };

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles) => {
    handleFilesChange(acceptedFiles);
    setUploadResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: true,
  });

  // Remove file from selection (index is relative to full list)
  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    
    // Adjust page if current page becomes empty
    const newTotalPages = Math.ceil(newFiles.length / FILES_PER_PAGE);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }
  };

  // Upload a single batch of files
  const uploadBatch = async (batchFiles, token) => {
    const formData = new FormData();

    const operations = {
      query: `
        mutation UploadCVs($files: [Upload!]!, $departmentId: String!) {
          uploadCvs(files: $files, departmentId: $departmentId) {
            successful {
              fileName
              filePath
              fileSize
              candidateName
              candidateEmail
              candidatePhone
              candidateLinkedin
              candidateGithub
            }
            failed {
              fileName
              reason
            }
            totalUploaded
            totalFailed
          }
        }
      `,
      variables: {
        files: Array(batchFiles.length).fill(null),
        departmentId: selectedDepartment
      }
    };

    // Map each file to its variables.files index
    const map = {};
    batchFiles.forEach((file, idx) => {
      map[idx] = [`variables.files.${idx}`];
    });

    formData.append('operations', JSON.stringify(operations));
    formData.append('map', JSON.stringify(map));
    batchFiles.forEach((file, idx) => {
      formData.append(String(idx), file);
    });

    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    return await response.json();
  };

  // Upload files in batches to prevent timeout
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert(t('cvUploader.selectAtLeastOneFile'));
      return;
    }
    
    if (!selectedDepartment) {
      alert(t('cvUploader.selectDepartmentAlert'));
      return;
    }

    setIsUploading(true);
    setUploadResult(null);
    
    // Show progress modal
    setShowProgressModal(true);
    setUploadProgress({
      currentFile: 0,
      totalFiles: selectedFiles.length,
      processedFiles: 0,
      currentFileName: '',
      status: 'processing'
    });

    // Aggregate results from all batches
    const results = {
      successful: [],
      failed: [],
      totalUploaded: 0,
      totalFailed: 0
    };

    const token = sessionStorage.getItem('accessToken');

    try {
      // Split files into batches
      const batches = [];
      for (let i = 0; i < selectedFiles.length; i += BATCH_SIZE) {
        batches.push(selectedFiles.slice(i, i + BATCH_SIZE));
      }

      let processedCount = 0;

      // Process batches sequentially
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        // Update progress - show current batch files being processed
        setUploadProgress(prev => ({
          ...prev,
          currentFileName: batch.map(f => f.name).join(', ')
        }));

        try {
          const result = await uploadBatch(batch, token);

          if (result.errors) {
            // If GraphQL errors returned, mark batch as failed
            batch.forEach((file) => {
              results.failed.push({
                fileName: file.name,
                reason: result.errors?.[0]?.message || t('cvUploader.uploadFailed')
              });
            });
            results.totalFailed += batch.length;
          } else {
            const data = result.data.uploadCvs;
            results.successful.push(...data.successful);
            results.failed.push(...data.failed);
            results.totalUploaded += data.totalUploaded;
            results.totalFailed += data.totalFailed;
          }
        } catch (batchError) {
          // Handle batch-level errors
          batch.forEach((file) => {
            results.failed.push({
              fileName: file.name,
              reason: batchError.message || t('cvUploader.uploadFailed')
            });
          });
          results.totalFailed += batch.length;
        }

        // Update processed count after each batch
        processedCount += batch.length;
        setUploadProgress(prev => ({
          ...prev,
          processedFiles: processedCount
        }));
      }

      // Update final progress
      setUploadProgress(prev => ({
        ...prev,
        processedFiles: selectedFiles.length,
        currentFileName: '',
        status: results.totalFailed === 0 ? 'success' : (results.totalUploaded > 0 ? 'error' : 'error')
      }));

      setUploadResult(results);
      
      // Clear selected files if all successful
      if (results.totalFailed === 0) {
        setSelectedFiles([]);
      }

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowProgressModal(false);
      }, 2000);

      // Callback for parent component
      if (onUploadComplete) {
        onUploadComplete(results);
      }
    } catch (error) {
      setUploadProgress(prev => ({
        ...prev,
        status: 'error'
      }));
      
      setUploadResult({
        successful: results.successful,
        failed: [
          ...results.failed,
          ...selectedFiles.slice(results.successful.length + results.failed.length).map(f => ({
            fileName: f.name,
            reason: error.message || t('cvUploader.uploadFailed'),
          }))
        ],
        totalUploaded: results.totalUploaded,
        totalFailed: selectedFiles.length - results.totalUploaded,
      });

      setTimeout(() => {
        setShowProgressModal(false);
      }, 2000);
    } finally {
      setIsUploading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Progress Modal */}
      <CVUploadProgressModal
        isOpen={showProgressModal}
        currentFile={uploadProgress.currentFile}
        totalFiles={uploadProgress.totalFiles}
        processedFiles={uploadProgress.processedFiles}
        currentFileName={uploadProgress.currentFileName}
        status={uploadProgress.status}
      />

      {/* Upload Result */}
      {uploadResult && (
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            background: uploadResult.totalFailed === 0 ? '#D1FAE5' : (uploadResult.totalUploaded === 0 ? '#FEE2E2' : '#FEF3C7'),
            border: `1px solid ${uploadResult.totalFailed === 0 ? '#10B981' : (uploadResult.totalUploaded === 0 ? '#DC2626' : '#F59E0B')}`,
          }}
        >
          {uploadResult.totalFailed === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle size={24} color="#059669" />
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#065F46', marginBottom: 4 }}>
                  ✅ {t('cvUploader.uploadComplete')}
                </h3>
                <p style={{ fontSize: 14, color: '#047857' }}>
                  {t('cvUploader.filesUploaded', { count: uploadResult.totalUploaded })}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <AlertCircle size={24} color={uploadResult.totalUploaded === 0 ? "#DC2626" : "#D97706"} />
                <h3 style={{ fontSize: 16, fontWeight: 600, color: uploadResult.totalUploaded === 0 ? '#991B1B' : '#92400E' }}>
                  {uploadResult.totalUploaded === 0 ? (
                    <>❌ {t('cvUploader.uploadFailed')}</>
                  ) : (
                    <>⚠️ {t('cvUploader.uploadPartialSuccess')}</>
                  )}
                </h3>
              </div>
              
              {uploadResult.totalUploaded > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 14, color: '#065F46', fontWeight: 500 }}>
                    ✅ {t('cvUploader.successful', { count: uploadResult.totalUploaded })}:
                  </p>
                  <ul style={{ marginTop: 4, paddingLeft: 20, fontSize: 13, color: '#047857' }}>
                    {uploadResult.successful.map((file, idx) => (
                      <li key={idx}>{file.fileName}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {uploadResult.totalFailed > 0 && (
                <div>
                  <p style={{ fontSize: 14, color: '#991B1B', fontWeight: 500 }}>
                    ❌ {t('cvUploader.failed', { count: uploadResult.totalFailed })}:
                  </p>
                  <ul style={{ marginTop: 4, paddingLeft: 20, fontSize: 13, color: '#7C2D12' }}>
                    {uploadResult.failed.map((file, idx) => (
                      <li key={idx}>
                        <strong>{file.fileName}</strong> → {file.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Departman Seçimi */}
      <div style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB' }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
          {t('cvUploader.selectDepartment')} <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #D1D5DB',
            borderRadius: 8,
            fontSize: 14,
            color: '#1F2937',
            background: 'white',
            cursor: 'pointer',
          }}
        >
          <option value="">{t('cvUploader.selectDepartmentPlaceholder')}</option>
          {departments?.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
        <p style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>
          {t('cvUploader.departmentNote')}
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        style={{
          border: '2px dashed #D1D5DB',
          borderRadius: 12,
          padding: 40,
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragActive ? '#EFF6FF' : '#F9FAFB',
          transition: 'all 0.2s',
        }}
      >
        <input {...getInputProps()} />
        <Upload size={48} color="#3B82F6" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>
          {t('cvUploader.bulkUploadTitle')}
        </h3>
        {isDragActive ? (
          <p style={{ color: '#3B82F6', fontSize: 14 }}>{t('cvUploader.dropFilesHere')}</p>
        ) : (
          <div>
            <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 8 }}>
              {t('cvUploader.dragDropText')}
            </p>
            <p style={{ color: '#9CA3AF', fontSize: 12 }}>
              {t('cvUploader.supportedFormats')}
            </p>
          </div>
        )}
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div>
          <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#1F2937' }}>
            {t('cvUploader.selectedFiles', { count: selectedFiles.length })}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {paginatedFiles.map((file, index) => {
              const actualIndex = startIndex + index; // Real index in full array
              return (
                <div
                  key={actualIndex}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <FileText size={20} color="#3B82F6" />
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#1F2937' }}>
                        {file.name}
                      </p>
                      <p style={{ fontSize: 12, color: '#6B7280' }}>
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(actualIndex)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                    }}
                    disabled={isUploading}
                  >
                    <X size={20} color="#EF4444" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: 8, 
              marginTop: 16,
              padding: '12px 0',
            }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '6px 12px',
                  background: currentPage === 1 ? '#F3F4F6' : 'white',
                  border: '1px solid #D1D5DB',
                  borderRadius: 6,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  color: currentPage === 1 ? '#9CA3AF' : '#374151',
                  fontSize: 13,
                }}
              >
                ←
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    padding: '6px 12px',
                    background: currentPage === page ? '#3B82F6' : 'white',
                    border: currentPage === page ? '1px solid #3B82F6' : '1px solid #D1D5DB',
                    borderRadius: 6,
                    cursor: 'pointer',
                    color: currentPage === page ? 'white' : '#374151',
                    fontSize: 13,
                    fontWeight: currentPage === page ? 600 : 400,
                  }}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '6px 12px',
                  background: currentPage === totalPages ? '#F3F4F6' : 'white',
                  border: '1px solid #D1D5DB',
                  borderRadius: 6,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  color: currentPage === totalPages ? '#9CA3AF' : '#374151',
                  fontSize: 13,
                }}
              >
                →
              </button>
            </div>
          )}

          {/* Upload Button */}
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              style={{
                flex: 1,
                padding: '12px 24px',
                background: isUploading ? '#9CA3AF' : '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: isUploading ? 'not-allowed' : 'pointer',
              }}
            >
              {isUploading ? t('cvUploader.uploading') : t('cvUploader.uploadAll', { count: selectedFiles.length })}
            </button>
            <button
              onClick={() => handleFilesChange([])}
              disabled={isUploading}
              style={{
                padding: '12px 24px',
                background: 'white',
                color: '#6B7280',
                border: '1px solid #D1D5DB',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: isUploading ? 'not-allowed' : 'pointer',
              }}
            >
              {t('cvUploader.clear')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CVUploader;
