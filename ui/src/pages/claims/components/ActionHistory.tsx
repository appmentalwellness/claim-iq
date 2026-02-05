import React, { useState } from 'react';
import { 
  Clock, 
  User, 
  FileText, 
  Download, 
  CheckCircle, 
  AlertCircle,
  Activity,
  Filter,
  Search
} from 'lucide-react';
import { Claim } from '@/types';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface ActionHistoryProps {
  claim: Claim;
}

interface ActionHistoryItem {
  id: string;
  timestamp: string;
  action: string;
  actionType: 'system' | 'user' | 'ai' | 'external';
  user: string;
  details: string;
  status: 'success' | 'error' | 'warning' | 'info';
  metadata?: Record<string, any>;
}

const ActionHistory: React.FC<ActionHistoryProps> = ({ claim }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // Mock action history data - in real implementation, this would come from the API
  const mockActionHistory: ActionHistoryItem[] = [
    {
      id: '1',
      timestamp: '2024-01-20T14:30:00Z',
      action: 'Appeal Submitted',
      actionType: 'user',
      user: 'Dr. Sarah Patel',
      details: 'First level appeal submitted to Star Health Insurance with additional clinical documentation',
      status: 'success',
      metadata: {
        appealType: 'First Level',
        documents: ['clinical_notes.pdf', 'lab_results.pdf'],
        submissionMethod: 'Online Portal',
      },
    },
    {
      id: '2',
      timestamp: '2024-01-18T09:15:00Z',
      action: 'AI Analysis Completed',
      actionType: 'ai',
      user: 'ClaimIQ AI System',
      details: 'AI analysis completed with 87% confidence in denial classification and appeal letter generated',
      status: 'success',
      metadata: {
        confidence: 0.87,
        processingTime: 2.3,
        modelVersion: 'v2.1.0',
      },
    },
    {
      id: '3',
      timestamp: '2024-01-17T16:45:00Z',
      action: 'Manual Review Assigned',
      actionType: 'user',
      user: 'Claims Manager',
      details: 'Claim assigned to Dr. Sarah Patel for manual review due to high denial amount',
      status: 'info',
      metadata: {
        assignedTo: 'Dr. Sarah Patel',
        reason: 'High denial amount requires senior review',
        priority: 'High',
      },
    },
    {
      id: '4',
      timestamp: '2024-01-16T11:20:00Z',
      action: 'Denial Received',
      actionType: 'external',
      user: 'Star Health Insurance',
      details: 'Claim denied due to lack of medical necessity. Denial code: DN-001',
      status: 'error',
      metadata: {
        denialCode: 'DN-001',
        denialReason: 'Lack of Medical Necessity',
        deniedAmount: 75000,
        appealDeadline: '2024-02-14',
      },
    },
    {
      id: '5',
      timestamp: '2024-01-15T13:10:00Z',
      action: 'Document Extraction Completed',
      actionType: 'ai',
      user: 'ClaimIQ AI System',
      details: 'OCR and document extraction completed with 91% accuracy. 3 missing documents identified',
      status: 'warning',
      metadata: {
        ocrAccuracy: 0.91,
        extractedFields: 15,
        missingDocuments: 3,
        processingTime: 45.2,
      },
    },
    {
      id: '6',
      timestamp: '2024-01-12T10:30:00Z',
      action: 'Claim Submitted',
      actionType: 'system',
      user: 'Hospital Billing System',
      details: 'Claim submitted to Star Health Insurance via electronic submission',
      status: 'success',
      metadata: {
        submissionMethod: 'Electronic',
        claimAmount: 125000,
        submissionId: 'SUB-2024-001234',
      },
    },
    {
      id: '7',
      timestamp: '2024-01-10T14:00:00Z',
      action: 'File Uploaded',
      actionType: 'user',
      user: 'Billing Staff',
      details: 'Medical records and billing documents uploaded for claim processing',
      status: 'success',
      metadata: {
        fileCount: 5,
        totalSize: '12.5 MB',
        fileTypes: ['PDF', 'JPEG'],
      },
    },
    {
      id: '8',
      timestamp: '2024-01-10T13:45:00Z',
      action: 'Claim Created',
      actionType: 'system',
      user: 'ClaimIQ System',
      details: 'New claim record created in the system',
      status: 'info',
      metadata: {
        claimId: claim.claimId,
        patientId: claim.patientId,
        hospitalId: claim.hospitalId,
      },
    },
  ];

  const actionTypeFilters = [
    { value: 'all', label: 'All Actions' },
    { value: 'user', label: 'User Actions' },
    { value: 'system', label: 'System Actions' },
    { value: 'ai', label: 'AI Actions' },
    { value: 'external', label: 'External Actions' },
  ];

  const getActionIcon = (actionType: string) => {
    const iconClass = "w-5 h-5";
    
    switch (actionType) {
      case 'user':
        return <User className={`${iconClass} text-blue-500`} />;
      case 'system':
        return <Activity className={`${iconClass} text-gray-500`} />;
      case 'ai':
        return <Activity className={`${iconClass} text-purple-500`} />;
      case 'external':
        return <FileText className={`${iconClass} text-orange-500`} />;
      default:
        return <Clock className={`${iconClass} text-gray-500`} />;
    }
  };

  const getStatusIcon = (status: string) => {
    const iconClass = "w-4 h-4";
    
    switch (status) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'error':
        return <AlertCircle className={`${iconClass} text-red-500`} />;
      case 'warning':
        return <AlertCircle className={`${iconClass} text-yellow-500`} />;
      default:
        return <Clock className={`${iconClass} text-blue-500`} />;
    }
  };

  const getStatusColor = (status: string): string => {
    const colors = {
      success: 'bg-green-50 border-green-200',
      error: 'bg-red-50 border-red-200',
      warning: 'bg-yellow-50 border-yellow-200',
      info: 'bg-blue-50 border-blue-200',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-50 border-gray-200';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} months ago`;
  };

  const filteredHistory = mockActionHistory.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || item.actionType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Action History Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Action History</h2>
          <div className="text-sm text-gray-600">
            {filteredHistory.length} of {mockActionHistory.length} actions
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search actions, users, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {actionTypeFilters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {mockActionHistory.filter(a => a.actionType === 'user').length}
            </div>
            <div className="text-sm text-gray-600">User Actions</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {mockActionHistory.filter(a => a.actionType === 'ai').length}
            </div>
            <div className="text-sm text-gray-600">AI Actions</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {mockActionHistory.filter(a => a.actionType === 'system').length}
            </div>
            <div className="text-sm text-gray-600">System Actions</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {mockActionHistory.filter(a => a.actionType === 'external').length}
            </div>
            <div className="text-sm text-gray-600">External Actions</div>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Timeline</h3>
        
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Actions Found</h3>
            <p className="text-gray-600">
              No actions match your current search and filter criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((item, index) => (
              <div key={item.id} className="relative">
                {/* Timeline line */}
                {index < filteredHistory.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
                )}
                
                <div className={`flex items-start space-x-4 p-4 rounded-lg border ${getStatusColor(item.status)}`}>
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center">
                    {getActionIcon(item.actionType)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{item.action}</h4>
                        {getStatusIcon(item.status)}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{getRelativeTime(item.timestamp)}</span>
                        <Button
                          onClick={() => setShowDetails(showDetails === item.id ? null : item.id)}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          {showDetails === item.id ? 'Hide' : 'Details'}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-1">
                      <p className="text-sm text-gray-600">{item.details}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>By: {item.user}</span>
                        <span>•</span>
                        <span>{formatDate(item.timestamp)}</span>
                        <span>•</span>
                        <span className="capitalize">{item.actionType} Action</span>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {showDetails === item.id && item.metadata && (
                      <div className="mt-4 p-3 bg-white rounded border">
                        <h5 className="font-medium text-gray-900 mb-2">Additional Details</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {Object.entries(item.metadata).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-600 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                              </span>
                              <span className="text-gray-900 font-medium">
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Export Options */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Export History</h3>
            <p className="text-sm text-gray-600 mt-1">
              Download the complete action history for this claim
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ActionHistory;