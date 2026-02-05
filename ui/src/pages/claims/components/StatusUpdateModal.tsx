import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { ClaimStatus } from '@/types';
import Button from '@/components/ui/Button';
import { apiService } from '@/services/api';
import { useNotificationsStore } from '@/stores';

interface StatusUpdateModalProps {
  claimId: string;
  currentStatus: ClaimStatus;
  isOpen: boolean;
  onClose: () => void;
}

const statusOptions: { value: ClaimStatus; label: string; description: string }[] = [
  { 
    value: 'NEW', 
    label: 'New', 
    description: 'Claim is newly created and ready for processing' 
  },
  { 
    value: 'PROCESSING', 
    label: 'Processing', 
    description: 'Claim is currently being processed by AI systems' 
  },
  { 
    value: 'MANUAL_REVIEW_REQUIRED', 
    label: 'Manual Review Required', 
    description: 'Claim requires human review before proceeding' 
  },
  { 
    value: 'DENIED', 
    label: 'Denied', 
    description: 'Claim has been denied by the payer' 
  },
  { 
    value: 'COMPLETED', 
    label: 'Completed', 
    description: 'Claim processing has been completed successfully' 
  },
  { 
    value: 'ERROR', 
    label: 'Error', 
    description: 'An error occurred during claim processing' 
  },
];

const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  claimId,
  currentStatus,
  isOpen,
  onClose,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<ClaimStatus>(currentStatus);
  const [reason, setReason] = useState('');

  const { addNotification } = useNotificationsStore();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: ({ status }: { status: string; reason?: string }) =>
      apiService.updateClaimStatus(claimId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim', claimId] });
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      
      addNotification({
        
        type: {
          category: 'claim',
          subcategory: 'status_update',
          priority: 2,
          autoExpire: true,
          requiresAcknowledgment: false,
        },
        title: 'Status Updated',
        message: `Claim status updated to ${selectedStatus.replace('_', ' ')}`,
        severity: 'success',
        
        
        actionRequired: false,
        expiresAt: new Date(Date.now() + 5000),
      });
      
      onClose();
    },
    onError: () => {
      addNotification({
        
        type: {
          category: 'claim',
          subcategory: 'status_update_error',
          priority: 3,
          autoExpire: false,
          requiresAcknowledgment: true,
        },
        title: 'Update Failed',
        message: 'Failed to update claim status. Please try again.',
        severity: 'error',
        
        
        actionRequired: true,
      });
    },
  });

  const handleSubmit = () => {
    if (selectedStatus === currentStatus) {
      onClose();
      return;
    }

    updateStatusMutation.mutate({
      status: selectedStatus,
      reason: reason.trim() || undefined,
    });
  };

  const getStatusColor = (status: ClaimStatus): string => {
    const colors = {
      'UPLOAD_PENDING': 'border-gray-300 bg-gray-50',
      'NEW': 'border-blue-300 bg-blue-50',
      'PROCESSING': 'border-yellow-300 bg-yellow-50',
      'DENIED': 'border-red-300 bg-red-50',
      'MANUAL_REVIEW_REQUIRED': 'border-orange-300 bg-orange-50',
      'COMPLETED': 'border-green-300 bg-green-50',
      'ERROR': 'border-red-300 bg-red-50',
    };
    return colors[status] || 'border-gray-300 bg-gray-50';
  };

  const isStatusChangeValid = (from: ClaimStatus, to: ClaimStatus): boolean => {
    // Define valid status transitions
    const validTransitions: Record<ClaimStatus, ClaimStatus[]> = {
      'UPLOAD_PENDING': ['NEW', 'ERROR'],
      'NEW': ['PROCESSING', 'MANUAL_REVIEW_REQUIRED', 'ERROR'],
      'PROCESSING': ['DENIED', 'COMPLETED', 'MANUAL_REVIEW_REQUIRED', 'ERROR'],
      'MANUAL_REVIEW_REQUIRED': ['PROCESSING', 'DENIED', 'COMPLETED', 'ERROR'],
      'DENIED': ['PROCESSING', 'COMPLETED'], // Can reprocess or mark as completed after appeal
      'COMPLETED': [], // Terminal state
      'ERROR': ['NEW', 'PROCESSING'], // Can retry from error
    };

    return validTransitions[from]?.includes(to) || from === to;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Update Claim Status</h3>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="p-1"
            disabled={updateStatusMutation.isPending}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-sm text-gray-600">Current Status:</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              {currentStatus.replace('_', ' ')}
            </span>
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-3">
            New Status
          </label>
          
          <div className="space-y-2">
            {statusOptions.map((option) => {
              const isValid = isStatusChangeValid(currentStatus, option.value);
              const isSelected = selectedStatus === option.value;
              
              return (
                <label
                  key={option.value}
                  className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? `${getStatusColor(option.value)} border-2`
                      : isValid
                      ? 'border-gray-200 hover:bg-gray-50'
                      : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={isSelected}
                    onChange={(e) => setSelectedStatus(e.target.value as ClaimStatus)}
                    disabled={!isValid}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{option.label}</span>
                      {!isValid && (
                        <AlertCircle className="w-4 h-4 text-gray-400" />
                      )}
                      {isSelected && (
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {selectedStatus !== currentStatus && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Status Change (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a reason for this status change..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        <div className="flex items-center justify-end space-x-3">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={updateStatusMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="primary"
            disabled={updateStatusMutation.isPending || selectedStatus === currentStatus}
          >
            {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StatusUpdateModal;