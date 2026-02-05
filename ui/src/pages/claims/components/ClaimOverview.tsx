import React from 'react';
import { 
  FileText, 
  User, 
  Building, 
  CreditCard, 
  Calendar, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Claim } from '@/types';
import { Card } from '@/components/ui/Card';

interface ClaimOverviewProps {
  claim: Claim;
}

const ClaimOverview: React.FC<ClaimOverviewProps> = ({ claim }) => {
  const formatCurrency = (amount: number | undefined): string => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'ERROR':
      case 'DENIED':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'PROCESSING':
      case 'MANUAL_REVIEW_REQUIRED':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <FileText className="w-5 h-5 text-blue-500" />;
    }
  };

  const getProgressPercentage = (status: string): number => {
    const statusProgress = {
      'UPLOAD_PENDING': 10,
      'NEW': 20,
      'PROCESSING': 50,
      'MANUAL_REVIEW_REQUIRED': 70,
      'DENIED': 80,
      'COMPLETED': 100,
      'ERROR': 0,
    };
    return statusProgress[status as keyof typeof statusProgress] || 0;
  };

  const progressPercentage = getProgressPercentage(claim.status);

  return (
    <div className="space-y-6">
      {/* Claim Summary */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Claim Summary</h2>
          <div className="flex items-center space-x-2">
            {getStatusIcon(claim.status)}
            <span className="text-sm font-medium text-gray-700">
              {claim.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Claim ID</p>
                <p className="font-medium text-gray-900">{claim.claimId}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Claim Number</p>
                <p className="font-medium text-gray-900">
                  {claim.claimNumber || 'Not assigned'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Patient ID</p>
                <p className="font-medium text-gray-900">
                  {claim.patientId || 'Not assigned'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Building className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Hospital ID</p>
                <p className="font-medium text-gray-900">{claim.hospitalId}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Claim Amount</p>
                <p className="font-medium text-gray-900">
                  {formatCurrency(claim.claimAmount)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Denied Amount</p>
                <p className="font-medium text-gray-900">
                  {formatCurrency(claim.deniedAmount)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-medium text-gray-900">
                  {formatDate(claim.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="font-medium text-gray-900">
                  {formatDate(claim.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Processing Progress */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Progress</h3>
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Current Status: {claim.status.replace('_', ' ')}
            </span>
            <span className="text-sm text-gray-500">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                claim.status === 'ERROR' 
                  ? 'bg-red-500' 
                  : claim.status === 'COMPLETED'
                  ? 'bg-green-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-3 rounded-lg border ${
            ['UPLOAD_PENDING', 'NEW', 'PROCESSING', 'MANUAL_REVIEW_REQUIRED', 'DENIED', 'COMPLETED'].includes(claim.status)
              ? 'bg-green-50 border-green-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center space-x-2">
              <CheckCircle className={`w-4 h-4 ${
                ['UPLOAD_PENDING', 'NEW', 'PROCESSING', 'MANUAL_REVIEW_REQUIRED', 'DENIED', 'COMPLETED'].includes(claim.status)
                  ? 'text-green-500'
                  : 'text-gray-400'
              }`} />
              <span className="text-sm font-medium">Uploaded</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">File uploaded successfully</p>
          </div>

          <div className={`p-3 rounded-lg border ${
            ['PROCESSING', 'MANUAL_REVIEW_REQUIRED', 'DENIED', 'COMPLETED'].includes(claim.status)
              ? 'bg-green-50 border-green-200'
              : claim.status === 'ERROR'
              ? 'bg-red-50 border-red-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center space-x-2">
              {claim.status === 'ERROR' ? (
                <AlertCircle className="w-4 h-4 text-red-500" />
              ) : ['PROCESSING', 'MANUAL_REVIEW_REQUIRED', 'DENIED', 'COMPLETED'].includes(claim.status) ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm font-medium">Processing</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {claim.status === 'ERROR' ? 'Processing failed' : 'AI analysis in progress'}
            </p>
          </div>

          <div className={`p-3 rounded-lg border ${
            claim.status === 'COMPLETED'
              ? 'bg-green-50 border-green-200'
              : ['DENIED', 'MANUAL_REVIEW_REQUIRED'].includes(claim.status)
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center space-x-2">
              {claim.status === 'COMPLETED' ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : ['DENIED', 'MANUAL_REVIEW_REQUIRED'].includes(claim.status) ? (
                <Clock className="w-4 h-4 text-yellow-500" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm font-medium">Review</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {claim.status === 'COMPLETED' 
                ? 'Review completed' 
                : claim.status === 'MANUAL_REVIEW_REQUIRED'
                ? 'Awaiting manual review'
                : claim.status === 'DENIED'
                ? 'Claim denied'
                : 'Pending review'}
            </p>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {claim.errorMessage && (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Processing Error</h3>
              <p className="text-sm text-red-700 mt-1">{claim.errorMessage}</p>
            </div>
          </div>
        </Card>
      )}

      {/* File Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">File Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Original Filename</p>
              <p className="font-medium text-gray-900">{claim.originalFilename}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Content Type</p>
              <p className="font-medium text-gray-900">{claim.contentType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">File Size</p>
              <p className="font-medium text-gray-900">
                {(claim.fileSize / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">S3 Bucket</p>
              <p className="font-medium text-gray-900 font-mono text-sm">{claim.s3Bucket}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">S3 Key</p>
              <p className="font-medium text-gray-900 font-mono text-sm break-all">{claim.s3Key}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">File Hash</p>
              <p className="font-medium text-gray-900 font-mono text-sm break-all">{claim.fileHash}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ClaimOverview;