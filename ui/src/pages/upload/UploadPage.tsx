import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatFileSize } from '@/utils/format';

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  // Process selected files
  const handleFiles = (selectedFiles: File[]) => {
    const newFiles: UploadedFile[] = selectedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0,
    }));

    // Validate files
    const validFiles = newFiles.filter((fileObj) => {
      const { file } = fileObj;
      
      // Check file type
      const allowedTypes = ['application/pdf', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!allowedTypes.includes(file.type)) {
        fileObj.status = 'error';
        fileObj.error = 'File type not supported. Please upload PDF, CSV, or Excel files.';
        return true; // Keep to show error
      }

      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        fileObj.status = 'error';
        fileObj.error = 'File size exceeds 50MB limit.';
        return true; // Keep to show error
      }

      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
  };

  // Remove file
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  // Upload files
  const handleUpload = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setUploading(true);

    for (const fileObj of pendingFiles) {
      try {
        // Update status to uploading
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, status: 'uploading', progress: 0 } : f
        ));

        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setFiles(prev => prev.map(f => 
            f.id === fileObj.id ? { ...f, progress } : f
          ));
        }

        // Mark as success
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, status: 'success', progress: 100 } : f
        ));

      } catch (error) {
        // Mark as error
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { 
            ...f, 
            status: 'error', 
            error: 'Upload failed. Please try again.' 
          } : f
        ));
      }
    }

    setUploading(false);

    // Show success message and redirect after a delay
    setTimeout(() => {
      navigate('/claims');
    }, 2000);
  };

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText className="w-8 h-8 text-error-500" />;
    }
    return <FileText className="w-8 h-8 text-secondary-500" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-error-500" />;
      case 'uploading':
        return (
          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-secondary-900">Upload Claims</h1>
        <p className="text-secondary-600 mt-1">
          Upload your claim documents for AI-powered processing and denial recovery.
        </p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Select Files</CardTitle>
          <CardDescription>
            Upload PDF, CSV, or Excel files containing claim information. Maximum file size: 50MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-secondary-300 hover:border-secondary-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-secondary-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-secondary-900">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-secondary-600">
                Supports PDF, CSV, and Excel files up to 50MB
              </p>
            </div>
            
            <input
              type="file"
              multiple
              accept=".pdf,.csv,.xls,.xlsx"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Selected Files ({files.length})</CardTitle>
                <CardDescription>
                  Review your files before uploading
                </CardDescription>
              </div>
              <Button
                onClick={handleUpload}
                disabled={uploading || files.every(f => f.status !== 'pending')}
              >
                Upload Files
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((fileObj) => (
                <div
                  key={fileObj.id}
                  className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    {getFileIcon(fileObj.file)}
                    <div>
                      <p className="font-medium text-secondary-900">
                        {fileObj.file.name}
                      </p>
                      <p className="text-sm text-secondary-600">
                        {formatFileSize(fileObj.file.size)} • {fileObj.file.type}
                      </p>
                      {fileObj.error && (
                        <p className="text-sm text-error-600 mt-1">
                          {fileObj.error}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {fileObj.status === 'uploading' && (
                      <div className="w-32">
                        <div className="bg-secondary-200 rounded-full h-2">
                          <div
                            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${fileObj.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-secondary-600 mt-1">
                          {fileObj.progress}%
                        </p>
                      </div>
                    )}
                    
                    {getStatusIcon(fileObj.status)}
                    
                    <button
                      onClick={() => removeFile(fileObj.id)}
                      className="p-1 text-secondary-400 hover:text-secondary-600"
                      disabled={fileObj.status === 'uploading'}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-primary-50 border-primary-200">
        <CardHeader>
          <CardTitle className="text-primary-900">Upload Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-primary-800">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
              <p>
                <strong>PDF Files:</strong> Ensure text is readable and not scanned images for better OCR processing.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
              <p>
                <strong>CSV/Excel Files:</strong> Include headers with claim information like claim number, patient name, amounts, etc.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
              <p>
                <strong>File Size:</strong> Maximum 50MB per file. Larger files may be rejected.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
              <p>
                <strong>Processing Time:</strong> Files are processed automatically. You'll receive notifications when complete.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadPage;