# Denial Classifier AI Agent Specification

## Overview

The Denial Classifier AI Agent is the first AI agent in the ClaimIQ workflow, responsible for analyzing denial text from Indian insurance companies and TPAs to categorize the reason for claim denial. This agent processes denial information immediately after claim normalization and provides structured classification that drives subsequent AI agents and human decision-making.

## Agent Purpose and Scope

**Primary Function:** Analyze denial text and categorize the specific reason for claim denial according to Indian insurance industry patterns.

**Business Value:** 
- Enables automated routing of denials to appropriate resolution strategies
- Provides consistent classification across different payer formats
- Reduces manual review time for billing staff
- Improves appeal success rates through accurate categorization

**Constraints:**
- Must handle denial text in English and Hindi (transliterated)
- Must understand Indian insurance terminology and TPA-specific language
- Must provide explainable reasoning for all classifications
- Cannot make financial decisions - only provides classification

## Input Format

### Input Schema

```typescript
interface DenialClassifierInput {
  // Core claim context
  claimId: string;
  tenantId: string;
  hospitalId: string;
  
  // Denial information
  denialText: string; // Primary denial reason text
  denialCode?: string; // Payer-specific denial code
  deniedAmount: number; // Amount denied in INR
  
  // Claim context for better classification
  claimContext: {
    totalAmount: number;
    claimNumber: string;
    serviceDate: string; // ISO date
    submissionDate: string; // ISO date
    denialDate: string; // ISO date
    
    // Medical context
    primaryDiagnosis?: string;
    procedureCodes?: string[];
    admissionType: 'emergency' | 'planned' | 'daycare' | 'outpatient';
    lengthOfStay?: number;
    roomCategory?: string;
  };
  
  // Payer context
  payerInfo: {
    payerName: string;
    payerType: 'insurer' | 'tpa' | 'government' | 'corporate';
    payerCode?: string;
  };
  
  // Patient context (anonymized)
  patientContext: {
    ageGroup: '0-18' | '19-35' | '36-50' | '51-65' | '65+';
    gender: 'male' | 'female' | 'other' | 'unknown';
    policyType?: string;
  };
  
  // Previous attempts (for re-classification)
  previousClassifications?: {
    classification: string;
    confidence: number;
    timestamp: string;
    reason: string;
  }[];
}
```

### Example Input

```json
{
  "claimId": "claim-123e4567-e89b-12d3-a456-426614174000",
  "tenantId": "tenant-456",
  "hospitalId": "hospital-789",
  "denialText": "Claim denied due to missing discharge summary. Pre-authorization form not attached. Please resubmit with required documents.",
  "denialCode": "DOC001",
  "deniedAmount": 45000.00,
  "claimContext": {
    "totalAmount": 45000.00,
    "claimNumber": "CLM-2024-001234",
    "serviceDate": "2024-01-15",
    "submissionDate": "2024-01-20",
    "denialDate": "2024-01-25",
    "primaryDiagnosis": "Acute appendicitis",
    "procedureCodes": ["44970"],
    "admissionType": "emergency",
    "lengthOfStay": 3,
    "roomCategory": "general"
  },
  "payerInfo": {
    "payerName": "Medi Assist",
    "payerType": "tpa",
    "payerCode": "MA001"
  },
  "patientContext": {
    "ageGroup": "19-35",
    "gender": "male",
    "policyType": "individual"
  }
}
```

## Prompt Template

### System Prompt

```
You are an expert Indian healthcare billing specialist with 15+ years of experience in insurance claim denials and appeals. You work for ClaimIQ, an AI-powered denial recovery system for Indian hospitals.

Your role is to analyze insurance claim denial text and classify the specific reason for denial according to Indian insurance industry standards. You understand:

- Indian insurance company and TPA denial patterns
- Common denial reasons in Indian healthcare billing
- Medical terminology and procedure codes used in India
- Insurance policy terms and coverage limitations
- Documentation requirements for different payers

CRITICAL INSTRUCTIONS:
1. Classify denials into ONE primary category from the predefined list
2. Provide confidence score (0.0 to 1.0) based on text clarity and your certainty
3. Extract specific missing documents or issues mentioned
4. Suggest immediate next actions for hospital billing team
5. Use simple, operational language - avoid technical AI terminology
6. Focus on actionable insights that help recover money

DENIAL CATEGORIES (choose ONE primary):
- missing_documents: Required documents not submitted or incomplete
- coding_error: Wrong diagnosis codes, procedure codes, or billing category
- policy_limit: Room rent limits, sub-limits, or coverage caps exceeded
- timely_filing: Claim submitted after allowed time period
- medical_necessity: Treatment not justified or excess length of stay
- pre_auth_required: Pre-authorization not obtained or invalid
- duplicate_claim: Claim already processed or duplicate submission
- other: Unusual denial reasons not covered above

INDIAN CONTEXT AWARENESS:
- Understand TPA-specific language (Medi Assist, MD India, Vidal Health, etc.)
- Recognize common Indian insurance terms (sub-limit, room rent, waiting period)
- Know typical documentation requirements (discharge summary, pre-auth, ID proof)
- Understand Indian medical billing practices and common issues

OUTPUT REQUIREMENTS:
- Always provide reasoning in simple terms billing staff can understand
- Suggest specific documents to collect or actions to take
- Estimate recovery probability based on denial type and context
- Flag urgent cases that need immediate attention
```

### User Prompt Template

```
CLAIM DENIAL ANALYSIS REQUEST

DENIAL TEXT:
"{denialText}"

CLAIM DETAILS:
- Claim Number: {claimNumber}
- Denied Amount: ₹{deniedAmount:,.2f}
- Service Date: {serviceDate}
- Submission Date: {submissionDate}
- Denial Date: {denialDate}
- Days to Appeal Deadline: {daysToDeadline}

MEDICAL CONTEXT:
- Primary Diagnosis: {primaryDiagnosis}
- Procedure Codes: {procedureCodes}
- Admission Type: {admissionType}
- Length of Stay: {lengthOfStay} days
- Room Category: {roomCategory}

PAYER INFORMATION:
- Payer: {payerName} ({payerType})
- Denial Code: {denialCode}

PATIENT CONTEXT:
- Age Group: {ageGroup}
- Gender: {gender}
- Policy Type: {policyType}

ADDITIONAL CONTEXT:
{additionalContext}

Please analyze this denial and provide:
1. Primary denial classification
2. Confidence level in your classification
3. Specific issues identified
4. Missing documents or requirements
5. Recommended immediate actions
6. Recovery probability assessment
7. Priority level for billing team attention

Focus on practical, actionable insights that help the hospital billing team recover this denied amount quickly and effectively.
```

## Output Schema

### Output Format

```typescript
interface DenialClassifierOutput {
  // Classification results
  classification: {
    primaryCategory: DenialCategory;
    confidence: number; // 0.0 to 1.0
    reasoning: string; // Simple explanation for billing staff
    alternativeCategories?: {
      category: DenialCategory;
      confidence: number;
      reason: string;
    }[];
  };
  
  // Specific issues identified
  identifiedIssues: {
    missingDocuments: string[]; // List of specific missing documents
    codingIssues: string[]; // Specific coding problems
    policyViolations: string[]; // Policy limit or coverage issues
    timingIssues: string[]; // Deadline or timing problems
    medicalNecessityIssues: string[]; // Medical justification problems
  };
  
  // Actionable recommendations
  recommendations: {
    immediateActions: string[]; // What to do right now
    documentsToCollect: string[]; // Specific documents needed
    correctionsNeeded: string[]; // What needs to be fixed
    escalationRequired: boolean; // Needs senior staff attention
    appealStrategy: string; // High-level approach for appeal
  };
  
  // Recovery assessment (qualitative only, NO calculations)
  recoveryAssessment: {
    probabilityCategory: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
    timelineCategory: 'urgent' | 'normal' | 'extended';
    effortLevel: 'low' | 'medium' | 'high';
    priorityLevel: 'low' | 'medium' | 'high' | 'urgent';
    complexityLevel: 'simple' | 'moderate' | 'complex' | 'very_complex';
  };
  
  // Workflow integration (routing only)
  workflowData: {
    nextAgent: 'document_extractor' | 'human_review';
    humanReviewRequired: boolean;
    urgentFlag: boolean;
    requiresCalculation: boolean; // Triggers financial calculation service
  };
  
  // Audit and compliance
  auditTrail: {
    agentVersion: string;
    modelUsed: string;
    processingTime: number; // milliseconds
    tokensUsed: number;
    timestamp: string; // ISO timestamp
    confidence_breakdown: {
      text_clarity: number;
      context_completeness: number;
      pattern_match: number;
      historical_similarity: number;
    };
  };
}

// Enum definitions
type DenialCategory = 
  | 'missing_documents'
  | 'coding_error'
  | 'policy_limit'
  | 'timely_filing'
  | 'medical_necessity'
  | 'pre_auth_required'
  | 'duplicate_claim'
  | 'other';
```

### Example Output

```json
{
  "classification": {
    "primaryCategory": "missing_documents",
    "confidence": 0.92,
    "reasoning": "Denial clearly states missing discharge summary and pre-authorization form. These are standard document requirements that can be easily resolved.",
    "alternativeCategories": [
      {
        "category": "pre_auth_required",
        "confidence": 0.15,
        "reason": "Pre-auth mentioned but seems to be about missing form rather than approval issue"
      }
    ]
  },
  
  "identifiedIssues": {
    "missingDocuments": [
      "Discharge summary",
      "Pre-authorization form"
    ],
    "codingIssues": [],
    "policyViolations": [],
    "timingIssues": [],
    "medicalNecessityIssues": []
  },
  
  "recommendations": {
    "immediateActions": [
      "Contact medical records department for discharge summary",
      "Retrieve original pre-authorization approval from insurance desk",
      "Prepare resubmission package within 2 days"
    ],
    "documentsToCollect": [
      "Final discharge summary with doctor signature",
      "Original pre-authorization approval letter",
      "Patient ID proof copy"
    ],
    "correctionsNeeded": [
      "Ensure discharge summary includes all required sections",
      "Verify pre-auth form has all necessary stamps and signatures"
    ],
    "escalationRequired": false,
    "appealStrategy": "Document resubmission with complete paperwork - high success probability"
  },
  
  "recoveryAssessment": {
    "probabilityCategory": "high",
    "timelineCategory": "normal",
    "effortLevel": "low",
    "priorityLevel": "medium",
    "complexityLevel": "simple"
  },
  
  "workflowData": {
    "nextAgent": "document_extractor",
    "humanReviewRequired": false,
    "urgentFlag": false,
    "requiresCalculation": true
  },
  
  "auditTrail": {
    "agentVersion": "denial-classifier-v1.2.0",
    "modelUsed": "claude-3-haiku-20240307",
    "processingTime": 1250,
    "tokensUsed": 890,
    "timestamp": "2024-01-26T10:30:45.123Z",
    "confidence_breakdown": {
      "text_clarity": 0.95,
      "context_completeness": 0.88,
      "pattern_match": 0.92,
      "historical_similarity": 0.90
    }
  }
}
```

## Workflow Integration

### Step Functions Integration

```json
{
  "Comment": "Denial Classifier Agent Step",
  "Type": "Task",
  "Resource": "arn:aws:lambda:region:account:function:denial-classifier-agent",
  "Parameters": {
    "claimId.$": "$.claimId",
    "denialData.$": "$.denialData",
    "claimContext.$": "$.claimContext"
  },
  "ResultPath": "$.classificationResult",
  "Next": "EvaluateClassification",
  "Retry": [
    {
      "ErrorEquals": ["Lambda.ServiceException", "Lambda.AWSLambdaException"],
      "IntervalSeconds": 2,
      "MaxAttempts": 3,
      "BackoffRate": 2.0
    }
  ],
  "Catch": [
    {
      "ErrorEquals": ["States.ALL"],
      "Next": "ClassificationFailed",
      "ResultPath": "$.error"
    }
  ]
}
```

### Lambda Function Implementation

```typescript
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { DenialClassifierInput, DenialClassifierOutput } from './types';

export class DenialClassifierAgent {
  private bedrockClient: BedrockRuntimeClient;
  private modelId = "anthropic.claude-3-haiku-20240307-v1:0";
  
  constructor() {
    this.bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
  }
  
  async classifyDenial(input: DenialClassifierInput): Promise<DenialClassifierOutput> {
    const startTime = Date.now();
    
    try {
      // Prepare prompt with input data
      const prompt = this.buildPrompt(input);
      
      // Call Bedrock Claude model
      const response = await this.invokeModel(prompt);
      
      // Parse and validate response
      const classification = this.parseResponse(response);
      
      // Add audit trail
      classification.auditTrail = {
        agentVersion: "denial-classifier-v1.2.0",
        modelUsed: this.modelId,
        processingTime: Date.now() - startTime,
        tokensUsed: response.tokensUsed,
        timestamp: new Date().toISOString(),
        confidence_breakdown: this.calculateConfidenceBreakdown(input, classification)
      };
      
      // Store results in database
      await this.storeClassificationResults(input.claimId, classification);
      
      // Log agent action
      await this.logAgentAction(input, classification);
      
      return classification;
      
    } catch (error) {
      await this.handleError(input.claimId, error);
      throw error;
    }
  }
  
  private buildPrompt(input: DenialClassifierInput): string {
    const daysToDeadline = this.calculateDaysToDeadline(input.claimContext.denialDate);
    
    return `
CLAIM DENIAL ANALYSIS REQUEST

DENIAL TEXT:
"${input.denialText}"

CLAIM DETAILS:
- Claim Number: ${input.claimContext.claimNumber}
- Denied Amount: ₹${input.deniedAmount.toLocaleString('en-IN')}
- Service Date: ${input.claimContext.serviceDate}
- Submission Date: ${input.claimContext.submissionDate}
- Denial Date: ${input.claimContext.denialDate}
- Days to Appeal Deadline: ${daysToDeadline}

MEDICAL CONTEXT:
- Primary Diagnosis: ${input.claimContext.primaryDiagnosis || 'Not specified'}
- Procedure Codes: ${input.claimContext.procedureCodes?.join(', ') || 'Not specified'}
- Admission Type: ${input.claimContext.admissionType}
- Length of Stay: ${input.claimContext.lengthOfStay || 'Not specified'} days
- Room Category: ${input.claimContext.roomCategory || 'Not specified'}

PAYER INFORMATION:
- Payer: ${input.payerInfo.payerName} (${input.payerInfo.payerType})
- Denial Code: ${input.denialCode || 'Not provided'}

PATIENT CONTEXT:
- Age Group: ${input.patientContext.ageGroup}
- Gender: ${input.patientContext.gender}
- Policy Type: ${input.patientContext.policyType || 'Not specified'}

Please analyze this denial and provide your response in the following JSON format:
{
  "classification": {
    "primaryCategory": "one of: missing_documents, coding_error, policy_limit, timely_filing, medical_necessity, pre_auth_required, duplicate_claim, other",
    "confidence": 0.0-1.0,
    "reasoning": "simple explanation for billing staff"
  },
  "identifiedIssues": {
    "missingDocuments": ["list of specific missing documents"],
    "codingIssues": ["specific coding problems"],
    "policyViolations": ["policy limit or coverage issues"],
    "timingIssues": ["deadline or timing problems"],
    "medicalNecessityIssues": ["medical justification problems"]
  },
  "recommendations": {
    "immediateActions": ["what to do right now"],
    "documentsToCollect": ["specific documents needed"],
    "correctionsNeeded": ["what needs to be fixed"],
    "escalationRequired": true/false,
    "appealStrategy": "high-level approach for appeal"
  },
  "recoveryAssessment": {
    "probability": 0.0-1.0,
    "estimatedTimeToResolve": number_of_days,
    "effortLevel": "low/medium/high",
    "priorityLevel": "low/medium/high/urgent",
    "financialImpact": "minimal/moderate/significant/critical"
  },
  "workflowData": {
    "nextAgent": "document_extractor or human_review",
    "humanReviewRequired": true/false,
    "urgentFlag": true/false,
    "estimatedResolutionCost": cost_in_inr
  }
}
    `.trim();
  }
  
  private async invokeModel(prompt: string): Promise<any> {
    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 2000,
      temperature: 0.1, // Low temperature for consistent classification
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    };
    
    const command = new InvokeModelCommand({
      modelId: this.modelId,
      body: JSON.stringify(payload),
      contentType: "application/json",
      accept: "application/json"
    });
    
    const response = await this.bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    return {
      content: responseBody.content[0].text,
      tokensUsed: responseBody.usage.input_tokens + responseBody.usage.output_tokens
    };
  }
  
  private parseResponse(response: any): DenialClassifierOutput {
    try {
      // Extract JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      this.validateOutput(parsed);
      
      return parsed as DenialClassifierOutput;
      
    } catch (error) {
      throw new Error(`Failed to parse agent response: ${error.message}`);
    }
  }
  
  private validateOutput(output: any): void {
    const requiredFields = [
      'classification.primaryCategory',
      'classification.confidence',
      'classification.reasoning',
      'recoveryAssessment.probability',
      'workflowData.nextAgent'
    ];
    
    for (const field of requiredFields) {
      const value = field.split('.').reduce((obj, key) => obj?.[key], output);
      if (value === undefined || value === null) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Validate confidence scores
    if (output.classification.confidence < 0 || output.classification.confidence > 1) {
      throw new Error("Confidence score must be between 0 and 1");
    }
  }
  
  private async storeClassificationResults(claimId: string, classification: DenialClassifierOutput): Promise<void> {
    // Update denial record in Aurora
    await this.db.denials.update({
      where: { claim_id: claimId },
      data: {
        ai_classification: classification.classification.primaryCategory,
        ai_confidence_score: classification.classification.confidence,
        ai_reasoning: classification.classification.reasoning,
        recovery_probability: classification.recoveryAssessment.probability,
        estimated_recovery_amount: classification.recoveryAssessment.probability * this.deniedAmount,
        missing_documents: classification.identifiedIssues.missingDocuments,
        document_issues: classification.identifiedIssues,
        status: 'analyzing',
        updated_at: new Date()
      }
    });
  }
  
  private async logAgentAction(input: DenialClassifierInput, output: DenialClassifierOutput): Promise<void> {
    await this.db.agentActions.create({
      data: {
        tenant_id: input.tenantId,
        claim_id: input.claimId,
        agent_type: 'denial_classifier',
        agent_version: output.auditTrail.agentVersion,
        action_name: 'classify_denial',
        input_data: input,
        output_data: output,
        model_name: output.auditTrail.modelUsed,
        confidence_score: output.classification.confidence,
        reasoning: output.classification.reasoning,
        recommendations: output.recommendations.immediateActions,
        execution_time_ms: output.auditTrail.processingTime,
        tokens_used: output.auditTrail.tokensUsed,
        status: 'completed'
      }
    });
  }
}

// Lambda handler
export const handler = async (event: any) => {
  const agent = new DenialClassifierAgent();
  
  try {
    const result = await agent.classifyDenial(event);
    
    return {
      statusCode: 200,
      body: result
    };
    
  } catch (error) {
    console.error('Denial classification failed:', error);
    
    return {
      statusCode: 500,
      body: {
        error: error.message,
        claimId: event.claimId
      }
    };
  }
};
```

### Database Integration

```sql
-- Update denial record with classification results
UPDATE denials 
SET 
  ai_classification = $1,
  ai_confidence_score = $2,
  ai_reasoning = $3,
  recovery_probability = $4,
  missing_documents = $5,
  document_issues = $6,
  status = 'ready_for_appeal',
  updated_at = NOW()
WHERE claim_id = $7 AND tenant_id = $8;

-- Insert agent action record
INSERT INTO agent_actions (
  tenant_id, claim_id, agent_type, action_name,
  input_data, output_data, confidence_score, reasoning,
  execution_time_ms, tokens_used, status
) VALUES (
  $1, $2, 'denial_classifier', 'classify_denial',
  $3, $4, $5, $6, $7, $8, 'completed'
);
```

### Error Handling and Fallbacks

```typescript
class DenialClassifierErrorHandler {
  async handleClassificationError(claimId: string, error: Error): Promise<void> {
    // Log error for monitoring
    await this.auditService.log({
      action_type: 'ai_action_failed',
      action_category: 'system',
      actor_type: 'ai_agent',
      target_type: 'claim',
      target_id: claimId,
      risk_level: 'medium',
      error_details: error.message
    });
    
    // Create fallback classification
    const fallbackClassification: DenialClassifierOutput = {
      classification: {
        primaryCategory: 'other',
        confidence: 0.1,
        reasoning: 'AI classification failed - requires manual review'
      },
      identifiedIssues: {
        missingDocuments: [],
        codingIssues: [],
        policyViolations: [],
        timingIssues: [],
        medicalNecessityIssues: []
      },
      recommendations: {
        immediateActions: ['Manual review required due to AI classification failure'],
        documentsToCollect: [],
        correctionsNeeded: [],
        escalationRequired: true,
        appealStrategy: 'Manual analysis needed'
      },
      recoveryAssessment: {
        probability: 0.5,
        estimatedTimeToResolve: 14,
        effortLevel: 'high',
        priorityLevel: 'high',
        financialImpact: 'moderate'
      },
      workflowData: {
        nextAgent: 'human_review',
        humanReviewRequired: true,
        urgentFlag: true,
        estimatedResolutionCost: 2000
      },
      auditTrail: {
        agentVersion: 'denial-classifier-v1.2.0',
        modelUsed: 'fallback',
        processingTime: 0,
        tokensUsed: 0,
        timestamp: new Date().toISOString(),
        confidence_breakdown: {
          text_clarity: 0,
          context_completeness: 0,
          pattern_match: 0,
          historical_similarity: 0
        }
      }
    };
    
    // Store fallback classification
    await this.storeClassificationResults(claimId, fallbackClassification);
    
    // Trigger human review workflow
    await this.triggerHumanReview(claimId, 'AI classification failed');
  }
}
```

## Performance and Monitoring

### Key Metrics

```typescript
interface DenialClassifierMetrics {
  // Performance metrics
  averageProcessingTime: number; // milliseconds
  successRate: number; // percentage
  averageConfidenceScore: number;
  
  // Accuracy metrics
  classificationAccuracy: number; // validated against human review
  recoveryPredictionAccuracy: number; // actual vs predicted recovery
  
  // Business metrics
  claimsProcessedPerDay: number;
  averageDeniedAmount: number;
  totalPotentialRecovery: number;
  
  // Quality metrics
  humanOverrideRate: number; // percentage of classifications changed by humans
  escalationRate: number; // percentage requiring immediate attention
  
  // Cost metrics
  averageTokensPerClassification: number;
  costPerClassification: number; // in INR
  costSavingsVsManual: number; // in INR
}
```

### Monitoring Dashboard

```typescript
// CloudWatch metrics for monitoring
const metrics = {
  'DenialClassifier/ProcessingTime': processingTime,
  'DenialClassifier/ConfidenceScore': confidenceScore,
  'DenialClassifier/TokensUsed': tokensUsed,
  'DenialClassifier/ErrorRate': errorRate,
  'DenialClassifier/ThroughputPerMinute': throughput
};

// Alerts
const alerts = [
  {
    metric: 'DenialClassifier/ErrorRate',
    threshold: 0.05, // 5% error rate
    action: 'notify_engineering_team'
  },
  {
    metric: 'DenialClassifier/ConfidenceScore',
    threshold: 0.7, // Average confidence below 70%
    action: 'review_model_performance'
  },
  {
    metric: 'DenialClassifier/ProcessingTime',
    threshold: 5000, // 5 seconds
    action: 'check_model_performance'
  }
];
```

This Denial Classifier AI Agent specification provides a comprehensive, production-ready design that integrates seamlessly with the ClaimIQ workflow while addressing the specific needs of Indian hospital billing teams. The agent focuses on practical, actionable insights that directly help recover denied claim amounts.

## Financial Calculation Service Integration

### Separation of Concerns

**CRITICAL RULE**: The Denial Classifier AI Agent NEVER performs arithmetic, financial calculations, or mathematical operations. All numerical computations are handled by dedicated Financial Calculation Services.

### AI Agent Responsibilities (Classification Only)
- Analyze denial text and categorize denial reasons
- Extract qualitative information from documents
- Provide reasoning and explanations
- Identify missing documents and issues
- Suggest recovery strategies (qualitative)
- Assess probability categories (high/medium/low, not percentages)

### Financial Calculation Service Responsibilities
- Calculate all monetary amounts and percentages
- Compute recovery estimates based on AI classifications
- Perform room rent adjustments and policy limit calculations
- Calculate processing costs and ROI metrics
- Generate all financial projections and analytics
- Validate all numerical outputs through deterministic algorithms

### Integration Workflow

```typescript
// AI Agent Output (NO calculations)
interface DenialClassifierOutput {
  classification: {
    primaryCategory: DenialCategory;
    confidence: number; // 0.0 to 1.0 (only confidence score allowed)
    reasoning: string;
  };
  
  recoveryAssessment: {
    probabilityCategory: 'very_low' | 'low' | 'medium' | 'high' | 'very_high'; // Qualitative only
    timelineCategory: 'urgent' | 'normal' | 'extended';
    effortLevel: 'low' | 'medium' | 'high';
    priorityLevel: 'low' | 'medium' | 'high' | 'urgent';
  };
  
  workflowData: {
    requiresCalculation: boolean; // Triggers financial calculation service
    nextAgent: string;
  };
}

// Financial Calculation Service Input
interface FinancialCalculationInput {
  claimId: string;
  originalAmount: number;
  deniedAmount: number;
  aiClassification: DenialCategory;
  aiConfidence: number;
  probabilityCategory: string;
  policyLimits?: PolicyLimits;
  adjustments?: ClaimAdjustment[];
}

// Financial Calculation Service Output
interface FinancialCalculationOutput {
  recoveryEstimate: {
    estimatedAmount: number; // Calculated by code
    recoveryPercentage: number; // Calculated by code
    adjustedClaimAmount: number; // Calculated by code
  };
  
  costAnalysis: {
    processingCost: number; // Calculated by code
    netRecovery: number; // Calculated by code
    roi: number; // Calculated by code
  };
  
  adjustments: {
    roomRentAdjustment: number; // Calculated by code
    policyLimitAdjustment: number; // Calculated by code
    totalAdjustments: number; // Calculated by code
  };
}
```

### Step Functions Integration

```json
{
  "Comment": "AI Classification followed by Financial Calculation",
  "StartAt": "DenialClassifier",
  "States": {
    "DenialClassifier": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:region:account:function:denial-classifier-agent",
      "Next": "CheckCalculationRequired"
    },
    "CheckCalculationRequired": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.classificationResult.workflowData.requiresCalculation",
          "BooleanEquals": true,
          "Next": "FinancialCalculation"
        }
      ],
      "Default": "NextAgent"
    },
    "FinancialCalculation": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:region:account:function:financial-calculation-service",
      "ResultPath": "$.financialResults",
      "Next": "NextAgent"
    },
    "NextAgent": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:region:account:function:next-agent"
    }
  }
}
```

### Validation Rules

1. **AI Agent Validation**: All AI outputs are validated to ensure NO arithmetic operations
2. **Financial Service Validation**: All calculations are performed using deterministic algorithms
3. **Cross-Validation**: AI qualitative assessments are validated against calculated results
4. **Audit Trail**: Complete separation between AI reasoning and financial calculations is logged

### Error Handling

```typescript
// AI Agent Error - No calculations allowed
if (aiOutput.containsCalculations()) {
  throw new Error("AI Agent performed forbidden calculations");
}

// Financial Service Error - All calculations must be deterministic
if (!financialOutput.isValidated()) {
  throw new Error("Financial calculations failed validation");
}

// Integration Error - Results must be consistent
if (!validateConsistency(aiOutput, financialOutput)) {
  throw new Error("AI classification and financial results inconsistent");
}
```

This separation ensures that:
- AI agents focus on their core competency: intelligent analysis and reasoning
- Financial calculations are handled by reliable, auditable code
- All monetary decisions are based on validated, deterministic computations
- The system maintains compliance with numerical computation rules