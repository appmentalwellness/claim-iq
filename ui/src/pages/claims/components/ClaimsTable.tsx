import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal, 
  Eye, 
  FileText,
  Clock,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { Claim, ClaimStatus } from '@/types';
import { useSelectionsStore } from '@/stores';
import Button from '@/components/ui/Button';

interface ClaimsTableProps {
  claims: Claim[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface ClaimRowProps {
  claim: Claim;
  isSelected: boolean;
  onSelectionChange: (claimId: string, selected: boolean) => void;
  onViewClaim: (claimId: string) => void;
}

const getStatusColor = (status: ClaimStatus): string => {
  const colors = {
    'UPLOAD_PENDING': 'bg-gray-100 text-gray-800',
    'NEW': 'bg-blue-100 text-blue-800',
    'PROCESSING': 'bg-yellow-100 text-yellow-800',
    'DENIED': 'bg-red-100 text-red-800',
    'MANUAL_REVIEW_REQUIRED': 'bg-orange-100 text-orange-800',
    'COMPLETED': 'bg-green-100 text-green-800',
    'ERROR': 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getStatusIcon = (status: ClaimStatus) => {
  const icons = {
    'UPLOAD_PENDING': Clock,
    'NEW': FileText,
    'PROCESSING': Clock,
    'DENIED': AlertCircle,
    'MANUAL_REVIEW_REQUIRED': AlertCircle,
    'COMPLETED': FileText,
    'ERROR': AlertCircle,
  };
  const Icon = icons[status] || FileText;
  return <Icon className="w-4 h-4" />;
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
    month: 'short',
    day: 'numeric',
  });
};

const ClaimRow: React.FC<ClaimRowProps> = ({ claim, isSelected, onSelectionChange, onViewClaim }) => {
  return (
    <div
      className={`flex items-center px-6 py-4 border-b border-gray-200 hover:bg-gray-50 ${
        isSelected ? 'bg-blue-50' : ''
      }`}
    >
      {/* Selection Checkbox */}
      <div className="flex items-center w-12">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelectionChange(claim.claimId, e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </div>

      {/* Claim Number */}
      <div className="flex-1 min-w-0 px-3">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-gray-900 truncate">
            {claim.claimNumber || claim.claimId.slice(0, 8)}
          </p>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
            {getStatusIcon(claim.status)}
            <span className="ml-1">{claim.status.replace('_', ' ')}</span>
          </span>
        </div>
        <p className="text-sm text-gray-500 truncate">
          {claim.originalFilename}
        </p>
      </div>

      {/* Patient Info */}
      <div className="flex-1 min-w-0 px-3">
        <p className="text-sm text-gray-900">
          {claim.patientId ? `Patient ${claim.patientId.slice(0, 8)}` : '-'}
        </p>
        <p className="text-sm text-gray-500">
          Hospital: {claim.hospitalId.slice(0, 8)}
        </p>
      </div>

      {/* Amounts */}
      <div className="flex-1 min-w-0 px-3">
        <div className="flex items-center space-x-1">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <p className="text-sm font-medium text-gray-900">
            {formatCurrency(claim.claimAmount)}
          </p>
        </div>
        {claim.deniedAmount && (
          <p className="text-sm text-red-600">
            Denied: {formatCurrency(claim.deniedAmount)}
          </p>
        )}
      </div>

      {/* Dates */}
      <div className="flex-1 min-w-0 px-3">
        <p className="text-sm text-gray-900">
          {formatDate(claim.createdAt)}
        </p>
        <p className="text-sm text-gray-500">
          Updated: {formatDate(claim.updatedAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 w-24">
        <Button
          onClick={() => onViewClaim(claim.claimId)}
          variant="outline"
          size="sm"
          className="p-2"
        >
          <Eye className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="p-2"
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const ClaimsTable: React.FC<ClaimsTableProps> = ({
  claims,
  isLoading,
  page,
  totalPages,
  onPageChange,
}) => {
  const navigate = useNavigate();
  const { claimSelections, toggleClaimSelection, selectAllClaims, clearClaimSelections } = useSelectionsStore();
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Claim;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSelectionChange = (claimId: string) => {
    toggleClaimSelection(claimId);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      selectAllClaims(claims.length);
    } else {
      clearClaimSelections();
    }
  };

  const handleViewClaim = (claimId: string) => {
    navigate(`/claims/${claimId}`);
  };

  const sortedClaims = useMemo(() => {
    if (!sortConfig) return claims;

    return [...claims].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [claims, sortConfig]);

  const handleSort = (key: keyof Claim) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const isAllSelected = claims.length > 0 && claimSelections.selectedItems.length === claims.length;
  const isIndeterminate = claimSelections.selectedItems.length > 0 && claimSelections.selectedItems.length < claims.length;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (claims.length === 0) {
    return (
      <div className="p-12 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No claims found</h3>
        <p className="text-gray-600">
          Try adjusting your search criteria or filters to find claims.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center">
          <div className="flex items-center w-12">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(input) => {
                if (input) input.indeterminate = isIndeterminate;
              }}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="flex-1 px-3">
            <button
              onClick={() => handleSort('claimNumber')}
              className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
            >
              Claim Details
            </button>
          </div>
          <div className="flex-1 px-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Patient & Hospital
            </span>
          </div>
          <div className="flex-1 px-3">
            <button
              onClick={() => handleSort('claimAmount')}
              className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
            >
              Amounts
            </button>
          </div>
          <div className="flex-1 px-3">
            <button
              onClick={() => handleSort('createdAt')}
              className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
            >
              Dates
            </button>
          </div>
          <div className="w-24 px-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </span>
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="max-h-96 overflow-y-auto">
        {sortedClaims.map((claim) => (
          <ClaimRow
            key={claim.claimId}
            claim={claim}
            isSelected={claimSelections.selectedItems.includes(claim.claimId)}
            onSelectionChange={handleSelectionChange}
            onViewClaim={handleViewClaim}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                variant="outline"
                size="sm"
                className="p-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                variant="outline"
                size="sm"
                className="p-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimsTable;