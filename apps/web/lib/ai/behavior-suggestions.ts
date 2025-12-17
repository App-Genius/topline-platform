/**
 * AI Behavior Suggestions with Audit Trail
 *
 * Uses OpenRouter to generate role-specific behavior suggestions
 * with complete reasoning chain for manager review.
 */

import { z } from 'zod';
import { generateStructured, generateWithRetry } from './client';
import { MODELS } from './config';
import { judgeBehaviorSuggestions, runBehaviorAssertions, logQualityResult } from './quality';

// ============================================
// SCHEMAS
// ============================================

// Schema for a single behavior suggestion with full audit trail
export const behaviorSuggestionSchema = z.object({
  name: z.string().max(50).describe('Short, action-oriented name for the behavior'),
  description: z.string().max(200).describe('Brief description of what the behavior entails'),
  category: z.enum(['REVENUE', 'COST', 'QUALITY', 'EFFICIENCY']).describe('Category of impact'),
  suggestedPoints: z.number().int().min(1).max(20).describe('Suggested point value (1-20)'),
  suggestedTarget: z.number().int().min(1).max(50).describe('Suggested daily target'),
  rationale: z.string().max(300).describe('Why this behavior is valuable'),
  // Audit fields
  expectedOutcome: z.string().max(200).describe('Expected business outcome if behavior is adopted'),
  kpiImpact: z.string().max(100).describe('Which KPI this primarily affects and how'),
  script: z.string().max(300).optional().describe('Example words staff can use'),
});

export type BehaviorSuggestion = z.infer<typeof behaviorSuggestionSchema>;

// Schema for the complete response with reasoning chain
export const behaviorSuggestionsResponseSchema = z.object({
  // Analysis phase - shows AI reasoning
  analysis: z.object({
    roleUnderstanding: z.string().max(300).describe('How AI understands this role'),
    industryContext: z.string().max(300).describe('Industry-specific considerations'),
    kpiFocus: z.string().max(300).describe('How the focus KPIs inform suggestions'),
    gaps: z.string().max(300).optional().describe('Gaps in existing behaviors identified'),
  }),
  // The actual suggestions
  behaviors: z.array(behaviorSuggestionSchema).max(5),
  // Summary reasoning
  overallRationale: z.string().max(500).describe('Overall reasoning for the set of behaviors'),
  confidenceLevel: z.enum(['high', 'medium', 'low']).describe('AI confidence in these suggestions'),
  caveats: z.array(z.string()).max(3).optional().describe('Any caveats or considerations'),
});

export type BehaviorSuggestionsResponse = z.infer<typeof behaviorSuggestionsResponseSchema>;

// Simplified response for quick suggestions
export const quickSuggestionResponseSchema = z.object({
  suggestion: z.string().max(200),
});

// ============================================
// INDUSTRY CONTEXT
// ============================================

const INDUSTRY_CONTEXTS: Record<string, string> = {
  HOSPITALITY: `This is a hotel operation. Key revenue drivers include:
- Room upgrades and upsells (suite upgrades, late checkout, early check-in)
- F&B revenue (restaurant, bar, room service, minibar)
- Ancillary services (spa, parking, experiences)
- Guest satisfaction leads to repeat bookings and positive reviews

Focus areas: Guest experience from arrival to departure, capturing every revenue opportunity while maintaining service quality.`,

  RESTAURANT: `This is a restaurant operation. Key revenue drivers include:
- Check size through upselling (appetizers, sides, desserts, beverages)
- Wine and alcohol sales (highest margin items)
- Turn times (covers per shift)
- Guest experience leading to return visits and reviews

Focus areas: Every table interaction is an opportunity. Balance sales with hospitality.`,

  RETAIL: `This is a retail operation. Key revenue drivers include:
- Units per transaction (suggestive selling, add-ons)
- Premium product recommendations
- Loyalty program enrollment
- Service that drives repeat visits

Focus areas: Product knowledge, personalized recommendations, creating relationships.`,

  OTHER: `This is a service business. Focus on:
- Customer satisfaction and retention
- Service efficiency
- Value-added recommendations
- Building customer relationships`,
};

// ============================================
// ROLE CONTEXT
// ============================================

const ROLE_CONTEXTS: Record<string, string> = {
  FRONT_DESK: `Front Desk Agents are the first and last impression. They:
- Handle check-in/check-out (upsell opportunities: upgrades, packages)
- Manage guest requests and inquiries
- Can recommend hotel amenities (restaurant, spa, bar)
- Have significant impact on guest satisfaction scores`,

  HOUSEKEEPING: `Housekeeping maintains room quality and guest comfort. They:
- Inspect rooms and report issues
- Manage amenity restocking
- Can identify maintenance needs early
- Contribute to guest satisfaction through room quality`,

  SERVER: `Servers directly influence check averages. They:
- Present menus and make recommendations
- Upsell through suggestive selling (appetizers, wine, dessert)
- Manage the dining experience pacing
- Create memorable moments that drive reviews`,

  BARTENDER: `Bartenders are revenue-drivers and entertainers. They:
- Recommend premium spirits and cocktails
- Create drink experiences
- Upsell through premium pours
- Build regular clientele`,

  HOST: `Hosts manage the front-of-house experience. They:
- Create first impressions
- Manage wait times and expectations
- Can pre-sell specials or experiences
- Set the tone for the meal`,

  BUSSER: `Bussers ensure smooth table turnover. They:
- Maintain table cleanliness
- Support server efficiency
- Impact turn times directly
- Enable better service through support`,

  CHEF: `Kitchen team manages food quality and costs. They:
- Control portion consistency
- Manage food waste
- Communicate 86'd items
- Maintain food quality standards`,

  PURCHASER: `Purchasers control input costs. They:
- Negotiate vendor pricing
- Monitor cost of sales
- Audit invoices
- Manage inventory levels`,

  MANAGER: `Managers oversee team performance. They:
- Coach and develop staff
- Verify behavior adoption
- Manage shift operations
- Drive accountability`,

  ADMIN: `Administrators set strategy. They:
- Define organizational goals
- Monitor business performance
- Make strategic decisions
- Ensure system effectiveness`,
};

// ============================================
// MAIN GENERATION FUNCTION
// ============================================

/**
 * Generate behavior suggestions for a specific role and industry
 * Returns full audit trail for manager review
 */
export async function generateBehaviorSuggestions(params: {
  role: string;
  industry: string;
  existingBehaviors: string[];
  focusKpis?: string[];
  businessContext?: string;
  count?: number;
}): Promise<BehaviorSuggestionsResponse> {
  const { role, industry, existingBehaviors, focusKpis = [], businessContext, count = 3 } = params;

  const industryContext = INDUSTRY_CONTEXTS[industry] || INDUSTRY_CONTEXTS.OTHER;
  const roleContext = ROLE_CONTEXTS[role] || `This role focuses on daily operations and customer interaction.`;

  const existingList = existingBehaviors.length > 0
    ? `Currently tracked behaviors: ${existingBehaviors.join(', ')}`
    : 'No behaviors are currently tracked for this role.';

  const focusKpiText = focusKpis.length > 0
    ? `Priority KPIs to improve: ${focusKpis.join(', ')}`
    : 'Focus on general revenue and quality improvement.';

  const systemPrompt = `You are an expert hospitality and business operations consultant specializing in the 4DX framework (Four Disciplines of Execution).

Your expertise is in designing LEAD MEASURES - specific, measurable behaviors that team members can track daily, which drive LAG MEASURES (business outcomes like revenue, ratings, etc).

Core Principles:
1. Behaviors must be SPECIFIC and ACTIONABLE (not vague like "be friendly")
2. Behaviors must be MEASURABLE (can count occurrences)
3. Behaviors must be WITHIN STAFF CONTROL (not dependent on customer decisions)
4. Behaviors should have CLEAR IMPACT on business outcomes
5. Each behavior needs a compelling RATIONALE that managers can share with staff

You must explain your reasoning thoroughly so managers can understand and defend why each behavior was suggested.`;

  const prompt = `I need behavior suggestions for a ${role} role in a ${industry} business.

## Industry Context
${industryContext}

## Role Context
${roleContext}

## Current Situation
${existingList}
${focusKpiText}
${businessContext ? `Additional context: ${businessContext}` : ''}

## Task
Generate ${count} NEW behaviors that this role should track daily.

For EACH behavior, I need you to:
1. Name it clearly (action-oriented, like "Offer appetizer" not "Be better at selling")
2. Describe exactly what the staff member should do
3. Categorize the impact (REVENUE, COST, QUALITY, EFFICIENCY)
4. Suggest reasonable points (1-20 based on difficulty and impact)
5. Suggest a daily target (realistic for an 8-hour shift)
6. Explain your rationale (WHY this behavior matters for the business)
7. Describe the expected outcome if this is adopted
8. Specify which KPI this impacts and how
9. Optionally provide a script (natural words the staff can use)

CRITICAL: Your response must include your ANALYSIS showing:
- How you understand this role's opportunities
- What industry-specific factors you considered
- How the focus KPIs informed your choices
- What gaps exist in current behaviors

This analysis is essential because managers will review it to understand your recommendations.

Respond with valid JSON matching the specified schema.`;

  try {
    const response = await generateWithRetry(
      () =>
        generateStructured<BehaviorSuggestionsResponse>(prompt, {
          model: MODELS.BALANCED,
          systemPrompt,
          temperature: 0.7,
        }),
      3
    );

    // Validate response
    const parsed = behaviorSuggestionsResponseSchema.safeParse(response);

    if (!parsed.success) {
      console.error('AI response validation failed:', parsed.error);
      throw new Error('Invalid AI response format');
    }

    // Run quality assertions
    const assertions = runBehaviorAssertions(parsed.data.behaviors);
    if (!assertions.passed) {
      console.warn('Behavior assertions failed:', assertions.errors);
      // Don't throw - log and continue, let LLM-as-Judge evaluate
    }

    // Optional: Run LLM-as-Judge for quality (can be toggled in config)
    const judgeResult = await judgeBehaviorSuggestions(
      { role, industry, existingBehaviors },
      parsed.data.behaviors
    );

    // Log quality result for monitoring
    logQualityResult('behavior_suggestion', params, judgeResult, MODELS.BALANCED);

    // If judge rejected behaviors, filter them out
    if (judgeResult.rejectedBehaviors.length > 0) {
      console.warn(`Judge rejected ${judgeResult.rejectedBehaviors.length} behaviors`);
      parsed.data.behaviors = parsed.data.behaviors.filter(
        (_, i) => !judgeResult.rejectedBehaviors.includes(i)
      );
    }

    return parsed.data;
  } catch (error) {
    console.error('Failed to generate behavior suggestions:', error);
    throw error;
  }
}

// ============================================
// SIMPLIFIED SUGGESTION (for quick use)
// ============================================

/**
 * Generate a single quick suggestion for a specific scenario
 */
export async function generateQuickSuggestion(params: {
  context: string;
  role: string;
}): Promise<string> {
  const prompt = `Based on the following context, suggest ONE specific behavior that a ${params.role} could track:

Context: ${params.context}

Respond with just the behavior name and a one-sentence description.`;

  const response = await generateWithRetry(
    () =>
      generateStructured<{ suggestion: string }>(prompt, {
        model: MODELS.FAST,
        temperature: 0.5,
      }),
    2
  );

  return response.suggestion;
}

// ============================================
// AUDIT HELPERS
// ============================================

/**
 * Format the AI reasoning for display to managers
 */
export function formatAuditTrail(response: BehaviorSuggestionsResponse): string {
  const sections = [
    '## AI Analysis',
    '',
    '### Role Understanding',
    response.analysis.roleUnderstanding,
    '',
    '### Industry Context',
    response.analysis.industryContext,
    '',
    '### KPI Focus',
    response.analysis.kpiFocus,
    '',
  ];

  if (response.analysis.gaps) {
    sections.push('### Identified Gaps', response.analysis.gaps, '');
  }

  sections.push('## Overall Rationale', response.overallRationale, '');
  sections.push(`**Confidence Level:** ${response.confidenceLevel}`, '');

  if (response.caveats && response.caveats.length > 0) {
    sections.push('### Caveats', ...response.caveats.map(c => `- ${c}`), '');
  }

  sections.push('## Suggested Behaviors', '');

  response.behaviors.forEach((b, i) => {
    sections.push(`### ${i + 1}. ${b.name}`);
    sections.push(`**Description:** ${b.description}`);
    sections.push(`**Category:** ${b.category}`);
    sections.push(`**Points:** ${b.suggestedPoints} | **Target:** ${b.suggestedTarget}/day`);
    sections.push(`**Rationale:** ${b.rationale}`);
    sections.push(`**Expected Outcome:** ${b.expectedOutcome}`);
    sections.push(`**KPI Impact:** ${b.kpiImpact}`);
    if (b.script) {
      sections.push(`**Example Script:** "${b.script}"`);
    }
    sections.push('');
  });

  return sections.join('\n');
}

/**
 * Get just the behavior suggestions without analysis (for API responses)
 */
export function extractBehaviors(response: BehaviorSuggestionsResponse): BehaviorSuggestion[] {
  return response.behaviors;
}
