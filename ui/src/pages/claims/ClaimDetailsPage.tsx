import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Edit, 
  Download, 
  Share, 
  MoreHorizontal,
  FileText,
  User,
  Building,
  AlertCircle,
  Clock,
  DollarSign,
  Calendar,
  Activity
} from 'lucide-react';
import { apiService } from '@/services/api';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import ClaimOverview from './components/ClaimOverview';
import PatientInformation from './components/PatientInformation';
import PayerInformation from './components/PayerInformation';
import DenialDetails from './components/DenialDetails';
import AIAnalysisResults from './components/AIAnalysisResults';
import ActionHistory from './components/ActionHistory';
import StatusUpdateModal from './components/StatusUpdateModal';

const ClaimDetailsPage: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showStatusModal, setShowStatusModal] = useState(false);

  const {
    data: claimData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => apiService.getClaim(claimId!),
    enabled: !!claimId,
  });

  const claim = claimData?.data;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'patient', label: 'Patient Info', icon: User },
    { id: 'payer', label: 'Payer Info', icon: Building },
    { id: 'denial', label: 'Denial Details', icon: AlertCircle },
    { id: 'ai-analysis', label: 'AI Analysis', icon: Activity },
    { id: 'history', label: 'Action History', icon: Clock },
  ];

  const handleBack = () => {
    navigate('/claims');
  };

  const handleEdit = () => {
    setShowStatusModal(true);
  };

  const handleDownload = () => {
    // Download claim documents - will be implemented in subtask 6.4
    console.log('Download claim documents:', claimId);
  };

  const handleShare = () => {
    // Share claim - will be implemented in subtask 6.4
    console.log('Share claim:', claimId);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 max-w-md w-full">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Claim Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              The claim you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={handleBack} variant="primary">
              Back to Claims
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string): string => {
    const colors = {
      'UPLOAD_PENDING': 'bg-gray-100 text-gray-800',
      'NEW': 'bg-blue-100 text-blue-800',
      'PROCESSING': 'bg-yellow-100 text-yellow-800',
      'DENIED': 'bg-red-100 text-red-800',
      'MANUAL_REVIEW_REQUIRED': 'bg-orange-100 text-orange-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'ERROR': 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleBack}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Claims</span>
            </Button>
            
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  Claim {claim.claimNumber || claim.claimId.slice(0, 8)}
                </h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(claim.status)}`}>
                  {claim.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-gray-600 mt-1">
                Created {formatDate(claim.createdAt)} • Last updated {formatDate(claim.updatedAt)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Share className="w-4 h-4" />
              <span>Share</span>
            </Button>
            <Button
              onClick={handleEdit}
              variant="primary"
              className="flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Update Status</span>
            </Button>
            <Button
              variant="outline"
              className="p-2"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Claim Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(claim.claimAmount)}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Denied Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(claim.deniedAmount)}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">File Size</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(claim.fileSize / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Days Since Created</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.floor((Date.now() - new Date(claim.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {activeTab === 'overview' && <ClaimOverview claim={claim} />}
            {activeTab === 'patient' && <PatientInformation claim={claim} />}
            {activeTab === 'payer' && <PayerInformation claim={claim} />}
            {activeTab === 'denial' && <DenialDetails claim={claim} />}
            {activeTab === 'ai-analysis' && <AIAnalysisResults claim={claim} />}
            {activeTab === 'history' && <ActionHistory claim={claim} />}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* File Information */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">File Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Original Filename</p>
                  <p className="text-sm font-medium text-gray-900">{claim.originalFilename}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Content Type</p>
                  <p className="text-sm font-medium text-gray-900">{claim.contentType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">File Hash</p>
                  <p className="text-sm font-mono text-gray-900 break-all">{claim.fileHash.slice(0, 16)}...</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">S3 Location</p>
                  <p className="text-sm font-mono text-gray-900 break-all">{claim.s3Key}</p>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  View Document
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Claim
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Download Files
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="w-4 h-4 mr-2" />
                  View AI Analysis
                </Button>
              </div>
            </Card>
        </div>
      </div>

      {/* Status Update Modal */}
      {claim && (
        <StatusUpdateModal
          claimId={claim.claimId}
          currentStatus={claim.status}
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
        />
      )}
    </div>
  );
};

export default ClaimDetailsPage;