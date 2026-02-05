import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Download, RefreshCw, Plus } from 'lucide-react';
import { apiService } from '@/services/api';
import { useFiltersStore, useSelectionsStore, useNotificationsStore } from '@/stores';
import { ClaimFilters } from '@/types';
import ClaimsTable from './components/ClaimsTable';
import ClaimsFilters from './components/ClaimsFilters';
import BulkOperations from './components/BulkOperations';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

const ClaimsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  const { claimFilters, setClaimFilters } = useFiltersStore();
  const { claimSelections, clearClaimSelections } = useSelectionsStore();
  const { addNotification } = useNotificationsStore();

  const filters = claimFilters;

  // Fetch claims data
  const {
    data: claimsData,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['claims', { page, limit, ...filters, searchQuery }],
    queryFn: () => apiService.getClaims({
      page,
      limit,
      status: filters.status && filters.status.length > 0 ? filters.status.join(',') : undefined,
      search: searchQuery || undefined,
    }),
    placeholderData: (previousData) => previousData,
    staleTime: 30000, // 30 seconds
  });

  const claims = claimsData?.data?.claims || [];
  const totalClaims = claimsData?.data?.total || 0;
  const totalPages = Math.ceil(totalClaims / limit);

  // Debug logging
  console.log('Claims data:', { claimsData, claims, totalClaims, isLoading, error });

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page on search
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: ClaimFilters) => {
    setClaimFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  };

  // Handle refresh
  const handleRefresh = () => {
    refetch();
    addNotification({
      type: {
        category: 'system',
        subcategory: 'refresh',
        priority: 1,
        autoExpire: true,
        requiresAcknowledgment: false,
      },
      title: 'Claims Refreshed',
      message: 'Claims data has been refreshed successfully',
      severity: 'success',
      actionRequired: false,
      expiresAt: new Date(Date.now() + 5000), // 5 seconds
    });
  };

  // Clear selections when data changes
  useEffect(() => {
    clearClaimSelections();
  }, [claimsData, clearClaimSelections]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 max-w-md w-full">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Claims
            </h2>
            <p className="text-gray-600 mb-4">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <Button onClick={handleRefresh} variant="primary">
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Claims Management</h1>
            <p className="text-gray-600 mt-1">
              Manage and track all insurance claims
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={isFetching}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button variant="primary" className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>New Claim</span>
            </Button>
          </div>
        </div>
      </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search claims by number, patient name, or payer..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {Object.keys(filters).length > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {Object.keys(filters).length}
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                className="flex items-center space-x-2"
                disabled={claims.length === 0}
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </Button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <ClaimsFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                />
              </div>
            )}
          </div>
        </Card>

        {/* Bulk Operations */}
        {claimSelections.selectedItems.length > 0 && (
          <div className="mb-6">
            <BulkOperations
              selectedCount={claimSelections.selectedItems.length}
              totalCount={totalClaims}
              onClearSelection={clearClaimSelections}
            />
          </div>
        )}

        {/* Claims Table */}
        <Card>
          <ClaimsTable
            claims={claims}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </Card>

      {/* Summary */}
      <div className="mt-6 text-sm text-gray-600 text-center">
        Showing {claims.length} of {totalClaims} claims
        {claimSelections.selectedItems.length > 0 && (
          <span className="ml-2">
            • {claimSelections.selectedItems.length} selected
          </span>
        )}
      </div>
    </div>
  );
};

export default ClaimsPage;