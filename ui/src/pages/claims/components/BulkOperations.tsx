import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  X, 
  Download, 
  UserPlus, 
  Trash2, 
  CheckCircle, 
  AlertTriangle,
  Edit
} from 'lucide-react';
import { ClaimStatus } from '@/types';
import Button from '@/components/ui/Button';
import { useSelectionsStore, useNotificationsStore } from '@/stores';
import { apiService } from '@/services/api';

interface BulkOperationsProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
}

interface BulkAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'primary' | 'secondary' | 'danger';
  requiresConfirmation: boolean;
  description: string;
}

const bulkActions: BulkAction[] = [
  {
    id: 'update_status',
    label: 'Update Status',
    icon: Edit,
    variant: 'primary',
    requiresConfirmation: true,
    description: 'Change the status of selected claims',
  },
  {
    id: 'assign_reviewer',
    label: 'Assign Reviewer',
    icon: UserPlus,
    variant: 'secondary',
    requiresConfirmation: false,
    description: 'Assign selected claims to a reviewer',
  },
  {
    id: 'export',
    label: 'Export',
    icon: Download,
    variant: 'secondary',
    requiresConfirmation: false,
    description: 'Export selected claims to Excel or CSV',
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: Trash2,
    variant: 'danger',
    requiresConfirmation: true,
    description: 'Permanently delete selected claims',
  },
];

const statusOptions: { value: ClaimStatus; label: string }[] = [
  { value: 'NEW', label: 'New' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'MANUAL_REVIEW_REQUIRED', label: 'Manual Review Required' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ERROR', label: 'Error' },
];

const BulkOperations: React.FC<BulkOperationsProps> = ({
  selectedCount,
  totalCount,
  onClearSelection,
}) => {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ClaimStatus>('NEW');
  const [selectedReviewer, setSelectedReviewer] = useState('');
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel');

  const { claimSelections } = useSelectionsStore();
  const { addNotification } = useNotificationsStore();
  const queryClient = useQueryClient();

  // Mutations for bulk operations
  const updateStatusMutation = useMutation({
    mutationFn: ({ claimIds, status }: { claimIds: string[]; status: string }) =>
      apiService.bulkUpdateClaimStatus(claimIds, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      addNotification({
        type: {
          category: 'claim',
          subcategory: 'bulk_update',
          priority: 2,
          autoExpire: true,
          requiresAcknowledgment: false,
        },
        title: 'Status Updated',
        message: `Successfully updated status for ${selectedCount} claims`,
        severity: 'success',
        actionRequired: false,
        expiresAt: new Date(Date.now() + 5000),
      });
      setShowStatusModal(false);
      onClearSelection();
    },
    onError: () => {
      addNotification({
        
        type: {
          category: 'claim',
          subcategory: 'bulk_update_error',
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

  const assignReviewerMutation = useMutation({
    mutationFn: ({ claimIds, reviewerId }: { claimIds: string[]; reviewerId: string }) =>
      apiService.assignClaimsToReviewer(claimIds, reviewerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      addNotification({
        
        type: {
          category: 'claim',
          subcategory: 'bulk_assign',
          priority: 2,
          autoExpire: true,
          requiresAcknowledgment: false,
        },
        title: 'Reviewer Assigned',
        message: `Successfully assigned reviewer to ${selectedCount} claims`,
        severity: 'success',
        
        
        actionRequired: false,
        expiresAt: new Date(Date.now() + 5000),
      });
      setShowAssignModal(false);
      onClearSelection();
    },
    onError: () => {
      addNotification({
        
        type: {
          category: 'claim',
          subcategory: 'bulk_assign_error',
          priority: 3,
          autoExpire: false,
          requiresAcknowledgment: true,
        },
        title: 'Assignment Failed',
        message: 'Failed to assign reviewer. Please try again.',
        severity: 'error',
        
        
        actionRequired: true,
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: ({ claimIds, format }: { claimIds: string[]; format: 'excel' | 'csv' }) =>
      apiService.exportClaims(claimIds, format),
    onSuccess: (data) => {
      // Trigger download
      if (data.data?.downloadUrl) {
        const link = document.createElement('a');
        link.href = data.data.downloadUrl;
        link.download = `claims_export_${Date.now()}.${exportFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      addNotification({
        
        type: {
          category: 'claim',
          subcategory: 'export',
          priority: 2,
          autoExpire: true,
          requiresAcknowledgment: false,
        },
        title: 'Export Completed',
        message: `Successfully exported ${selectedCount} claims`,
        severity: 'success',
        
        
        actionRequired: false,
        expiresAt: new Date(Date.now() + 5000),
      });
      setShowExportModal(false);
    },
    onError: () => {
      addNotification({
        
        type: {
          category: 'claim',
          subcategory: 'export_error',
          priority: 3,
          autoExpire: false,
          requiresAcknowledgment: true,
        },
        title: 'Export Failed',
        message: 'Failed to export claims. Please try again.',
        severity: 'error',
        
        
        actionRequired: true,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (claimIds: string[]) => apiService.deleteClaims(claimIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      addNotification({
        
        type: {
          category: 'claim',
          subcategory: 'bulk_delete',
          priority: 3,
          autoExpire: true,
          requiresAcknowledgment: false,
        },
        title: 'Claims Deleted',
        message: `Successfully deleted ${selectedCount} claims`,
        severity: 'success',
        
        
        actionRequired: false,
        expiresAt: new Date(Date.now() + 5000),
      });
      setShowDeleteModal(false);
      onClearSelection();
    },
    onError: () => {
      addNotification({
        
        type: {
          category: 'claim',
          subcategory: 'bulk_delete_error',
          priority: 3,
          autoExpire: false,
          requiresAcknowledgment: true,
        },
        title: 'Delete Failed',
        message: 'Failed to delete claims. Please try again.',
        severity: 'error',
        
        
        actionRequired: true,
      });
    },
  });

  const handleBulkAction = (actionId: string) => {
    switch (actionId) {
      case 'update_status':
        setShowStatusModal(true);
        break;
      case 'assign_reviewer':
        setShowAssignModal(true);
        break;
      case 'export':
        setShowExportModal(true);
        break;
      case 'delete':
        setShowDeleteModal(true);
        break;
    }
  };

  const executeStatusUpdate = () => {
    updateStatusMutation.mutate({
      claimIds: claimSelections.selectedItems,
      status: selectedStatus,
    });
  };

  const executeAssignReviewer = () => {
    if (!selectedReviewer) {
      addNotification({
        
        type: {
          category: 'claim',
          subcategory: 'validation_error',
          priority: 2,
          autoExpire: true,
          requiresAcknowledgment: false,
        },
        title: 'Validation Error',
        message: 'Please select a reviewer before assigning claims.',
        severity: 'warning',
        
        
        actionRequired: false,
        expiresAt: new Date(Date.now() + 5000),
      });
      return;
    }

    assignReviewerMutation.mutate({
      claimIds: claimSelections.selectedItems,
      reviewerId: selectedReviewer,
    });
  };

  const executeExport = () => {
    exportMutation.mutate({
      claimIds: claimSelections.selectedItems,
      format: exportFormat,
    });
  };

  const executeDelete = () => {
    deleteMutation.mutate(claimSelections.selectedItems);
  };

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {selectedCount} of {totalCount} claims selected
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {bulkActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  onClick={() => handleBulkAction(action.id)}
                  variant={action.variant === 'danger' ? 'outline' : action.variant}
                  size="sm"
                  className={`flex items-center space-x-1 ${
                    action.variant === 'danger' ? 'text-red-600 border-red-300 hover:bg-red-50' : ''
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{action.label}</span>
                </Button>
              );
            })}
            
            <Button
              onClick={onClearSelection}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1"
            >
              <X className="w-4 h-4" />
              <span>Clear</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Update Status</h3>
              <Button
                onClick={() => setShowStatusModal(false)}
                variant="outline"
                size="sm"
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Update the status for {selectedCount} selected claims.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as ClaimStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <Button
                onClick={() => setShowStatusModal(false)}
                variant="outline"
                disabled={updateStatusMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={executeStatusUpdate}
                variant="primary"
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Reviewer Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Assign Reviewer</h3>
              <Button
                onClick={() => setShowAssignModal(false)}
                variant="outline"
                size="sm"
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Assign a reviewer to {selectedCount} selected claims.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Reviewer
              </label>
              <select
                value={selectedReviewer}
                onChange={(e) => setSelectedReviewer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a reviewer...</option>
                <option value="dr-sarah-patel">Dr. Sarah Patel</option>
                <option value="dr-amit-sharma">Dr. Amit Sharma</option>
                <option value="dr-priya-kumar">Dr. Priya Kumar</option>
                <option value="dr-rajesh-singh">Dr. Rajesh Singh</option>
                <option value="claims-manager">Claims Manager</option>
              </select>
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <Button
                onClick={() => setShowAssignModal(false)}
                variant="outline"
                disabled={assignReviewerMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={executeAssignReviewer}
                variant="primary"
                disabled={assignReviewerMutation.isPending || !selectedReviewer}
              >
                {assignReviewerMutation.isPending ? 'Assigning...' : 'Assign Reviewer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Export Claims</h3>
              <Button
                onClick={() => setShowExportModal(false)}
                variant="outline"
                size="sm"
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Export {selectedCount} selected claims to a file.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="excel"
                    checked={exportFormat === 'excel'}
                    onChange={(e) => setExportFormat(e.target.value as 'excel' | 'csv')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Excel (.xlsx)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={(e) => setExportFormat(e.target.value as 'excel' | 'csv')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">CSV (.csv)</span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <Button
                onClick={() => setShowExportModal(false)}
                variant="outline"
                disabled={exportMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={executeExport}
                variant="primary"
                disabled={exportMutation.isPending}
              >
                {exportMutation.isPending ? 'Exporting...' : 'Export'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-medium text-gray-900">Delete Claims</h3>
              </div>
              <Button
                onClick={() => setShowDeleteModal(false)}
                variant="outline"
                size="sm"
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete {selectedCount} selected claims? This action cannot be undone.
            </p>
            
            <div className="flex items-center justify-end space-x-3">
              <Button
                onClick={() => setShowDeleteModal(false)}
                variant="outline"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={executeDelete}
                variant="primary"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Claims'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkOperations;