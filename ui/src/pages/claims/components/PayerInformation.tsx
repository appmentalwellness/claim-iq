import React from 'react';
import { Building, Phone, Mail, MapPin, FileText, AlertCircle, Calendar } from 'lucide-react';
import { Claim } from '@/types';
import { Card } from '@/components/ui/Card';

interface PayerInformationProps {
  claim: Claim;
}

const PayerInformation: React.FC<PayerInformationProps> = ({ claim }) => {
  // Mock payer data - in real implementation, this would come from the API
  const mockPayerData = {
    name: 'Star Health Insurance',
    payerType: 'INSURANCE' as const,
    contactInfo: {
      phone: '+91 80 4567 8900',
      email: 'claims@starhealth.in',
      address: '1st Floor, Prestige Meridian, MG Road, Bangalore, Karnataka 560001',
      website: 'https://www.starhealth.in',
    },
    policyDetails: {
      policyNumber: 'SH-2024-789456123',
      policyHolderName: 'Rajesh Kumar',
      policyType: 'Individual Health Insurance',
      coverageAmount: 500000,
      deductible: 25000,
      copayPercentage: 10,
      validFrom: '2024-01-01',
      validTo: '2024-12-31',
    },
    claimLimits: {
      annualLimit: 500000,
      perClaimLimit: 100000,
      usedAmount: 75000,
      remainingAmount: 425000,
    },
    preAuthRequirements: [
      'Hospitalization above ₹25,000',
      'Surgical procedures',
      'Diagnostic procedures above ₹10,000',
      'Emergency treatments above ₹15,000',
    ],
    excludedServices: [
      'Cosmetic surgery',
      'Dental treatments (except accident-related)',
      'Alternative medicine',
      'Experimental treatments',
    ],
    claimSubmissionGuidelines: {
      timeLimit: '30 days from discharge',
      requiredDocuments: [
        'Original bills and receipts',
        'Discharge summary',
        'Investigation reports',
        'Pre-authorization letter (if applicable)',
      ],
      submissionMethod: 'Online portal or physical submission',
    },
    reimbursementTimeline: '15-21 business days',
    customerServiceHours: 'Monday to Saturday: 9:00 AM - 7:00 PM',
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

  const getPayerTypeColor = (type: string): string => {
    const colors = {
      'INSURANCE': 'bg-blue-100 text-blue-800',
      'TPA': 'bg-green-100 text-green-800',
      'GOVERNMENT': 'bg-purple-100 text-purple-800',
      'OTHER': 'bg-gray-100 text-gray-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (!claim.payerId) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Payer Information</h3>
          <p className="text-gray-600">
            Payer information has not been linked to this claim yet.
          </p>
        </div>
      </Card>
    );
  }

  const usagePercentage = (mockPayerData.claimLimits.usedAmount / mockPayerData.claimLimits.annualLimit) * 100;

  return (
    <div className="space-y-6">
      {/* Basic Payer Information */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Payer Information</h2>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPayerTypeColor(mockPayerData.payerType)}`}>
              {mockPayerData.payerType}
            </span>
            <span className="text-sm text-gray-500">ID: {claim.payerId}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Building className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Payer Name</p>
                <p className="font-medium text-gray-900">{mockPayerData.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Phone Number</p>
                <p className="font-medium text-gray-900">{mockPayerData.contactInfo.phone}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email Address</p>
                <p className="font-medium text-gray-900">{mockPayerData.contactInfo.email}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium text-gray-900">{mockPayerData.contactInfo.address}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Website</p>
                <a 
                  href={mockPayerData.contactInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:text-blue-800"
                >
                  {mockPayerData.contactInfo.website}
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Customer Service Hours</p>
                <p className="font-medium text-gray-900">{mockPayerData.customerServiceHours}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Policy Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Policy Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Policy Number</p>
              <p className="font-medium text-gray-900">{mockPayerData.policyDetails.policyNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Policy Holder</p>
              <p className="font-medium text-gray-900">{mockPayerData.policyDetails.policyHolderName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Policy Type</p>
              <p className="font-medium text-gray-900">{mockPayerData.policyDetails.policyType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Coverage Amount</p>
              <p className="font-medium text-gray-900">{formatCurrency(mockPayerData.policyDetails.coverageAmount)}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Deductible</p>
              <p className="font-medium text-gray-900">{formatCurrency(mockPayerData.policyDetails.deductible)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Co-pay Percentage</p>
              <p className="font-medium text-gray-900">{mockPayerData.policyDetails.copayPercentage}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Valid From</p>
              <p className="font-medium text-gray-900">{formatDate(mockPayerData.policyDetails.validFrom)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Valid To</p>
              <p className="font-medium text-gray-900">{formatDate(mockPayerData.policyDetails.validTo)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Claim Limits & Usage */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Claim Limits & Usage</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Annual Limit</p>
              <p className="font-medium text-gray-900">{formatCurrency(mockPayerData.claimLimits.annualLimit)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Per Claim Limit</p>
              <p className="font-medium text-gray-900">{formatCurrency(mockPayerData.claimLimits.perClaimLimit)}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Used Amount</p>
              <p className="font-medium text-gray-900">{formatCurrency(mockPayerData.claimLimits.usedAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Remaining Amount</p>
              <p className="font-medium text-gray-900">{formatCurrency(mockPayerData.claimLimits.remainingAmount)}</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Annual Limit Usage</span>
            <span className="text-sm text-gray-500">{usagePercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                usagePercentage > 80 ? 'bg-red-500' : usagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${usagePercentage}%` }}
            ></div>
          </div>
        </div>
      </Card>

      {/* Pre-Authorization Requirements */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pre-Authorization Requirements</h3>
        
        <div className="space-y-2">
          {mockPayerData.preAuthRequirements.map((requirement, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-gray-900">{requirement}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Excluded Services */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Excluded Services</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {mockPayerData.excludedServices.map((service, index) => (
            <div key={index} className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-gray-900">{service}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Claim Submission Guidelines */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Claim Submission Guidelines</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Required Documents</h4>
            <div className="space-y-2">
              {mockPayerData.claimSubmissionGuidelines.requiredDocuments.map((doc, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-900">{doc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Submission Time Limit</p>
              <p className="font-medium text-gray-900">{mockPayerData.claimSubmissionGuidelines.timeLimit}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Submission Method</p>
              <p className="font-medium text-gray-900">{mockPayerData.claimSubmissionGuidelines.submissionMethod}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Reimbursement Timeline</p>
              <p className="font-medium text-gray-900">{mockPayerData.reimbursementTimeline}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PayerInformation;