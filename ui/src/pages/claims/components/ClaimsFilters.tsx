import React, { useState } from 'react';
import { Calendar, X, DollarSign } from 'lucide-react';
import { ClaimFilters, ClaimStatus } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface ClaimsFiltersProps {
  filters: ClaimFilters;
  onFiltersChange: (filters: ClaimFilters) => void;
}

const statusOptions: { value: ClaimStatus; label: string; color: string }[] = [
  { value: 'NEW', label: 'New', color: 'bg-blue-100 text-blue-800' },
  { value: 'PROCESSING', label: 'Processing', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'DENIED', label: 'Denied', color: 'bg-red-100 text-red-800' },
  { value: 'MANUAL_REVIEW_REQUIRED', label: 'Manual Review', color: 'bg-orange-100 text-orange-800' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'ERROR', label: 'Error', color: 'bg-red-100 text-red-800' },
  { value: 'UPLOAD_PENDING', label: 'Upload Pending', color: 'bg-gray-100 text-gray-800' },
];

const ClaimsFilters: React.FC<ClaimsFiltersProps> = ({ filters, onFiltersChange }) => {
  const [localFilters, setLocalFilters] = useState<ClaimFilters>(filters);

  const handleStatusChange = (status: ClaimStatus, checked: boolean) => {
    const currentStatus = localFilters.status || [];
    const newStatus = checked
      ? [...currentStatus, status]
      : currentStatus.filter(s => s !== status);
    
    setLocalFilters(prev => ({ ...prev, status: newStatus }));
  };

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    const dateRange = localFilters.dateRange || { startDate: null, endDate: null };
    const newDateRange = {
      ...dateRange,
      [field]: value ? new Date(value) : null,
    };
    
    setLocalFilters(prev => ({ ...prev, dateRange: newDateRange }));
  };

  const handleAmountRangeChange = (field: 'min' | 'max', value: string) => {
    const amountRange = localFilters.amountRange || { min: null, max: null };
    const newAmountRange = {
      ...amountRange,
      [field]: value ? parseFloat(value) : null,
    };
    
    setLocalFilters(prev => ({ ...prev, amountRange: newAmountRange }));
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const clearFilters = () => {
    const emptyFilters: ClaimFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters = Object.keys(localFilters).some(key => {
    const value = localFilters[key as keyof ClaimFilters];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== null);
    }
    return value !== undefined && value !== null && value !== '';
  });

  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <Button
            onClick={clearFilters}
            variant="outline"
            size="sm"
            className="flex items-center space-x-1"
          >
            <X className="w-4 h-4" />
            <span>Clear All</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Status
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {statusOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={localFilters.status?.includes(option.value) || false}
                  onChange={(e) => handleStatusChange(option.value, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${option.color}`}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Date Range
          </label>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">From</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="date"
                  value={formatDateForInput(localFilters.dateRange?.startDate || null)}
                  onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="date"
                  value={formatDateForInput(localFilters.dateRange?.endDate || null)}
                  onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Amount Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Claim Amount (₹)
          </label>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Minimum</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="number"
                  placeholder="0"
                  value={localFilters.amountRange?.min || ''}
                  onChange={(e) => handleAmountRangeChange('min', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Maximum</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="number"
                  placeholder="No limit"
                  value={localFilters.amountRange?.max || ''}
                  onChange={(e) => handleAmountRangeChange('max', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply/Reset Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button
          onClick={() => setLocalFilters(filters)}
          variant="outline"
        >
          Reset
        </Button>
        <Button
          onClick={applyFilters}
          variant="primary"
        >
          Apply Filters
        </Button>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Active filters:</span>
            {localFilters.status && localFilters.status.length > 0 && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                Status: {localFilters.status.length}
              </span>
            )}
            {localFilters.dateRange && (localFilters.dateRange.startDate || localFilters.dateRange.endDate) && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                Date Range
              </span>
            )}
            {localFilters.amountRange && (localFilters.amountRange.min || localFilters.amountRange.max) && (
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                Amount Range
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimsFilters;