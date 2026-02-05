import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  IndianRupee
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/utils/format';

const DashboardPage: React.FC = () => {
  // Mock data - replace with actual API calls
  const stats = {
    totalClaims: 1247,
    pendingClaims: 89,
    deniedClaims: 156,
    completedClaims: 1002,
    totalDeniedAmount: 2450000,
    averageProcessingTime: 2.4,
    successRate: 87.5,
  };

  const recentClaims = [
    {
      id: '1',
      claimNumber: 'CLM-2024-001',
      patientName: 'Rajesh Kumar',
      hospital: 'Apollo Hospital',
      amount: 125000,
      status: 'PROCESSING',
      createdAt: '2024-02-01T10:30:00Z',
    },
    {
      id: '2',
      claimNumber: 'CLM-2024-002',
      patientName: 'Priya Sharma',
      hospital: 'Fortis Healthcare',
      amount: 89000,
      status: 'DENIED',
      createdAt: '2024-02-01T09:15:00Z',
    },
    {
      id: '3',
      claimNumber: 'CLM-2024-003',
      patientName: 'Amit Patel',
      hospital: 'Max Healthcare',
      amount: 156000,
      status: 'COMPLETED',
      createdAt: '2024-01-31T16:45:00Z',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROCESSING':
        return 'text-warning-600 bg-warning-100';
      case 'DENIED':
        return 'text-error-600 bg-error-100';
      case 'COMPLETED':
        return 'text-success-600 bg-success-100';
      default:
        return 'text-secondary-600 bg-secondary-100';
    }
  };

  const user = {
    name: 'Dr. Sarah Johnson',
    email: 'sarah@hospital.com',
    role: 'hospital_admin',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Dashboard</h1>
          <p className="text-secondary-600 mt-1">
            Welcome back, {user.name}. Here's what's happening with your claims.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link to="/upload">
            <Button className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Upload Claim</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <FileText className="h-4 w-4 text-secondary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClaims.toLocaleString()}</div>
            <p className="text-xs text-secondary-600">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
            <Clock className="h-4 w-4 text-warning-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning-600">{stats.pendingClaims}</div>
            <p className="text-xs text-secondary-600">
              Awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denied Claims</CardTitle>
            <AlertCircle className="h-4 w-4 text-error-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-error-600">{stats.deniedClaims}</div>
            <p className="text-xs text-secondary-600">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-success-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-600">{stats.successRate}%</div>
            <p className="text-xs text-secondary-600">
              +5.2% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <IndianRupee className="h-5 w-5 text-primary-600" />
              <span>Total Denied Amount</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary-600">
              {formatCurrency(stats.totalDeniedAmount)}
            </div>
            <p className="text-sm text-secondary-600 mt-2">
              Amount recovered through AI processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-secondary-600" />
              <span>Avg. Processing Time</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary-900">
              {stats.averageProcessingTime} days
            </div>
            <p className="text-sm text-secondary-600 mt-2">
              From upload to completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success-600" />
              <span>Completed Claims</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success-600">
              {stats.completedClaims.toLocaleString()}
            </div>
            <p className="text-sm text-secondary-600 mt-2">
              Successfully processed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Claims */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Claims</CardTitle>
              <CardDescription>
                Latest claim submissions and their processing status
              </CardDescription>
            </div>
            <Link to="/claims">
              <Button variant="outline" size="sm">
                View All Claims
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentClaims.map((claim) => (
              <div
                key={claim.id}
                className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-secondary-900">{claim.claimNumber}</p>
                    <p className="text-sm text-secondary-600">{claim.patientName} • {claim.hospital}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium text-secondary-900">
                      {formatCurrency(claim.amount)}
                    </p>
                    <p className="text-xs text-secondary-600">
                      {new Date(claim.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}
                  >
                    {claim.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;