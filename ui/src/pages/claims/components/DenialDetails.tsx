import React from 'react';
import { AlertCircle, Calendar, DollarSign, FileText, Clock, Target, TrendingUp } from 'lucide-react';
import { Claim } from '@/types';
import { Card } from '@/components/ui/Card';

interface DenialDetailsProps {
  claim: Claim;
}

const DenialDetails: React.FC<DenialDetailsProps> = ({ claim }) => {
  // Mock denial data - in real implementation, this would come from the API
  const mockDenialData = {
    reason: 'Lack of Medical Necessity',
    deniedAmount: claim.deniedAmount || 75000,
    denialText: 'The submitted claim has been denied due to insufficient documentation supporting the medical necessity of the procedure. The treatment provided does not meet the criteria established in our medical policy guidelines for coverage under this plan.',
    denialDate: '2024-01-15',
    appealDeadline: '2024-02-14',
    denialCode: 'DN-001',
    reviewerName: 'Dr. Sarah Patel',
    reviewerComments: 'Upon review of the submitted documentation, the medical records do not clearly establish the medical necessity for the procedure performed. Additional clinical documentation would be required to support coverage.',
    denialCategory: 'Medical Necessity',
    priorAuthRequired: true,
    priorAuthObtained: false,
    similarCases: {
      total: 156,
      approved: 89,
      denied: 67,
      successRate: 57.1,
    },
    appealHistory: [
      {
        date: '2024-01-20',
        status: 'First Level Appeal Submitted',
        outcome: 'Pending',
        reviewer: 'Claims Review Team',
      },
    ],
    recommendedActions: [
      'Obtain additional clinical documentation from treating physician',
      'Request peer-to-peer review with medical director',
      'Submit comparative treatment analysis',
      'Provide evidence-based medical literature supporting treatment',
    ],
    timelineToAppeal: 30, // days
    estimatedAppealDuration: 45, // days
  };

  const formatCurrency = (amount: number): string => {
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
    });
  };

  const getDaysUntilDeadline = (deadlineDate: string): number => {
    const deadline = new Date(deadlineDate);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysUntilDeadline = getDaysUntilDeadline(mockDenialData.appealDeadline);
  const isUrgent = daysUntilDeadline <= 7;
  const isOverdue = daysUntilDeadline < 0;

  if (!claim.denialId && claim.status !== 'DENIED') {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Denial Information</h3>
          <p className="text-gray-600">
            This claim has not been denied or denial information is not available.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Denial Summary */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Denial Details</h2>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              <AlertCircle className="w-4 h-4 mr-1" />
              Denied
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Denial Reason</p>
                <p className="font-medium text-gray-900">{mockDenialData.reason}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Denied Amount</p>
                <p className="font-medium text-gray-900">{formatCurrency(mockDenialData.deniedAmount)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Denial Code</p>
                <p className="font-medium text-gray-900">{mockDenialData.denialCode}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-medium text-gray-900">{mockDenialData.denialCategory}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Denial Date</p>
                <p className="font-medium text-gray-900">{formatDate(mockDenialData.denialDate)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Appeal Deadline</p>
                <div className="flex items-center space-x-2">
                  <p className="font-medium text-gray-900">{formatDate(mockDenialData.appealDeadline)}</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    isOverdue 
                      ? 'bg-red-100 text-red-800'
                      : isUrgent 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {isOverdue 
                      ? `${Math.abs(daysUntilDeadline)} days overdue`
                      : `${daysUntilDeadline} days left`
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Reviewer</p>
                <p className="font-medium text-gray-900">{mockDenialData.reviewerName}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Target className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Prior Authorization</p>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    mockDenialData.priorAuthRequired 
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {mockDenialData.priorAuthRequired ? 'Required' : 'Not Required'}
                  </span>
                  {mockDenialData.priorAuthRequired && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      mockDenialData.priorAuthObtained 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {mockDenialData.priorAuthObtained ? 'Obtained' : 'Not Obtained'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Denial Explanation */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Denial Explanation</h3>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-gray-900">{mockDenialData.denialText}</p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Reviewer Comments</h4>
          <p className="text-gray-700">{mockDenialData.reviewerComments}</p>
        </div>
      </Card>

      {/* Similar Cases Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Similar Cases Analysis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{mockDenialData.similarCases.total}</div>
            <div className="text-sm text-gray-600">Total Cases</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{mockDenialData.similarCases.approved}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{mockDenialData.similarCases.denied}</div>
            <div className="text-sm text-gray-600">Denied</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">{mockDenialData.similarCases.successRate}%</div>
            </div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 bg-green-500 rounded-full"
              style={{ width: `${mockDenialData.similarCases.successRate}%` }}
            ></div>
          </div>
        </div>
      </Card>

      {/* Appeal History */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Appeal History</h3>
        
        <div className="space-y-4">
          {mockDenialData.appealHistory.map((appeal, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{appeal.status}</h4>
                  <span className="text-sm text-gray-500">{formatDate(appeal.date)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Reviewer: {appeal.reviewer}</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                  appeal.outcome === 'Approved' 
                    ? 'bg-green-100 text-green-800'
                    : appeal.outcome === 'Denied'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {appeal.outcome}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recommended Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Actions</h3>
        
        <div className="space-y-3">
          {mockDenialData.recommendedActions.map((action, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                </div>
              </div>
              <p className="text-gray-900">{action}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Appeal Timeline */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Appeal Timeline</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Time to Submit Appeal</p>
              <p className="font-medium text-gray-900">{mockDenialData.timelineToAppeal} days from denial</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Estimated Appeal Duration</p>
              <p className="font-medium text-gray-900">{mockDenialData.estimatedAppealDuration} days</p>
            </div>
          </div>
        </div>

        {(isUrgent || isOverdue) && (
          <div className={`mt-4 p-4 rounded-lg border ${
            isOverdue 
              ? 'bg-red-50 border-red-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start space-x-2">
              <AlertCircle className={`w-4 h-4 mt-0.5 ${
                isOverdue ? 'text-red-600' : 'text-yellow-600'
              }`} />
              <div>
                <p className={`text-sm font-medium ${
                  isOverdue ? 'text-red-800' : 'text-yellow-800'
                }`}>
                  {isOverdue ? 'Appeal Deadline Passed' : 'Urgent: Appeal Deadline Approaching'}
                </p>
                <p className={`text-sm mt-1 ${
                  isOverdue ? 'text-red-700' : 'text-yellow-700'
                }`}>
                  {isOverdue 
                    ? 'The appeal deadline has passed. Contact the payer immediately to discuss options.'
                    : 'The appeal deadline is approaching soon. Please submit the appeal as soon as possible.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DenialDetails;