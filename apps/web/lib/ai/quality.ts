/**
 * AI Quality Assurance - LLM-as-Judge Pattern
 *
 * Uses a second LLM call to evaluate quality of AI outputs.
 * This helps catch low-quality suggestions before they reach users.
 */

import { z } from 'zod';
import { generateStructured } from './client';
import { MODELS, QUALITY_CONFIG } from './config';
import type { BehaviorSuggestion } from './behavior-suggestions';

// ============================================
// JUDGE RESULT SCHEMA
// ============================================

export const JudgeResultSchema = z.object({
  score: z.number().min(0).max(100),
  passed: z.boolean(),
  feedback: z.string().max(500),
  suggestions: z.array(z.string()).max(3),
  issues: z.array(z.object({
    severity: z.enum(['error', 'warning', 'info']),
    message: z.string(),
    field: z.string().optional(),
  })).optional(),
});

export type JudgeResult = z.infer<typeof JudgeResultSchema>;

// ============================================
// QUALITY CRITERIA BY OPERATION
// ============================================

const QUALITY_CRITERIA: Record<string, string[]> = {
  behavior_suggestion: [
    'Behaviors are specific and actionable (not vague like "be friendly")',
    'Each behavior can be counted/measured (e.g., "times suggested dessert")',
    'Behaviors are within staff control (not dependent on customer decisions)',
    'Points and targets are realistic for a typical shift',
    'Behaviors clearly link to the specified business outcome (revenue, quality, etc.)',
    'No duplicate or overlapping behaviors',
    'Scripts (if provided) sound natural, not robotic',
    'Rationale explains WHY this behavior matters for the business',
  ],
  insight_generation: [
    'Insight is specific to the provided data, not generic',
    'Recommendations are actionable (clear next steps)',
    'Metrics are correctly interpreted (up is good for revenue, etc.)',
    'Priority rating matches the severity of the issue',
    'Language is clear and jargon-free',
  ],
};

// ============================================
// LLM-AS-JUDGE FUNCTION
// ============================================

/**
 * Evaluate the quality of an AI output using a second LLM call
 */
export async function judgeOutput<T>(
  operation: string,
  input: unknown,
  output: T,
  customCriteria?: string[]
): Promise<JudgeResult> {
  if (!QUALITY_CONFIG.judge.enabled) {
    // Quality judging disabled - return passing result
    return {
      score: 100,
      passed: true,
      feedback: 'Quality judging disabled',
      suggestions: [],
    };
  }

  const criteria = customCriteria || QUALITY_CRITERIA[operation] || [
    'Output is relevant to the input',
    'Output follows the expected format',
    'Output is clear and understandable',
  ];

  const systemPrompt = `You are a strict quality evaluator for AI-generated outputs.
Your job is to ensure AI outputs meet high quality standards before they reach users.

Be objective and fair. Score based on the criteria provided, not personal preferences.
If there are issues, explain them clearly so they can be fixed.`;

  const prompt = `Evaluate the quality of this AI output.

OPERATION: ${operation}

INPUT PROVIDED TO AI:
${JSON.stringify(input, null, 2)}

AI OUTPUT TO EVALUATE:
${JSON.stringify(output, null, 2)}

EVALUATION CRITERIA:
${criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Score the output from 0-100 based on how well it meets ALL criteria.
- 90-100: Excellent, ready for production
- 70-89: Good, minor improvements possible
- 50-69: Acceptable, some issues to address
- Below 50: Poor, needs significant improvement

Respond with:
{
  "score": <0-100>,
  "passed": <true if score >= ${QUALITY_CONFIG.judge.minScoreThreshold}>,
  "feedback": "<concise explanation of the score>",
  "suggestions": ["<specific improvement 1>", "<specific improvement 2>"],
  "issues": [
    {"severity": "error|warning|info", "message": "<issue description>", "field": "<optional field name>"}
  ]
}`;

  try {
    const result = await generateStructured<JudgeResult>(prompt, {
      model: MODELS.JUDGE,
      systemPrompt,
      temperature: 0.3, // Low temp for consistent evaluation
    });

    // Ensure passed field matches threshold
    return {
      ...result,
      passed: result.score >= QUALITY_CONFIG.judge.minScoreThreshold,
    };
  } catch (error) {
    console.error('LLM-as-Judge evaluation failed:', error);
    // On failure, allow the output through but log the issue
    return {
      score: 0,
      passed: true, // Don't block on judge failure
      feedback: 'Judge evaluation failed - output allowed through',
      suggestions: [],
    };
  }
}

// ============================================
// SPECIALIZED JUDGES
// ============================================

/**
 * Judge behavior suggestions specifically
 */
export async function judgeBehaviorSuggestions(
  input: { role: string; industry: string; existingBehaviors: string[] },
  suggestions: BehaviorSuggestion[]
): Promise<JudgeResult & { rejectedBehaviors: number[] }> {
  const baseResult = await judgeOutput('behavior_suggestion', input, suggestions);

  // Additional specific checks for behavior suggestions
  const rejectedBehaviors: number[] = [];

  suggestions.forEach((behavior, index) => {
    // Check for common issues
    const issues: string[] = [];

    // Too vague
    if (behavior.name.length < 10 || !behavior.name.includes(' ')) {
      issues.push('Name too short or vague');
    }

    // Target too high
    if (behavior.suggestedTarget > 30) {
      issues.push('Target seems unrealistically high');
    }

    // Points don't match category
    if (behavior.category === 'REVENUE' && behavior.suggestedPoints < 5) {
      issues.push('Revenue-driving behaviors should typically have higher points');
    }

    // Rationale too short
    if (behavior.rationale.length < 30) {
      issues.push('Rationale is too brief');
    }

    if (issues.length >= 2) {
      rejectedBehaviors.push(index);
    }
  });

  return {
    ...baseResult,
    rejectedBehaviors,
  };
}

// ============================================
// QUALITY ASSERTIONS
// ============================================

export interface AssertionResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Run quick programmatic quality checks (no LLM required)
 */
export function runBehaviorAssertions(
  suggestions: BehaviorSuggestion[]
): AssertionResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check minimum count
  if (suggestions.length < 3) {
    errors.push('Must suggest at least 3 behaviors');
  }

  // Check for duplicates
  const names = suggestions.map(s => s.name.toLowerCase());
  const uniqueNames = new Set(names);
  if (names.length !== uniqueNames.size) {
    errors.push('Duplicate behavior names detected');
  }

  // Check each suggestion
  suggestions.forEach((s, i) => {
    if (s.suggestedTarget > 50) {
      errors.push(`Behavior ${i + 1}: Target ${s.suggestedTarget}/day is unrealistic`);
    }

    if (s.suggestedPoints > 20) {
      warnings.push(`Behavior ${i + 1}: Points ${s.suggestedPoints} seems high`);
    }

    if (s.description.length > 200) {
      warnings.push(`Behavior ${i + 1}: Description is too long`);
    }

    if (s.rationale.length < 20) {
      warnings.push(`Behavior ${i + 1}: Rationale is too short`);
    }
  });

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================
// QUALITY LOGGING
// ============================================

export interface QualityLog {
  timestamp: Date;
  operation: string;
  inputHash: string;
  judgeScore: number;
  passed: boolean;
  issues: string[];
  model: string;
}

const qualityLogs: QualityLog[] = [];

/**
 * Log a quality evaluation result for analysis
 */
export function logQualityResult(
  operation: string,
  input: unknown,
  result: JudgeResult,
  model: string
): void {
  const log: QualityLog = {
    timestamp: new Date(),
    operation,
    inputHash: hashInput(input),
    judgeScore: result.score,
    passed: result.passed,
    issues: result.issues?.map(i => i.message) || [],
    model,
  };

  qualityLogs.push(log);

  // Keep only last 1000 logs in memory
  if (qualityLogs.length > 1000) {
    qualityLogs.shift();
  }

  // Log low scores for monitoring
  if (result.score < QUALITY_CONFIG.judge.minScoreThreshold) {
    console.warn(`[AI Quality] Low score for ${operation}:`, {
      score: result.score,
      feedback: result.feedback,
      issues: result.issues,
    });
  }
}

/**
 * Get quality metrics for an operation
 */
export function getQualityMetrics(operation: string, since?: Date): {
  avgScore: number;
  passRate: number;
  totalEvaluations: number;
  commonIssues: string[];
} {
  const logs = since
    ? qualityLogs.filter(l => l.operation === operation && l.timestamp >= since)
    : qualityLogs.filter(l => l.operation === operation);

  if (logs.length === 0) {
    return {
      avgScore: 0,
      passRate: 0,
      totalEvaluations: 0,
      commonIssues: [],
    };
  }

  const avgScore = logs.reduce((sum, l) => sum + l.judgeScore, 0) / logs.length;
  const passRate = logs.filter(l => l.passed).length / logs.length;

  // Find common issues
  const issueCounts = new Map<string, number>();
  logs.forEach(l => {
    l.issues.forEach(issue => {
      issueCounts.set(issue, (issueCounts.get(issue) || 0) + 1);
    });
  });

  const commonIssues = Array.from(issueCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([issue]) => issue);

  return {
    avgScore: Math.round(avgScore * 10) / 10,
    passRate: Math.round(passRate * 1000) / 10,
    totalEvaluations: logs.length,
    commonIssues,
  };
}

// Simple hash function for deduplication
function hashInput(input: unknown): string {
  const str = JSON.stringify(input);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}
