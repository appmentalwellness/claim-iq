import React, { useState } from 'react';
import { 
  Activity, 
  Brain, 
  FileText, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare
} from 'lucide-react';
import { Claim } from '@/types';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface AIAnalysisResultsProps {
  claim: Claim;
}

const AIAnalysisResults: React.FC<AIAnalysisResultsProps> = ({ claim }) => {
  const [activeAnalysis, setActiveAnalysis] = useState('classification');

  // Mock AI analysis data - in real implementation, this would come from the API
  const mockAIAnalysis = {
    classification: {
      primaryReason: 'Lack of Medical Necessity',
      confidence: 0.87,
      reasoning: 'The AI model identified patterns consistent with medical necessity denials based on documentation gaps and treatment protocol deviations.',
      secondaryReasons: [
        { reason: 'Insufficient Documentation', confidence: 0.72 },
        { reason: 'Prior Authorization Missing', confidence: 0.65 },
      ],
      suggestedActions: [
        'Request additional clinical documentation',
        'Obtain peer-to-peer review',
        'Submit comparative treatment analysis',
      ],
      processingTime: 2.3, // seconds
      modelVersion: 'v2.1.0',
    },
    extraction: {
      extractedFields: [
        { field: 'Patient Name', value: 'Rajesh Kumar', confidence: 0.98 },
        { field: 'Date of Service', value: '2024-01-10', confidence: 0.95 },
        { field: 'Procedure Code', value: 'CPT-99213', confidence: 0.92 },
        { field: 'Diagnosis Code', value: 'ICD-E11.9', confidence: 0.89 },
        { field: 'Provider Name', value: 'Dr. Amit Sharma', confidence: 0.94 },
      ],
      missingDocuments: [
        'Pre-authorization letter',
        'Detailed operative report',
        'Lab results supporting diagnosis',
      ],
      documentQuality: 0.78,
      ocrConfidence: 0.91,
      validationResults: [
        { check: 'Date Format Validation', status: 'passed' },
        { check: 'Code Format Validation', status: 'passed' },
        { check: 'Required Fields Present', status: 'failed' },
      ],
    },
    appealGeneration: {
      appealLetter: `Dear Claims Review Team,

We are writing to formally appeal the denial of claim #${claim.claimId} for patient Rajesh Kumar, dated January 10, 2024.

The denial was based on "Lack of Medical Necessity," however, we believe this determination was made in error. The treatment provided was medically necessary and appropriate for the patient's condition.

Clinical Justification:
The patient presented with Type 2 Diabetes with complications (ICD-E11.9) requiring immediate intervention. The procedure performed (CPT-99213) was the standard of care for this condition and was performed by a qualified physician.

Supporting Evidence:
1. Patient's medical history demonstrates progressive deterioration
2. Conservative treatment options had been exhausted
3. The procedure follows established clinical guidelines

We respectfully request that you reconsider this denial and approve payment for the services rendered.

Sincerely,
Claims Review Team`,
      supportingArguments: [
        'Medical necessity established by clinical guidelines',
        'Conservative treatments were attempted first',
        'Procedure performed by qualified specialist',
        'Patient condition warranted immediate intervention',
      ],
      legalReferences: [
        'Medicare Coverage Guidelines Section 1862(a)(1)(A)',
        'State Insurance Code Chapter 15.2',
      ],
      estimatedSuccessRate: 0.73,
      alternativeApproaches: [
        'Request peer-to-peer review',
        'Submit additional clinical documentation',
        'Appeal to external review organization',
      ],
    },
    recoveryStrategy: {
      priorityScore: 8.5,
      recommendedActions: [
        {
          action: 'Submit First Level Appeal',
          timeline: '7-14 days',
          successProbability: 0.73,
          effort: 'Medium',
        },
        {
          action: 'Peer-to-Peer Review',
          timeline: '3-5 days',
          successProbability: 0.68,
          effort: 'Low',
        },
        {
          action: 'External Review',
          timeline: '30-45 days',
          successProbability: 0.82,
          effort: 'High',
        },
      ],
      riskAssessment: {
        timeRisk: 'Medium',
        costRisk: 'Low',
        successRisk: 'Low',
      },
      financialImpact: {
        potentialRecovery: claim.deniedAmount || 75000,
        processingCost: 5000,
        netBenefit: (claim.deniedAmount || 75000) - 5000,
        roi: 14.0, // 14x return
      },
    },
  };

  const analysisTypes = [
    { id: 'classification', label: 'Denial Classification', icon: Brain },
    { id: 'extraction', label: 'Document Extraction', icon: FileText },
    { id: 'appealGeneration', label: 'Appeal Generation', icon: MessageSquare },
    { id: 'recoveryStrategy', label: 'Recovery Strategy', icon: Target },
  ];

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Analysis Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">AI Analysis Results</h2>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">
              Processed in {mockAIAnalysis.classification.processingTime}s
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Brain className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">
              {(mockAIAnalysis.classification.confidence * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">Classification Confidence</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">
              {(mockAIAnalysis.extraction.ocrConfidence * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">OCR Accuracy</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">
              {(mockAIAnalysis.appealGeneration.estimatedSuccessRate * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">Appeal Success Rate</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <Target className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">
              {mockAIAnalysis.recoveryStrategy.priorityScore}/10
            </div>
            <div className="text-sm text-gray-600">Priority Score</div>
          </div>
        </div>
      </Card>

      {/* Analysis Type Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {analysisTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setActiveAnalysis(type.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeAnalysis === type.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{type.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Classification Analysis */}
      {activeAnalysis === 'classification' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Denial Classification</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Primary Reason</h4>
                  <p className="text-gray-600">{mockAIAnalysis.classification.primaryReason}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(mockAIAnalysis.classification.confidence)}`}>
                  {(mockAIAnalysis.classification.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">AI Reasoning</h4>
                <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">
                  {mockAIAnalysis.classification.reasoning}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Secondary Reasons</h4>
                <div className="space-y-2">
                  {mockAIAnalysis.classification.secondaryReasons.map((reason, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-gray-900">{reason.reason}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(reason.confidence)}`}>
                        {(reason.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Suggested Actions</h4>
                <div className="space-y-2">
                  {mockAIAnalysis.classification.suggestedActions.map((action, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-gray-900">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Document Extraction */}
      {activeAnalysis === 'extraction' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Extraction Results</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Extracted Fields</h4>
                <div className="space-y-2">
                  {mockAIAnalysis.extraction.extractedFields.map((field, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900">{field.field}:</span>
                        <span className="ml-2 text-gray-700">{field.value}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(field.confidence)}`}>
                        {(field.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Missing Documents</h4>
                <div className="space-y-2">
                  {mockAIAnalysis.extraction.missingDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-800">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Validation Results</h4>
                <div className="space-y-2">
                  {mockAIAnalysis.extraction.validationResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(result.status)}
                        <span className="text-gray-900">{result.check}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result.status === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {result.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Appeal Generation */}
      {activeAnalysis === 'appealGeneration' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Generated Appeal Letter</h3>
            
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Generated Appeal Letter</h4>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
                <div className="bg-white p-4 rounded border max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-900 font-mono">
                    {mockAIAnalysis.appealGeneration.appealLetter}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Supporting Arguments</h4>
                <div className="space-y-2">
                  {mockAIAnalysis.appealGeneration.supportingArguments.map((argument, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-gray-900">{argument}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Legal References</h4>
                <div className="space-y-2">
                  {mockAIAnalysis.appealGeneration.legalReferences.map((reference, index) => (
                    <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="text-blue-800 font-mono text-sm">{reference}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-green-800">Estimated Success Rate</h4>
                  <p className="text-green-700">Based on similar cases and appeal patterns</p>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {(mockAIAnalysis.appealGeneration.estimatedSuccessRate * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Recovery Strategy */}
      {activeAnalysis === 'recoveryStrategy' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recovery Strategy</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Recommended Actions</h4>
                <div className="space-y-3">
                  {mockAIAnalysis.recoveryStrategy.recommendedActions.map((action, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{action.action}</h5>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(action.successProbability)}`}>
                          {(action.successProbability * 100).toFixed(0)}% success
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>Timeline: {action.timeline}</div>
                        <div>Effort: {action.effort}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Risk Assessment</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 border border-gray-200 rounded-lg">
                    <div className="text-sm text-gray-600">Time Risk</div>
                    <div className={`font-medium ${
                      mockAIAnalysis.recoveryStrategy.riskAssessment.timeRisk === 'Low' ? 'text-green-600' :
                      mockAIAnalysis.recoveryStrategy.riskAssessment.timeRisk === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {mockAIAnalysis.recoveryStrategy.riskAssessment.timeRisk}
                    </div>
                  </div>
                  <div className="text-center p-3 border border-gray-200 rounded-lg">
                    <div className="text-sm text-gray-600">Cost Risk</div>
                    <div className={`font-medium ${
                      mockAIAnalysis.recoveryStrategy.riskAssessment.costRisk === 'Low' ? 'text-green-600' :
                      mockAIAnalysis.recoveryStrategy.riskAssessment.costRisk === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {mockAIAnalysis.recoveryStrategy.riskAssessment.costRisk}
                    </div>
                  </div>
                  <div className="text-center p-3 border border-gray-200 rounded-lg">
                    <div className="text-sm text-gray-600">Success Risk</div>
                    <div className={`font-medium ${
                      mockAIAnalysis.recoveryStrategy.riskAssessment.successRisk === 'Low' ? 'text-green-600' :
                      mockAIAnalysis.recoveryStrategy.riskAssessment.successRisk === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {mockAIAnalysis.recoveryStrategy.riskAssessment.successRisk}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Financial Impact</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600">Potential Recovery</div>
                    <div className="font-bold text-blue-600">
                      {formatCurrency(mockAIAnalysis.recoveryStrategy.financialImpact.potentialRecovery)}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-sm text-gray-600">Processing Cost</div>
                    <div className="font-bold text-red-600">
                      {formatCurrency(mockAIAnalysis.recoveryStrategy.financialImpact.processingCost)}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-sm text-gray-600">Net Benefit</div>
                    <div className="font-bold text-green-600">
                      {formatCurrency(mockAIAnalysis.recoveryStrategy.financialImpact.netBenefit)}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-sm text-gray-600">ROI</div>
                    <div className="font-bold text-purple-600">
                      {mockAIAnalysis.recoveryStrategy.financialImpact.roi}x
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* AI Model Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Model Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Model Version</p>
            <p className="font-medium text-gray-900">{mockAIAnalysis.classification.modelVersion}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Processing Time</p>
            <p className="font-medium text-gray-900">{mockAIAnalysis.classification.processingTime} seconds</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Analysis Date</p>
            <p className="font-medium text-gray-900">{new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end space-x-3">
          <Button variant="outline" size="sm">
            <ThumbsDown className="w-4 h-4 mr-1" />
            Incorrect Analysis
          </Button>
          <Button variant="outline" size="sm">
            <ThumbsUp className="w-4 h-4 mr-1" />
            Helpful Analysis
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AIAnalysisResults;