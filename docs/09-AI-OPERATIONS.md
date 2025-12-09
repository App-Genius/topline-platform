# Topline: AI Operations Specification

## Overview

This document specifies how AI is integrated throughout the Topline system, including provider abstraction, structured outputs, prompt templates, and all AI-powered features.

---

## Table of Contents

1. [AI Provider Architecture](#1-ai-provider-architecture)
2. [Structured Outputs with Zod](#2-structured-outputs-with-zod)
3. [AI Use Cases](#3-ai-use-cases)
4. [Prompt Templates](#4-prompt-templates)
5. [Receipt Processing](#5-receipt-processing)
6. [Insight Generation](#6-insight-generation)
7. [Correlation Analysis AI](#7-correlation-analysis-ai)
8. [Recommendation Engine](#8-recommendation-engine)
9. [Training Topic Generation](#9-training-topic-generation)
10. [Feedback Synthesis](#10-feedback-synthesis)
11. [AI Coach System](#11-ai-coach-system)
12. [Error Handling & Fallbacks](#12-error-handling--fallbacks)

---

## 1. AI Provider Architecture

### 1.1 Provider Abstraction Layer

Topline supports multiple AI providers through an abstraction layer, allowing easy switching and fallback.

**Supported Providers**:
- OpenAI (GPT-4, GPT-4 Turbo)
- OpenRouter (access to Claude, Llama, Mistral, etc.)
- Anthropic Claude (direct)

**Configuration**:
```typescript
// config/ai.config.ts
export const aiConfig = {
  primary: {
    provider: 'openrouter',
    model: 'anthropic/claude-3-sonnet',
    apiKey: process.env.OPENROUTER_API_KEY
  },
  fallback: {
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
    apiKey: process.env.OPENAI_API_KEY
  },
  settings: {
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000,
    temperature: 0.7
  }
};
```

### 1.2 AI Client Implementation

```typescript
// lib/ai/client.ts
import { z } from 'zod';

type AIProvider = 'openai' | 'openrouter' | 'anthropic';

interface AIClientConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
}

interface GenerateOptions<T extends z.ZodType> {
  prompt: string;
  systemPrompt?: string;
  schema: T;
  temperature?: number;
  maxTokens?: number;
}

export class AIClient {
  private config: AIClientConfig;

  constructor(config: AIClientConfig) {
    this.config = config;
  }

  async generate<T extends z.ZodType>(
    options: GenerateOptions<T>
  ): Promise<z.infer<T>> {
    const response = await this.callProvider(options);

    // Parse and validate response
    const parseResult = options.schema.safeParse(response);

    if (!parseResult.success) {
      throw new AIValidationError(
        'AI response failed schema validation',
        parseResult.error
      );
    }

    return parseResult.data;
  }

  private async callProvider(options: GenerateOptions<unknown>): Promise<unknown> {
    switch (this.config.provider) {
      case 'openai':
        return this.callOpenAI(options);
      case 'openrouter':
        return this.callOpenRouter(options);
      case 'anthropic':
        return this.callAnthropic(options);
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }

  private async callOpenAI(options: GenerateOptions<unknown>): Promise<unknown> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: options.systemPrompt ?? '' },
          { role: 'user', content: options.prompt }
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  }

  private async callOpenRouter(options: GenerateOptions<unknown>): Promise<unknown> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': process.env.APP_URL,
        'X-Title': 'Topline'
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: options.systemPrompt ?? '' },
          { role: 'user', content: options.prompt }
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000
      })
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  }
}
```

### 1.3 Provider Factory

```typescript
// lib/ai/factory.ts
import { aiConfig } from '@/config/ai.config';
import { AIClient } from './client';

let primaryClient: AIClient | null = null;
let fallbackClient: AIClient | null = null;

export function getAIClient(useFallback = false): AIClient {
  if (useFallback) {
    if (!fallbackClient) {
      fallbackClient = new AIClient(aiConfig.fallback);
    }
    return fallbackClient;
  }

  if (!primaryClient) {
    primaryClient = new AIClient(aiConfig.primary);
  }
  return primaryClient;
}

export async function generateWithFallback<T extends z.ZodType>(
  options: GenerateOptions<T>
): Promise<z.infer<T>> {
  try {
    const client = getAIClient(false);
    return await client.generate(options);
  } catch (error) {
    console.error('Primary AI provider failed, trying fallback:', error);

    const fallback = getAIClient(true);
    return await fallback.generate(options);
  }
}
```

---

## 2. Structured Outputs with Zod

### 2.1 Why Structured Outputs?

AI responses must be predictable and type-safe. Using Zod schemas ensures:
- Consistent response structure
- Runtime validation
- TypeScript type inference
- Clear error messages when AI returns unexpected data

### 2.2 Common Schemas

```typescript
// lib/ai/schemas.ts
import { z } from 'zod';

// Insight schema
export const InsightSchema = z.object({
  type: z.enum(['success', 'warning', 'action', 'info']),
  title: z.string().max(100),
  description: z.string().max(500),
  metric: z.object({
    name: z.string(),
    currentValue: z.number(),
    previousValue: z.number().optional(),
    changePercent: z.number().optional(),
    trend: z.enum(['up', 'down', 'flat']).optional()
  }).optional(),
  recommendations: z.array(z.string()).max(3),
  priority: z.enum(['high', 'medium', 'low']),
  affectedRoles: z.array(z.string()).optional()
});
export type Insight = z.infer<typeof InsightSchema>;

// Behavior suggestion schema
export const BehaviorSuggestionSchema = z.object({
  behaviors: z.array(z.object({
    name: z.string().max(50),
    description: z.string().max(200),
    targetPerShift: z.number().min(1).max(50),
    points: z.number().min(1).max(100),
    expectedImpact: z.string(),
    script: z.string().max(300).optional()
  })).max(5)
});
export type BehaviorSuggestion = z.infer<typeof BehaviorSuggestionSchema>;

// Receipt extraction schema
export const ReceiptExtractionSchema = z.object({
  tableNumber: z.string().optional(),
  covers: z.number().optional(),
  totalAmount: z.number(),
  timestamp: z.string().optional(),
  itemsDetected: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1),
  containsWine: z.boolean(),
  containsDessert: z.boolean(),
  containsAppetizer: z.boolean()
});
export type ReceiptExtraction = z.infer<typeof ReceiptExtractionSchema>;

// Correlation analysis schema
export const CorrelationAnalysisSchema = z.object({
  behaviorId: z.string(),
  kpiType: z.string(),
  correlation: z.number().min(-1).max(1),
  strength: z.enum(['strong', 'moderate', 'weak', 'negative']),
  insight: z.string().max(300),
  recommendation: z.string().max(200),
  confidence: z.number().min(0).max(1)
});
export type CorrelationAnalysis = z.infer<typeof CorrelationAnalysisSchema>;

// Training topic schema
export const TrainingTopicSchema = z.object({
  title: z.string().max(100),
  description: z.string().max(300),
  keyPoints: z.array(z.string()).min(2).max(5),
  practiceExercise: z.string().max(200).optional(),
  duration: z.number().min(1).max(10), // minutes
  targetRoles: z.array(z.string()),
  relatedBehavior: z.string().optional()
});
export type TrainingTopic = z.infer<typeof TrainingTopicSchema>;

// Feedback synthesis schema
export const FeedbackSynthesisSchema = z.object({
  totalResponses: z.number(),
  themes: z.array(z.object({
    category: z.string(),
    count: z.number(),
    sentiment: z.enum(['positive', 'negative', 'neutral']),
    summary: z.string().max(200),
    suggestedAction: z.string().max(200).optional()
  })).max(5),
  overallSentiment: z.enum(['positive', 'negative', 'neutral', 'mixed']),
  keyTakeaway: z.string().max(300)
});
export type FeedbackSynthesis = z.infer<typeof FeedbackSynthesisSchema>;

// AI Coach message schema
export const AICoachMessageSchema = z.object({
  message: z.string().max(200),
  tone: z.enum(['encouraging', 'motivating', 'informative', 'celebratory']),
  actionSuggestion: z.string().max(100).optional(),
  relevantTip: z.string().max(150).optional()
});
export type AICoachMessage = z.infer<typeof AICoachMessageSchema>;

// Weekly report insights schema
export const WeeklyReportInsightsSchema = z.object({
  executiveSummary: z.string().max(500),
  highlights: z.array(z.object({
    type: z.enum(['achievement', 'concern', 'opportunity']),
    title: z.string().max(100),
    description: z.string().max(300)
  })).max(5),
  behaviorAnalysis: z.string().max(400),
  kpiAnalysis: z.string().max(400),
  recommendations: z.array(z.object({
    priority: z.enum(['high', 'medium', 'low']),
    recommendation: z.string().max(200),
    expectedImpact: z.string().max(100)
  })).max(3),
  lookAhead: z.string().max(200)
});
export type WeeklyReportInsights = z.infer<typeof WeeklyReportInsightsSchema>;
```

---

## 3. AI Use Cases

### Summary of AI Features

| Feature | Trigger | Input | Output | Priority |
|---------|---------|-------|--------|----------|
| Receipt Processing | Staff scans receipt | Image | Extracted data | P0 |
| Behavior Suggestions | Role setup | Role type, industry, KPIs | Suggested behaviors | P1 |
| Correlation Analysis | Weekly job | Behavior + KPI data | Insights | P1 |
| Training Topic Generation | Daily briefing | Performance data | Training content | P2 |
| AI Coach Messages | Real-time on dashboard | User context | Motivational messages | P2 |
| Feedback Synthesis | Weekly | Anonymous feedback | Themed summary | P2 |
| Weekly Report Insights | Weekly | Full week data | Executive summary | P1 |
| Fraud Detection Insights | Alert triggered | User data + patterns | Investigation guidance | P2 |

---

## 4. Prompt Templates

### 4.1 System Prompts

```typescript
// lib/ai/prompts/system.ts

export const SYSTEM_PROMPTS = {
  general: `You are Topline AI, an expert assistant for service businesses using the 4 Disciplines of Execution (4DX) framework. You help businesses connect team behaviors (lead measures) to business outcomes (lag measures).

Your responses should be:
- Concise and actionable
- Focused on measurable behaviors and outcomes
- Encouraging but realistic
- Based on industry best practices

Always respond in valid JSON format matching the requested schema.`,

  behaviorExpert: `You are a behavior design expert specializing in service businesses. You understand how specific, repeatable actions drive business KPIs.

For restaurants: Focus on upselling, guest experience, and operational efficiency.
For retail: Focus on suggestive selling, customer engagement, and inventory awareness.
For hospitality: Focus on guest satisfaction, service recovery, and ancillary revenue.

Design behaviors that are:
- Specific and measurable
- Within staff control
- Clearly linked to a business outcome
- Achievable in a normal shift

Always respond in valid JSON format.`,

  analyticsExpert: `You are a business analytics expert specializing in correlation analysis and performance optimization. You understand statistical relationships between behaviors and outcomes.

When analyzing data:
- Look for meaningful patterns, not just correlations
- Consider time lags between behaviors and outcomes
- Identify anomalies that may indicate issues
- Provide actionable recommendations

Be honest about data limitations. If correlation is weak, say so.

Always respond in valid JSON format.`,

  trainingExpert: `You are a hospitality training expert. You create short, impactful training moments that can be delivered in 2-3 minutes during daily briefings.

Training topics should:
- Focus on one specific skill
- Include a practical exercise or role-play
- Connect to current business goals
- Be engaging and memorable

Always respond in valid JSON format.`,

  coachPersonality: `You are an encouraging AI coach for service industry staff. Your personality is:
- Supportive and positive
- Realistic and practical
- Focused on progress, not perfection
- Knowledgeable about service excellence

Keep messages short (under 200 characters) and motivating.

Always respond in valid JSON format.`
};
```

### 4.2 User Prompt Templates

```typescript
// lib/ai/prompts/templates.ts

export const PROMPT_TEMPLATES = {
  suggestBehaviors: (params: {
    roleType: string;
    industry: string;
    focusKpis: string[];
    existingBehaviors?: string[];
  }) => `
Suggest 5 specific behaviors for a ${params.roleType} in a ${params.industry} business.

Focus KPIs to improve: ${params.focusKpis.join(', ')}

${params.existingBehaviors?.length
  ? `Existing behaviors (don't duplicate): ${params.existingBehaviors.join(', ')}`
  : ''}

For each behavior provide:
- name: Short, action-oriented name (max 50 chars)
- description: What the staff member should do
- targetPerShift: Realistic number of times per shift
- points: Value 1-100 based on difficulty/impact
- expectedImpact: Which KPI this will improve and how
- script: Example words to say (if applicable)

Return as JSON matching the BehaviorSuggestion schema.
`,

  analyzeCorrelation: (params: {
    behaviorName: string;
    behaviorData: { date: string; count: number }[];
    kpiName: string;
    kpiData: { date: string; value: number }[];
    calculatedCorrelation: number;
  }) => `
Analyze the relationship between "${params.behaviorName}" behavior and "${params.kpiName}" KPI.

Data (last 30 days):
Behavior counts: ${JSON.stringify(params.behaviorData.slice(-10))}...
KPI values: ${JSON.stringify(params.kpiData.slice(-10))}...

Calculated Pearson correlation: ${params.calculatedCorrelation}

Provide analysis:
- Interpret the correlation strength
- Explain what this means for the business
- Provide a specific recommendation
- Rate your confidence in this analysis (0-1)

Return as JSON matching the CorrelationAnalysis schema.
`,

  generateTrainingTopic: (params: {
    weakBehavior?: string;
    weakBehaviorAdoption?: number;
    recentPerformance: string;
    targetRoles: string[];
    industry: string;
  }) => `
Create a 2-minute training topic for today's daily briefing.

Context:
- Industry: ${params.industry}
- Target roles: ${params.targetRoles.join(', ')}
- Recent performance: ${params.recentPerformance}
${params.weakBehavior
  ? `- Weak behavior: ${params.weakBehavior} (${params.weakBehaviorAdoption}% adoption)`
  : ''}

Create a focused training moment that:
- Addresses the most impactful skill gap
- Can be delivered in 2-3 minutes
- Includes a quick practice exercise
- Motivates the team

Return as JSON matching the TrainingTopic schema.
`,

  synthesizeFeedback: (params: {
    feedbackEntries: { challenges: string[]; freeText?: string }[];
    period: string;
  }) => `
Synthesize anonymous team feedback from ${params.period}.

${params.feedbackEntries.length} responses received:
${JSON.stringify(params.feedbackEntries)}

Identify:
1. Main themes (max 5)
2. Sentiment for each theme
3. Suggested actions for management
4. Overall team sentiment
5. Key takeaway for leadership

Be objective. If feedback is critical, don't soften it - leadership needs to know.

Return as JSON matching the FeedbackSynthesis schema.
`,

  generateCoachMessage: (params: {
    userName: string;
    behaviorsToday: number;
    targetBehaviors: number;
    currentRank: number;
    totalStaff: number;
    currentStreak: number;
    avgCheckTrend: 'up' | 'down' | 'flat';
    timeOfShift: 'start' | 'middle' | 'end';
  }) => `
Generate an encouraging AI coach message for ${params.userName}.

Current status:
- Behaviors today: ${params.behaviorsToday} / ${params.targetBehaviors} target
- Rank: #${params.currentRank} of ${params.totalStaff}
- Streak: ${params.currentStreak} days
- Avg check trend: ${params.avgCheckTrend}
- Time of shift: ${params.timeOfShift}

Create a short, personalized message that:
- Acknowledges their current progress
- Motivates without being cheesy
- Provides one actionable tip if appropriate
- Matches the time of shift (start = energize, middle = push, end = celebrate)

Return as JSON matching the AICoachMessage schema.
`,

  generateWeeklyInsights: (params: {
    weekOf: string;
    revenue: number;
    revenueChange: number;
    avgCheck: number;
    avgCheckChange: number;
    totalBehaviors: number;
    adoptionRate: number;
    briefingCompletion: number;
    topPerformers: { name: string; avgCheck: number }[];
    correlationData: { behavior: string; correlation: number }[];
    fraudAlerts: number;
    feedbackThemes: string[];
  }) => `
Generate executive insights for the weekly report.

Week of: ${params.weekOf}

Performance:
- Revenue: $${params.revenue.toLocaleString()} (${params.revenueChange > 0 ? '+' : ''}${params.revenueChange}% WoW)
- Average Check: $${params.avgCheck.toFixed(2)} (${params.avgCheckChange > 0 ? '+' : ''}${params.avgCheckChange}% WoW)
- Behaviors: ${params.totalBehaviors} logged
- Adoption Rate: ${params.adoptionRate}%
- Briefing Completion: ${params.briefingCompletion}%

Top Performers:
${params.topPerformers.map(p => `- ${p.name}: $${p.avgCheck.toFixed(2)} avg check`).join('\n')}

Behavior Correlations:
${params.correlationData.map(c => `- ${c.behavior}: ${c.correlation.toFixed(2)}`).join('\n')}

Alerts: ${params.fraudAlerts} potential issues flagged
Team Feedback Themes: ${params.feedbackThemes.join(', ')}

Create an insightful weekly summary for the business owner:
1. Executive summary (what happened this week)
2. Key highlights (achievements, concerns, opportunities)
3. Behavior analysis (what's working)
4. KPI analysis (business health)
5. Top 3 recommendations with expected impact
6. Look ahead (what to focus on next week)

Return as JSON matching the WeeklyReportInsights schema.
`
};
```

---

## 5. Receipt Processing

### 5.1 Receipt Image Analysis

**Purpose**: Extract data from receipt photos to streamline behavior logging.

**Implementation**:
```typescript
// lib/ai/services/receipt.service.ts
import { generateWithFallback } from '../factory';
import { ReceiptExtractionSchema, type ReceiptExtraction } from '../schemas';
import { SYSTEM_PROMPTS } from '../prompts/system';

interface ReceiptImageInput {
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png';
}

export async function extractReceiptData(
  input: ReceiptImageInput
): Promise<ReceiptExtraction> {
  const prompt = `
Analyze this receipt image and extract the following information:

1. Table number (if visible)
2. Number of covers/guests (if indicated)
3. Total amount (required)
4. Timestamp (if visible)
5. List any food/drink items you can read

Also determine:
- Does the receipt contain wine or alcoholic beverages?
- Does it contain dessert items?
- Does it contain appetizers/starters?

Provide a confidence score (0-1) for your extraction accuracy.

If you cannot read certain fields, omit them from the response.
Return the data as JSON.
`;

  // For models that support vision
  const result = await generateWithFallback({
    prompt,
    systemPrompt: SYSTEM_PROMPTS.general,
    schema: ReceiptExtractionSchema,
    // Image would be included via the provider's vision API
  });

  return result;
}
```

### 5.2 Receipt Validation

```typescript
// lib/ai/services/receipt.service.ts

interface ReceiptValidation {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
}

export function validateReceiptExtraction(
  extraction: ReceiptExtraction,
  loggedBehaviors: string[]
): ReceiptValidation {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check confidence
  if (extraction.confidence < 0.7) {
    warnings.push('Low confidence in receipt reading. Please verify the total amount.');
  }

  // Validate amount
  if (extraction.totalAmount < 5) {
    warnings.push('Total amount seems very low. Please verify.');
  }

  if (extraction.totalAmount > 1000) {
    warnings.push('Total amount seems very high. Please verify.');
  }

  // Suggest behaviors based on items
  if (extraction.containsWine && !loggedBehaviors.includes('wine_pairing')) {
    suggestions.push('Receipt shows wine - did you suggest the wine pairing?');
  }

  if (extraction.containsDessert && !loggedBehaviors.includes('dessert_suggestion')) {
    suggestions.push('Receipt shows dessert - did you suggest it?');
  }

  if (extraction.containsAppetizer && !loggedBehaviors.includes('appetizer_suggestion')) {
    suggestions.push('Receipt shows appetizer - did you suggest it?');
  }

  return {
    isValid: extraction.confidence >= 0.5,
    warnings,
    suggestions
  };
}
```

---

## 6. Insight Generation

### 6.1 Dashboard Insights

```typescript
// lib/ai/services/insight.service.ts
import { generateWithFallback } from '../factory';
import { InsightSchema, type Insight } from '../schemas';

interface DashboardContext {
  revenue: number;
  revenueVsBenchmark: number;
  avgCheck: number;
  avgCheckVsBenchmark: number;
  adoptionRate: number;
  topPerformer: { name: string; metric: number };
  behaviorCorrelations: { behavior: string; correlation: number }[];
  recentAlerts: string[];
}

export async function generateDashboardInsights(
  context: DashboardContext
): Promise<Insight[]> {
  const prompt = `
Based on this business data, generate 3-5 actionable insights:

Revenue: $${context.revenue.toLocaleString()} (${context.revenueVsBenchmark}% vs benchmark)
Average Check: $${context.avgCheck.toFixed(2)} (${context.avgCheckVsBenchmark}% vs benchmark)
Behavior Adoption: ${context.adoptionRate}%
Top Performer: ${context.topPerformer.name} with ${context.topPerformer.metric}

Behavior correlations:
${context.behaviorCorrelations.map(c => `- ${c.behavior}: ${c.correlation.toFixed(2)}`).join('\n')}

Recent alerts: ${context.recentAlerts.join(', ') || 'None'}

Generate insights that:
1. Celebrate wins (if any)
2. Flag concerns (if any)
3. Provide actionable recommendations
4. Are specific to this business's data

Return as JSON array of Insight objects.
`;

  const result = await generateWithFallback({
    prompt,
    systemPrompt: SYSTEM_PROMPTS.analyticsExpert,
    schema: z.array(InsightSchema)
  });

  return result;
}
```

### 6.2 Real-Time Alerts

```typescript
// lib/ai/services/alert.service.ts

interface AlertContext {
  alertType: 'fraud' | 'performance' | 'adoption' | 'budget';
  data: Record<string, unknown>;
}

export async function generateAlertInsight(
  context: AlertContext
): Promise<Insight> {
  const prompts: Record<string, string> = {
    fraud: `
A potential fraud alert was triggered:
${JSON.stringify(context.data, null, 2)}

Analyze this situation and provide:
1. An objective assessment of what the data shows
2. Possible explanations (both innocent and concerning)
3. Recommended investigation steps
4. Priority level

Be fair and objective. Don't assume guilt.
`,
    performance: `
A performance alert was triggered:
${JSON.stringify(context.data, null, 2)}

Provide:
1. What this performance data indicates
2. Potential causes
3. Recommended actions
4. Priority level
`,
    adoption: `
Low adoption rate detected:
${JSON.stringify(context.data, null, 2)}

Analyze:
1. Why adoption might be low
2. Impact on business outcomes
3. Recommendations to improve adoption
4. Priority level
`,
    budget: `
Budget variance alert:
${JSON.stringify(context.data, null, 2)}

Provide:
1. Analysis of the variance
2. Potential causes
3. Recommended corrective actions
4. Priority level
`
  };

  const result = await generateWithFallback({
    prompt: prompts[context.alertType],
    systemPrompt: SYSTEM_PROMPTS.analyticsExpert,
    schema: InsightSchema
  });

  return result;
}
```

---

## 7. Correlation Analysis AI

### 7.1 Interpreting Correlations

```typescript
// lib/ai/services/correlation.service.ts
import { PROMPT_TEMPLATES } from '../prompts/templates';
import { CorrelationAnalysisSchema } from '../schemas';

export async function analyzeCorrelation(
  behaviorId: string,
  behaviorName: string,
  behaviorData: { date: string; count: number }[],
  kpiName: string,
  kpiData: { date: string; value: number }[],
  calculatedCorrelation: number
): Promise<CorrelationAnalysis> {
  const prompt = PROMPT_TEMPLATES.analyzeCorrelation({
    behaviorName,
    behaviorData,
    kpiName,
    kpiData,
    calculatedCorrelation
  });

  const result = await generateWithFallback({
    prompt,
    systemPrompt: SYSTEM_PROMPTS.analyticsExpert,
    schema: CorrelationAnalysisSchema
  });

  // Merge calculated data with AI analysis
  return {
    ...result,
    behaviorId,
    kpiType: kpiName,
    correlation: calculatedCorrelation
  };
}
```

### 7.2 Batch Correlation Analysis

```typescript
// lib/ai/services/correlation.service.ts

interface BatchCorrelationResult {
  analyses: CorrelationAnalysis[];
  summary: string;
  topRecommendation: string;
}

export async function analyzeBatchCorrelations(
  organizationId: string,
  period: { start: Date; end: Date }
): Promise<BatchCorrelationResult> {
  // Get all active behaviors
  const behaviors = await getActiveBehaviors(organizationId);

  // Get primary KPI
  const primaryKpi = await getPrimaryKpi(organizationId);

  const analyses: CorrelationAnalysis[] = [];

  for (const behavior of behaviors) {
    const behaviorData = await getDailyBehaviorCounts(
      organizationId,
      behavior.id,
      period.start,
      period.end
    );

    const kpiData = await getDailyKpiValues(
      organizationId,
      primaryKpi,
      period.start,
      period.end
    );

    // Calculate correlation
    const correlation = calculatePearsonCorrelation(
      behaviorData.map((d, i) => ({
        behaviorCount: d.count,
        kpiValue: kpiData[i]?.value ?? 0
      }))
    );

    // Get AI analysis
    const analysis = await analyzeCorrelation(
      behavior.id,
      behavior.name,
      behaviorData,
      primaryKpi,
      kpiData,
      correlation
    );

    analyses.push(analysis);
  }

  // Sort by correlation strength
  analyses.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  // Generate summary
  const strongPositive = analyses.filter(a => a.correlation > 0.5);
  const strongNegative = analyses.filter(a => a.correlation < -0.5);
  const weak = analyses.filter(a => Math.abs(a.correlation) < 0.3);

  const summary = `
Analysis of ${analyses.length} behaviors against ${primaryKpi}:
- ${strongPositive.length} show strong positive correlation
- ${strongNegative.length} show concerning negative correlation
- ${weak.length} show weak/no correlation

Top performing behavior: ${analyses[0]?.behaviorId ?? 'N/A'}
  `.trim();

  const topRecommendation = strongNegative.length > 0
    ? `Review ${strongNegative[0].behaviorId} - it may be counterproductive`
    : strongPositive.length > 0
    ? `Double down on ${strongPositive[0].behaviorId} - it's clearly working`
    : `Consider redesigning behaviors - current ones show weak impact`;

  return {
    analyses,
    summary,
    topRecommendation
  };
}
```

---

## 8. Recommendation Engine

### 8.1 Behavior Recommendations

```typescript
// lib/ai/services/recommendation.service.ts
import { PROMPT_TEMPLATES } from '../prompts/templates';
import { BehaviorSuggestionSchema } from '../schemas';

export async function suggestBehaviors(
  roleType: string,
  industry: string,
  focusKpis: string[],
  existingBehaviors?: string[]
): Promise<BehaviorSuggestion> {
  const prompt = PROMPT_TEMPLATES.suggestBehaviors({
    roleType,
    industry,
    focusKpis,
    existingBehaviors
  });

  return generateWithFallback({
    prompt,
    systemPrompt: SYSTEM_PROMPTS.behaviorExpert,
    schema: BehaviorSuggestionSchema
  });
}
```

### 8.2 Action Recommendations

```typescript
// lib/ai/services/recommendation.service.ts

interface ActionRecommendation {
  action: string;
  priority: 'high' | 'medium' | 'low';
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
  targetRole: string;
}

const ActionRecommendationSchema = z.object({
  recommendations: z.array(z.object({
    action: z.string().max(200),
    priority: z.enum(['high', 'medium', 'low']),
    expectedImpact: z.string().max(100),
    effort: z.enum(['low', 'medium', 'high']),
    targetRole: z.string()
  })).max(5)
});

export async function generateActionRecommendations(
  context: {
    weeklyData: WeeklyReport;
    correlations: CorrelationAnalysis[];
    feedbackThemes: string[];
  }
): Promise<ActionRecommendation[]> {
  const prompt = `
Based on this week's performance, generate prioritized action recommendations.

Weekly Performance:
- Revenue change: ${context.weeklyData.weekOverWeekRevenueChange}%
- Avg check change: ${context.weeklyData.weekOverWeekAvgCheckChange}%
- Adoption rate: ${context.weeklyData.adoptionRate}%
- Briefing completion: ${context.weeklyData.briefingCompletionRate}%

Behavior Correlations:
${context.correlations.map(c => `- ${c.behaviorId}: ${c.correlation.toFixed(2)} (${c.strength})`).join('\n')}

Team Feedback:
${context.feedbackThemes.join(', ')}

Generate 3-5 specific, actionable recommendations that:
1. Address the biggest opportunities
2. Are realistic to implement
3. Have clear expected outcomes
4. Are assigned to appropriate roles

Prioritize high-impact, low-effort actions first.
`;

  const result = await generateWithFallback({
    prompt,
    systemPrompt: SYSTEM_PROMPTS.analyticsExpert,
    schema: ActionRecommendationSchema
  });

  return result.recommendations;
}
```

---

## 9. Training Topic Generation

### 9.1 Daily Training Topics

```typescript
// lib/ai/services/training.service.ts
import { PROMPT_TEMPLATES } from '../prompts/templates';
import { TrainingTopicSchema } from '../schemas';

export async function generateDailyTrainingTopic(
  organizationId: string
): Promise<TrainingTopic> {
  // Get context
  const weakBehavior = await getLowestAdoptionBehavior(organizationId);
  const recentPerformance = await getPerformanceSummary(organizationId, 7);
  const roles = await getActiveRoles(organizationId);
  const org = await getOrganization(organizationId);

  const prompt = PROMPT_TEMPLATES.generateTrainingTopic({
    weakBehavior: weakBehavior?.name,
    weakBehaviorAdoption: weakBehavior?.adoptionRate,
    recentPerformance,
    targetRoles: roles.map(r => r.type),
    industry: org.industry
  });

  return generateWithFallback({
    prompt,
    systemPrompt: SYSTEM_PROMPTS.trainingExpert,
    schema: TrainingTopicSchema
  });
}
```

### 9.2 Training Content Library

```typescript
// lib/ai/services/training.service.ts

interface TrainingLibraryEntry {
  id: string;
  topic: TrainingTopic;
  generatedAt: Date;
  usageCount: number;
  effectiveness?: number; // Based on follow-up performance
}

export async function buildTrainingLibrary(
  organizationId: string,
  count: number = 20
): Promise<TrainingLibraryEntry[]> {
  const library: TrainingLibraryEntry[] = [];
  const behaviors = await getActiveBehaviors(organizationId);
  const org = await getOrganization(organizationId);

  // Generate topics for each behavior
  for (const behavior of behaviors) {
    const topic = await generateWithFallback({
      prompt: `
Create a training topic specifically for improving "${behavior.name}".

Behavior description: ${behavior.description}
Target: ${behavior.targetPerDay} per shift
Industry: ${org.industry}

The training should:
1. Explain WHY this behavior matters
2. Show HOW to do it effectively
3. Include example scripts/words
4. Have a quick practice exercise

Make it engaging and actionable.
`,
      systemPrompt: SYSTEM_PROMPTS.trainingExpert,
      schema: TrainingTopicSchema
    });

    library.push({
      id: `training_${behavior.id}`,
      topic,
      generatedAt: new Date(),
      usageCount: 0
    });
  }

  return library;
}
```

---

## 10. Feedback Synthesis

### 10.1 Weekly Feedback Analysis

```typescript
// lib/ai/services/feedback.service.ts
import { PROMPT_TEMPLATES } from '../prompts/templates';
import { FeedbackSynthesisSchema } from '../schemas';

export async function synthesizeWeeklyFeedback(
  organizationId: string,
  weekStart: Date
): Promise<FeedbackSynthesis> {
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const feedback = await getAnonymousFeedback(organizationId, weekStart, weekEnd);

  if (feedback.length === 0) {
    return {
      totalResponses: 0,
      themes: [],
      overallSentiment: 'neutral',
      keyTakeaway: 'No feedback received this week. Consider encouraging team to share their input.'
    };
  }

  const prompt = PROMPT_TEMPLATES.synthesizeFeedback({
    feedbackEntries: feedback.map(f => ({
      challenges: f.challenges,
      freeText: f.freeformText
    })),
    period: `week of ${weekStart.toISOString().split('T')[0]}`
  });

  return generateWithFallback({
    prompt,
    systemPrompt: SYSTEM_PROMPTS.analyticsExpert,
    schema: FeedbackSynthesisSchema
  });
}
```

---

## 11. AI Coach System

### 11.1 Real-Time Coaching Messages

```typescript
// lib/ai/services/coach.service.ts
import { PROMPT_TEMPLATES } from '../prompts/templates';
import { AICoachMessageSchema } from '../schemas';

export async function generateCoachMessage(
  userId: string
): Promise<AICoachMessage> {
  const user = await getUser(userId);
  const stats = await getUserDailyStats(userId);
  const target = await getUserBehaviorTarget(userId);
  const rank = await getUserRank(userId);
  const totalStaff = await getActiveStaffCount(user.organizationId);
  const streak = await getUserStreak(userId);
  const avgCheckTrend = await getUserAvgCheckTrend(userId);
  const timeOfShift = determineShiftTime();

  const prompt = PROMPT_TEMPLATES.generateCoachMessage({
    userName: user.name,
    behaviorsToday: stats.behaviorCount,
    targetBehaviors: target,
    currentRank: rank,
    totalStaff,
    currentStreak: streak,
    avgCheckTrend,
    timeOfShift
  });

  return generateWithFallback({
    prompt,
    systemPrompt: SYSTEM_PROMPTS.coachPersonality,
    schema: AICoachMessageSchema
  });
}

function determineShiftTime(): 'start' | 'middle' | 'end' {
  const hour = new Date().getHours();
  // Assuming typical restaurant shifts
  if (hour < 14) return 'start';
  if (hour < 20) return 'middle';
  return 'end';
}
```

### 11.2 Contextual Tips

```typescript
// lib/ai/services/coach.service.ts

interface ContextualTip {
  tip: string;
  context: string;
  relevantBehavior?: string;
}

export async function generateContextualTip(
  userId: string,
  context: 'slow_period' | 'busy_period' | 'low_performance' | 'high_performance'
): Promise<ContextualTip> {
  const user = await getUser(userId);
  const behaviors = await getUserBehaviors(userId);

  const prompts: Record<string, string> = {
    slow_period: `
Generate a tip for ${user.name} during a slow period.
Their behaviors: ${behaviors.map(b => b.name).join(', ')}
Suggest how to use downtime productively.
`,
    busy_period: `
Generate a quick tip for ${user.name} during a busy period.
Help them stay focused on high-value behaviors even when rushed.
`,
    low_performance: `
Generate an encouraging tip for ${user.name} who is struggling today.
Don't be preachy - offer practical help.
`,
    high_performance: `
Generate a celebratory tip for ${user.name} who is crushing it today!
Acknowledge their success and suggest how to maintain momentum.
`
  };

  const TipSchema = z.object({
    tip: z.string().max(150),
    context: z.string().max(50),
    relevantBehavior: z.string().optional()
  });

  return generateWithFallback({
    prompt: prompts[context],
    systemPrompt: SYSTEM_PROMPTS.coachPersonality,
    schema: TipSchema
  });
}
```

---

## 12. Error Handling & Fallbacks

### 12.1 Error Types

```typescript
// lib/ai/errors.ts
export class AIError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'AIError';
  }
}

export class AIValidationError extends AIError {
  constructor(
    message: string,
    public readonly zodError: z.ZodError
  ) {
    super(message);
    this.name = 'AIValidationError';
  }
}

export class AIRateLimitError extends AIError {
  constructor(
    public readonly retryAfter: number
  ) {
    super(`Rate limited. Retry after ${retryAfter}ms`);
    this.name = 'AIRateLimitError';
  }
}

export class AITimeoutError extends AIError {
  constructor() {
    super('AI request timed out');
    this.name = 'AITimeoutError';
  }
}
```

### 12.2 Fallback Responses

```typescript
// lib/ai/fallbacks.ts

export const FALLBACK_RESPONSES = {
  insight: {
    type: 'info' as const,
    title: 'Analysis Temporarily Unavailable',
    description: 'We\'re unable to generate AI insights right now. Check back soon.',
    recommendations: ['Continue logging behaviors', 'Review manual reports'],
    priority: 'low' as const
  },

  coachMessage: {
    message: 'Keep up the great work! Every behavior counts.',
    tone: 'encouraging' as const
  },

  trainingTopic: {
    title: 'Service Excellence Basics',
    description: 'Review the fundamentals of great service.',
    keyPoints: [
      'Greet every guest warmly',
      'Make one suggestion per table',
      'Thank guests and invite them back'
    ],
    duration: 2,
    targetRoles: ['SERVER', 'BARTENDER']
  },

  feedbackSynthesis: {
    totalResponses: 0,
    themes: [],
    overallSentiment: 'neutral' as const,
    keyTakeaway: 'Unable to analyze feedback at this time.'
  },

  receiptExtraction: {
    totalAmount: 0,
    confidence: 0,
    containsWine: false,
    containsDessert: false,
    containsAppetizer: false
  }
};

export function getFallbackResponse<T extends keyof typeof FALLBACK_RESPONSES>(
  type: T
): typeof FALLBACK_RESPONSES[T] {
  return FALLBACK_RESPONSES[type];
}
```

### 12.3 Retry Logic

```typescript
// lib/ai/retry.ts

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (error instanceof AIRateLimitError) {
        await sleep(error.retryAfter);
        continue;
      }

      if (error instanceof AIValidationError) {
        // Don't retry validation errors
        throw error;
      }

      // Exponential backoff
      const delay = Math.min(
        options.baseDelay * Math.pow(2, attempt),
        options.maxDelay
      );
      await sleep(delay);
    }
  }

  throw lastError ?? new AIError('Max retries exceeded');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## Summary

The AI Operations layer provides:

| Capability | Implementation |
|------------|----------------|
| **Provider Abstraction** | Switch between OpenAI, OpenRouter, Anthropic |
| **Structured Outputs** | Zod schemas for all AI responses |
| **Receipt Processing** | Vision API for receipt scanning |
| **Insight Generation** | Dashboard and alert-based insights |
| **Correlation Analysis** | AI interpretation of statistical data |
| **Recommendations** | Behavior and action suggestions |
| **Training Topics** | Daily briefing content generation |
| **Feedback Synthesis** | Anonymous feedback analysis |
| **AI Coach** | Real-time motivational messages |
| **Error Handling** | Fallbacks, retries, validation |

All AI responses are validated against Zod schemas to ensure predictable, type-safe outputs that the application can rely on.

---

*This document is part of the Topline documentation suite. See [00-INDEX.md](./00-INDEX.md) for the complete list.*
