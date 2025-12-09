# Topline: Behavior Templates Library

## Overview

This document provides comprehensive behavior templates for different roles and industries. These templates serve as starting points for organizations to customize based on their specific needs.

---

## Table of Contents

1. [Template Structure](#1-template-structure)
2. [AI-Driven Template Generation](#2-ai-driven-template-generation)
3. [Restaurant Templates](#3-restaurant-templates)
4. [Retail Templates](#4-retail-templates)
5. [Hospitality Templates](#5-hospitality-templates)
6. [Back Office Templates](#6-back-office-templates)
7. [Custom Template Creation](#7-custom-template-creation)

---

## 1. Template Structure

### 1.1 Behavior Template Schema

```typescript
interface BehaviorTemplate {
  id: string
  name: string
  description: string
  category: 'REVENUE' | 'COST_CONTROL' | 'QUALITY' | 'COMPLIANCE'
  frequency: 'PER_SHIFT' | 'PER_DAY' | 'PER_WEEK' | 'PER_MONTH'
  defaultTarget: number
  defaultPoints: number
  applicableRoles: RoleType[]
  applicableIndustries: Industry[]
  kpiImpact: KpiType[]
  examples: string[]
  tips: string[]
}
```

### 1.2 Category Definitions

| Category | Purpose | KPI Impact |
|----------|---------|------------|
| **REVENUE** | Increase sales | Average Check, Revenue |
| **COST_CONTROL** | Reduce costs | CoS%, GOP, Utilities |
| **QUALITY** | Improve experience | Rating, Reviews |
| **COMPLIANCE** | Follow procedures | Safety, Consistency |

---

## 2. AI-Driven Template Generation

### 2.1 Dynamic Scaffolding Philosophy

The behavior templates in this document serve as **examples and training data** for our AI system. In production, the AI **generates custom behaviors** for each business based on:

- Industry type and sub-type
- Business size and structure
- Role definitions specific to the organization
- Focus KPIs and business objectives
- Regional/cultural considerations
- Historical performance data (if available)

### 2.2 Generation Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              AI BEHAVIOR GENERATION PIPELINE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  INPUT                                                           │
│  ├── Business Description: "Boutique hotel with spa and          │
│  │    fine dining restaurant, 45 rooms, mid-luxury segment"      │
│  ├── Role: "Spa Therapist"                                       │
│  └── Focus KPIs: [Revenue Per Treatment, Rebooking Rate]         │
│                                                                  │
│  CONTEXT RETRIEVAL                                               │
│  ├── Similar industry templates (Hospitality + Spa)              │
│  ├── Role-type mappings (Service + Upsell)                       │
│  └── KPI correlation data from similar businesses                │
│                                                                  │
│  GENERATION                                                      │
│  ├── Generate 5-7 candidate behaviors                            │
│  ├── Calculate realistic targets based on role                   │
│  ├── Create industry-appropriate scripts                         │
│  └── Map expected KPI impacts                                    │
│                                                                  │
│  QUALITY ASSURANCE                                               │
│  ├── Schema validation (Zod)                                     │
│  ├── Quality assertions                                          │
│  └── LLM-as-Judge evaluation                                     │
│                                                                  │
│  OUTPUT                                                          │
│  └── Custom BehaviorTemplate[] for this specific role            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Generation Implementation

```typescript
// lib/ai/modules/behavior-generation.ts
import { z } from 'zod';
import { AIModule } from './base';

const BehaviorGenerationInputSchema = z.object({
  businessDescription: z.string(),
  industry: z.string(),
  industrySubtype: z.string().optional(),
  roleName: z.string(),
  roleType: z.enum([
    'REVENUE_GENERATING',
    'COST_CONTROLLING',
    'QUALITY_FOCUSED',
    'COMPLIANCE_FOCUSED',
    'PRODUCTIVITY_FOCUSED'
  ]),
  focusKpis: z.array(z.string()),
  shiftLength: z.number().optional(),
  averageCustomerInteractions: z.number().optional(),
  existingBehaviors: z.array(z.string()).optional()
});

const GeneratedBehaviorSchema = z.object({
  name: z.string().max(50),
  description: z.string().max(200),
  category: z.enum(['REVENUE', 'COST_CONTROL', 'QUALITY', 'COMPLIANCE']),
  frequency: z.enum(['PER_SHIFT', 'PER_DAY', 'PER_WEEK', 'PER_MONTH']),
  defaultTarget: z.number().min(1),
  defaultPoints: z.number().min(1).max(10),
  kpiImpact: z.array(z.string()),
  examples: z.array(z.string()).min(2).max(4),
  tips: z.array(z.string()).min(2).max(4),
  script: z.string().optional(),
  rationale: z.string().max(200)
});

export class BehaviorGenerationModule extends AIModule<
  z.infer<typeof BehaviorGenerationInputSchema>,
  { behaviors: z.infer<typeof GeneratedBehaviorSchema>[] }
> {
  protected buildPrompt(input: BehaviorGenerationInput): string {
    return `
You are an expert in designing measurable workplace behaviors that drive KPI improvements.

BUSINESS CONTEXT:
- Description: ${input.businessDescription}
- Industry: ${input.industry}${input.industrySubtype ? ` (${input.industrySubtype})` : ''}
- Role: ${input.roleName}
- Role Type: ${input.roleType}
- Focus KPIs: ${input.focusKpis.join(', ')}
${input.shiftLength ? `- Typical Shift: ${input.shiftLength} hours` : ''}
${input.averageCustomerInteractions ? `- Customer Interactions: ~${input.averageCustomerInteractions}/shift` : ''}
${input.existingBehaviors?.length ? `- Existing Behaviors (don't duplicate): ${input.existingBehaviors.join(', ')}` : ''}

Generate 5-7 specific, measurable behaviors for this role that will drive the focus KPIs.

FOR EACH BEHAVIOR:
1. Name: Action-oriented, specific (max 50 chars)
2. Description: What exactly to do (max 200 chars)
3. Category: REVENUE, COST_CONTROL, QUALITY, or COMPLIANCE
4. Frequency: How often this should be done
5. Target: Realistic number based on shift/opportunity
6. Points: 1-10 based on effort and impact
7. KPI Impact: Which KPIs this affects
8. Examples: 2-4 specific examples with actual words to say
9. Tips: 2-4 practical tips for success
10. Script: If applicable, exact words to use
11. Rationale: Why this behavior drives the KPIs

REQUIREMENTS:
- Behaviors must be within the role's control
- Targets must be achievable in a typical shift
- Scripts should sound natural, not robotic
- Each behavior should clearly link to at least one focus KPI
- Avoid generic behaviors - be specific to this industry/role

Return as JSON array of behaviors.
`;
  }
}
```

### 2.4 Industry Adaptation Examples

The AI adapts the same core concepts to different industries:

**Example: "Upsell" behavior across industries**

| Industry | Role | Behavior Name | Example Script |
|----------|------|---------------|----------------|
| Restaurant | Server | Suggest Wine Pairing | "May I suggest a wine to complement your steak? Our Cabernet is excellent." |
| Hotel | Front Desk | Offer Room Upgrade | "For just $30 more, I can put you in a suite with a view." |
| Spa | Therapist | Recommend Add-On Treatment | "Since you enjoyed the massage, would you like to add a hot stone enhancement?" |
| Auto Service | Advisor | Suggest Preventive Service | "Your car is due for transmission fluid - doing it now saves $50 vs next visit." |
| Dental | Hygienist | Present Treatment Option | "I noticed some sensitivity - would you like to discuss sealants with Dr. Smith?" |
| Accounting | Associate | Cross-Sell Service | "Based on your tax situation, our estate planning service could save you significantly." |

### 2.5 Universal Role-Type Mappings

The AI understands universal role types that apply across industries:

```typescript
const UNIVERSAL_ROLE_PATTERNS = {
  REVENUE_GENERATING: {
    behaviors: ['upsell', 'cross_sell', 'premium_suggest', 'add_on_offer'],
    kpis: ['AVERAGE_CHECK', 'REVENUE', 'CONVERSION_RATE']
  },

  COST_CONTROLLING: {
    behaviors: ['vendor_compare', 'waste_track', 'inventory_verify', 'efficiency_log'],
    kpis: ['COST_PERCENTAGE', 'WASTE_PERCENTAGE', 'INVENTORY_VARIANCE']
  },

  QUALITY_FOCUSED: {
    behaviors: ['satisfaction_check', 'feedback_request', 'issue_resolve', 'follow_up'],
    kpis: ['SATISFACTION_SCORE', 'RATING', 'NPS']
  },

  COMPLIANCE_FOCUSED: {
    behaviors: ['checklist_complete', 'documentation_verify', 'safety_check', 'audit_prep'],
    kpis: ['COMPLIANCE_RATE', 'AUDIT_SCORE', 'INCIDENT_RATE']
  },

  PRODUCTIVITY_FOCUSED: {
    behaviors: ['task_complete', 'time_track', 'efficiency_log', 'milestone_update'],
    kpis: ['THROUGHPUT', 'CYCLE_TIME', 'UTILIZATION']
  }
};
```

### 2.6 Learning from Feedback

The AI improves its behavior generation based on:

```typescript
interface BehaviorFeedback {
  behaviorId: string;
  adoptionRate: number;      // How often staff actually do it
  correlationScore: number;  // How well it correlates with KPI
  staffFeedback: string[];   // Direct feedback from staff
  managerNotes: string[];    // Manager observations
}

// The system tracks which generated behaviors work well
async function evaluateGeneratedBehavior(
  organizationId: string,
  behaviorId: string
): Promise<BehaviorFeedback> {
  const behavior = await getBehavior(behaviorId);
  const logs = await getBehaviorLogs(behaviorId, { days: 30 });
  const correlations = await getCorrelations(behaviorId);

  return {
    behaviorId,
    adoptionRate: logs.length / expectedLogs,
    correlationScore: correlations.primaryKpi,
    staffFeedback: await getStaffFeedback(behaviorId),
    managerNotes: await getManagerNotes(behaviorId)
  };
}

// Feed back to improve future generations
async function improveGenerationPrompts(
  feedback: BehaviorFeedback[]
): Promise<void> {
  const lowPerformers = feedback.filter(f =>
    f.adoptionRate < 0.3 || f.correlationScore < 0.2
  );

  const highPerformers = feedback.filter(f =>
    f.adoptionRate > 0.7 && f.correlationScore > 0.5
  );

  // Update few-shot examples with high performers
  // Analyze low performers for common issues
  await updatePromptExamples(highPerformers);
  await analyzeFailurePatterns(lowPerformers);
}
```

### 2.7 New Industry Onboarding

When a business from a new industry type joins, the AI:

1. **Analyzes the business description** to understand operations
2. **Maps to closest existing templates** for initial scaffolding
3. **Generates industry-specific adaptations** for terminology
4. **Creates role-appropriate behaviors** based on universal patterns
5. **Sets reasonable defaults** based on similar businesses
6. **Refines over time** based on actual performance data

```typescript
async function onboardNewIndustry(
  businessDescription: string
): Promise<IndustryScaffolding> {
  // Step 1: Classify the business
  const classification = await classifyBusiness(businessDescription);

  // Step 2: Generate KPI structure
  const kpis = await generateKPIs({
    industry: classification.industry,
    subtype: classification.subtype,
    businessSize: classification.estimatedSize,
    focusAreas: classification.focusAreas
  });

  // Step 3: Generate role templates
  const roles = await generateRoles({
    businessDescription,
    industry: classification.industry,
    typicalStaffing: classification.estimatedStaffing
  });

  // Step 4: Generate behaviors for each role
  const behaviors = await Promise.all(
    roles.map(role => generateBehaviors({
      businessDescription,
      industry: classification.industry,
      role: role.name,
      roleType: role.type,
      focusKpis: role.relevantKpis
    }))
  );

  // Step 5: Generate language mappings
  const terminology = await generateTerminology({
    industry: classification.industry,
    standardTerms: ['covers', 'check', 'table', 'shift']
  });

  return {
    industry: classification,
    kpis,
    roles,
    behaviors: behaviors.flat(),
    terminology
  };
}
```

---

## 3. Restaurant Templates

### 3.1 Server Behaviors

#### Upsell Appetizer
```yaml
name: Upsell Appetizer
description: Suggest an appetizer to every table before taking main course order
category: REVENUE
frequency: PER_SHIFT
defaultTarget: 10
defaultPoints: 2
applicableRoles: [SERVER, BARTENDER]
kpiImpact: [AVERAGE_CHECK, REVENUE]
examples:
  - "Have you tried our loaded nachos? They're perfect for sharing while you decide"
  - "Can I start you off with some calamari? It's our most popular starter"
  - "Our soup of the day is butternut squash - would you like to try a cup?"
tips:
  - Mention appetizers before handing out menus
  - Suggest shareable items for larger tables
  - Describe preparation method and ingredients
  - Time suggestion with drink delivery
```

#### Suggest Wine Pairing
```yaml
name: Suggest Wine Pairing
description: Recommend wine that complements the guest's meal selection
category: REVENUE
frequency: PER_SHIFT
defaultTarget: 5
defaultPoints: 3
applicableRoles: [SERVER, BARTENDER]
kpiImpact: [AVERAGE_CHECK, REVENUE]
examples:
  - "That steak pairs beautifully with our Cabernet - shall I pour you a glass?"
  - "For your salmon, I'd recommend the Chardonnay - it's light and crisp"
  - "We have a special Malbec this week that would be perfect with your lamb"
tips:
  - Learn 3-5 key pairings for popular dishes
  - Offer by-the-glass options, not just bottles
  - Describe the wine's taste profile briefly
  - Time recommendation when taking food order
```

#### Offer Dessert
```yaml
name: Offer Dessert
description: Present dessert options after main course is cleared
category: REVENUE
frequency: PER_SHIFT
defaultTarget: 10
defaultPoints: 2
applicableRoles: [SERVER]
kpiImpact: [AVERAGE_CHECK, REVENUE]
examples:
  - "Save room for dessert? Our chocolate lava cake is made fresh to order"
  - "Can I tempt you with our dessert menu? We have a new cheesecake this week"
  - "How about we end with something sweet? The tiramisu is incredible"
tips:
  - Mention dessert before clearing plates
  - Describe one specific item enthusiastically
  - Offer to split desserts for couples
  - Suggest coffee or after-dinner drinks alongside
```

#### Table Touch
```yaml
name: Table Touch
description: Check on table within 2 minutes of food delivery
category: QUALITY
frequency: PER_SHIFT
defaultTarget: 20
defaultPoints: 1
applicableRoles: [SERVER]
kpiImpact: [RATING]
examples:
  - "How is everything tasting? Can I get you anything else?"
  - "Is the steak cooked to your liking?"
  - "How are we doing over here? More bread?"
tips:
  - Return within 2 bites of food
  - Look for visual cues (empty glasses, looking around)
  - Don't interrupt mid-conversation
  - Be ready to fix any issues immediately
```

#### Request Feedback
```yaml
name: Request Feedback
description: Ask guest about their experience before presenting check
category: QUALITY
frequency: PER_SHIFT
defaultTarget: 5
defaultPoints: 2
applicableRoles: [SERVER]
kpiImpact: [RATING]
examples:
  - "How was everything this evening? Was there anything we could improve?"
  - "Did you enjoy your meal? I'd love to hear your thoughts"
  - "What did you think of the new menu items?"
tips:
  - Ask open-ended questions
  - Listen actively to response
  - Thank them for feedback regardless
  - Report common feedback to manager
```

### 3.2 Host Behaviors

#### VIP Recognition
```yaml
name: VIP Recognition
description: Greet returning guests by name and acknowledge loyalty
category: QUALITY
frequency: PER_SHIFT
defaultTarget: 3
defaultPoints: 3
applicableRoles: [HOST]
kpiImpact: [RATING]
examples:
  - "Welcome back, Mr. Johnson! Your usual table?"
  - "Great to see you again, Sarah! How have you been?"
  - "Hello! I remember you celebrated a birthday here last month"
tips:
  - Review reservation notes before shift
  - Note regular guests' preferences
  - Share recognition info with server
  - Log VIP visits in system
```

#### Wait Time Communication
```yaml
name: Wait Time Communication
description: Proactively update waiting guests on their status
category: QUALITY
frequency: PER_SHIFT
defaultTarget: 10
defaultPoints: 1
applicableRoles: [HOST]
kpiImpact: [RATING]
examples:
  - "Your table should be ready in about 10 minutes"
  - "Just checking in - we're almost ready for you"
  - "Good news - your table is being cleared now"
tips:
  - Update every 10-15 minutes for long waits
  - Under-promise, over-deliver on times
  - Offer drinks while waiting
  - Acknowledge the wait apologetically
```

### 3.3 Bartender Behaviors

#### Suggest Premium Spirits
```yaml
name: Suggest Premium Spirits
description: Offer top-shelf options when guest orders basic spirits
category: REVENUE
frequency: PER_SHIFT
defaultTarget: 8
defaultPoints: 2
applicableRoles: [BARTENDER]
kpiImpact: [AVERAGE_CHECK, REVENUE]
examples:
  - "Would you like that with Tito's instead of well vodka?"
  - "Can I make that with Patrón? It's much smoother"
  - "Our Grey Goose is on special tonight - want to upgrade?"
tips:
  - Know price differences
  - Mention taste benefits, not just brand
  - Suggest during order, not after
  - Have recommendations ready for common drinks
```

#### Cocktail Recommendation
```yaml
name: Cocktail Recommendation
description: Suggest signature or seasonal cocktails to guests
category: REVENUE
frequency: PER_SHIFT
defaultTarget: 5
defaultPoints: 2
applicableRoles: [BARTENDER]
kpiImpact: [AVERAGE_CHECK, REVENUE]
examples:
  - "Have you tried our smoked Old Fashioned? It's our bestseller"
  - "We have a new summer cocktail with fresh watermelon - very refreshing"
  - "If you like sweet, you'd love our espresso martini"
tips:
  - Know ingredients of all signatures
  - Ask about taste preferences first
  - Describe preparation process
  - Offer to customize drinks
```

---

## 4. Retail Templates

### 4.1 Sales Associate Behaviors

#### Greet Within 30 Seconds
```yaml
name: Greet Within 30 Seconds
description: Acknowledge every customer within 30 seconds of entry
category: QUALITY
frequency: PER_SHIFT
defaultTarget: 25
defaultPoints: 1
applicableRoles: [SALES_ASSOCIATE]
kpiImpact: [REVENUE, RATING]
examples:
  - "Welcome in! Let me know if you need help finding anything"
  - "Hi there! We have a great sale on denim today"
  - "Good afternoon! Looking for anything in particular?"
tips:
  - Make eye contact and smile
  - Don't be too pushy initially
  - Note customer body language
  - Be available but not hovering
```

#### Suggest Add-On Item
```yaml
name: Suggest Add-On Item
description: Recommend complementary items during checkout or fitting room
category: REVENUE
frequency: PER_SHIFT
defaultTarget: 10
defaultPoints: 2
applicableRoles: [SALES_ASSOCIATE]
kpiImpact: [AVERAGE_CHECK, REVENUE]
examples:
  - "This belt would look great with those pants"
  - "Did you see the matching earrings for that necklace?"
  - "We have socks that go perfectly with those shoes"
tips:
  - Keep add-ons near checkout
  - Suggest items that genuinely complement
  - Show the items together
  - Price shouldn't exceed 20% of main item
```

#### Check Stock for Customer
```yaml
name: Check Stock for Customer
description: Offer to check stock or other locations for desired item
category: QUALITY
frequency: PER_SHIFT
defaultTarget: 5
defaultPoints: 2
applicableRoles: [SALES_ASSOCIATE]
kpiImpact: [RATING]
examples:
  - "Let me check if we have that size in the back"
  - "I can see if our other location has it in stock"
  - "We're expecting a shipment Thursday - can I put one aside?"
tips:
  - Never say "no" immediately
  - Check thoroughly before giving up
  - Offer alternatives if unavailable
  - Take contact info for follow-up
```

---

## 5. Hospitality Templates

### 5.1 Front Desk Behaviors

#### Personalized Welcome
```yaml
name: Personalized Welcome
description: Greet guests by name using reservation info
category: QUALITY
frequency: PER_SHIFT
defaultTarget: 15
defaultPoints: 2
applicableRoles: [FRONT_DESK]
kpiImpact: [RATING]
examples:
  - "Welcome back, Mr. and Mrs. Chen! Great to see you again"
  - "Good evening, Ms. Rodriguez. We have your preferred room ready"
  - "Welcome to our hotel, Dr. Smith. How was your flight?"
tips:
  - Review arriving guests before shift
  - Note special occasions (birthday, anniversary)
  - Remember preferences from past stays
  - Use name 2-3 times during check-in
```

#### Upsell Room Upgrade
```yaml
name: Upsell Room Upgrade
description: Offer room upgrade or view enhancement at check-in
category: REVENUE
frequency: PER_SHIFT
defaultTarget: 5
defaultPoints: 3
applicableRoles: [FRONT_DESK]
kpiImpact: [REVENUE, AVERAGE_CHECK]
examples:
  - "For just $30 more, I can put you in a room with an ocean view"
  - "We have a suite available for a small upgrade - would you like to see it?"
  - "I can upgrade you to our executive floor with lounge access"
tips:
  - Know availability before offering
  - Describe benefits enthusiastically
  - Show pictures if possible
  - Offer as a special or limited availability
```

#### Local Recommendation
```yaml
name: Local Recommendation
description: Provide personalized local dining or activity suggestions
category: QUALITY
frequency: PER_SHIFT
defaultTarget: 10
defaultPoints: 1
applicableRoles: [FRONT_DESK, CONCIERGE]
kpiImpact: [RATING]
examples:
  - "If you enjoy Italian, there's an amazing family restaurant two blocks away"
  - "The museum has a special exhibit this month - highly recommend"
  - "For sunset, the rooftop bar on 5th has the best view"
tips:
  - Know 10-15 local spots personally
  - Ask about preferences first
  - Provide directions/reservation help
  - Follow up on their experience
```

---

## 6. Back Office Templates

### 6.1 Purchaser Behaviors

#### Three-Quote Comparison
```yaml
name: Three-Quote Comparison
description: Get quotes from at least 3 vendors before major purchases
category: COST_CONTROL
frequency: PER_WEEK
defaultTarget: 3
defaultPoints: 5
applicableRoles: [PURCHASER]
kpiImpact: [COST_OF_SALES]
examples:
  - Document quotes for produce from Sysco, US Foods, and local distributor
  - Compare pricing on paper goods from multiple suppliers
  - Negotiate beverage pricing with competing distributors
tips:
  - Create standard comparison template
  - Consider quality, not just price
  - Factor in delivery frequency and minimums
  - Document decision rationale
```

#### Invoice Verification
```yaml
name: Invoice Verification
description: Verify received goods against invoice before payment
category: COST_CONTROL
frequency: PER_SHIFT
defaultTarget: 5
defaultPoints: 2
applicableRoles: [PURCHASER]
kpiImpact: [COST_OF_SALES]
examples:
  - Check quantity received matches quantity billed
  - Verify pricing matches agreed quotes
  - Document any discrepancies immediately
tips:
  - Create receiving checklist
  - Report discrepancies same day
  - Keep records of all variances
  - Follow up on credits owed
```

### 6.2 Chef Behaviors

#### Menu Engineering Review
```yaml
name: Menu Engineering Review
description: Analyze menu item profitability and popularity weekly
category: COST_CONTROL
frequency: PER_WEEK
defaultTarget: 1
defaultPoints: 5
applicableRoles: [CHEF]
kpiImpact: [FOOD_COST, GROSS_OPERATING_PROFIT]
examples:
  - Identify stars (high profit, high popularity)
  - Flag dogs (low profit, low popularity)
  - Suggest pricing adjustments for puzzles
tips:
  - Use POS data for popularity
  - Calculate accurate food costs
  - Consider repositioning menu items
  - Test new items before full rollout
```

#### 86 Item Alternatives
```yaml
name: 86 Item Alternatives
description: Prepare and communicate alternatives for unavailable items
category: QUALITY
frequency: PER_SHIFT
defaultTarget: 3
defaultPoints: 2
applicableRoles: [CHEF]
kpiImpact: [RATING]
examples:
  - "Salmon is 86, suggesting the sea bass as alternative"
  - "Out of risotto rice, offering pasta primavera instead"
  - "Caesar dressing low, prepared a house ranch as backup"
tips:
  - Notify FOH immediately
  - Have alternatives ready before announcing
  - Price alternatives appropriately
  - Update briefing notes
```

### 6.3 Accountant Behaviors

#### Invoice Processing Same Day
```yaml
name: Invoice Processing Same Day
description: Enter all invoices into system same day as received
category: COMPLIANCE
frequency: PER_DAY
defaultTarget: 1
defaultPoints: 3
applicableRoles: [ACCOUNTANT]
kpiImpact: [CASH_FLOW]
examples:
  - Process morning mail invoices by noon
  - Enter emailed invoices same day
  - Update vendor accounts immediately
tips:
  - Create morning processing routine
  - Flag unusual amounts for review
  - Verify against POs
  - Maintain organized filing system
```

#### A/R Follow-up
```yaml
name: A/R Follow-up
description: Contact accounts 30+ days outstanding
category: COST_CONTROL
frequency: PER_WEEK
defaultTarget: 5
defaultPoints: 3
applicableRoles: [ACCOUNTANT]
kpiImpact: [ACCOUNTS_RECEIVABLE, CASH_FLOW]
examples:
  - Send payment reminder at 30 days
  - Phone call at 45 days
  - Escalate to manager at 60 days
tips:
  - Use aging report weekly
  - Document all contact attempts
  - Offer payment plans when appropriate
  - Know credit terms per customer
```

### 6.4 Facilities Behaviors

#### Utility Reading
```yaml
name: Utility Reading
description: Record utility meter readings and monitor for anomalies
category: COST_CONTROL
frequency: PER_WEEK
defaultTarget: 1
defaultPoints: 2
applicableRoles: [FACILITIES]
kpiImpact: [UTILITIES]
examples:
  - Record electric, gas, water meters weekly
  - Compare to same week last year
  - Flag increases over 10%
tips:
  - Create tracking spreadsheet
  - Note weather conditions
  - Investigate sudden increases
  - Report equipment issues
```

#### Equipment Maintenance Check
```yaml
name: Equipment Maintenance Check
description: Complete preventive maintenance checklist
category: COMPLIANCE
frequency: PER_DAY
defaultTarget: 1
defaultPoints: 2
applicableRoles: [FACILITIES]
kpiImpact: [UTILITIES, COST_OF_SALES]
examples:
  - Check refrigerator temperatures
  - Clean hood filters
  - Verify fire suppression system
tips:
  - Use standard checklist
  - Document all findings
  - Schedule repairs immediately
  - Maintain equipment logs
```

---

## 7. Custom Template Creation

### 7.1 Creating Custom Behaviors

When creating custom behaviors, consider:

**1. Is it Measurable?**
- Can staff clearly know when they've done it?
- Can managers verify it happened?

**2. Is it Actionable?**
- Is it within staff control?
- Can it be done consistently?

**3. Is it Connected to Outcomes?**
- Does it logically impact a KPI?
- Is the impact measurable?

**4. Is the Target Reasonable?**
- Based on shift length and opportunity
- Achievable but challenging

### 7.2 Custom Behavior Template

```yaml
name: [Clear, Action-Oriented Name]
description: [Specific description of what to do]
category: [REVENUE | COST_CONTROL | QUALITY | COMPLIANCE]
frequency: [PER_SHIFT | PER_DAY | PER_WEEK | PER_MONTH]
defaultTarget: [Number based on opportunity]
defaultPoints: [1-5 based on effort/impact]
applicableRoles: [List of roles]
kpiImpact: [List of KPIs affected]
examples:
  - [Specific example 1]
  - [Specific example 2]
  - [Specific example 3]
tips:
  - [Helpful tip 1]
  - [Helpful tip 2]
  - [Helpful tip 3]
```

### 7.3 Behavior Naming Best Practices

| Good Names | Bad Names |
|------------|-----------|
| Upsell Appetizer | Be Better at Selling |
| Check Stock for Customer | Help Customers |
| Three-Quote Comparison | Save Money |
| Table Touch | Good Service |

### 7.4 Setting Targets

**Per-Shift Behaviors:**
- Calculate: (Hours × Opportunity Rate) × Success Rate
- Example: 6 hours × 4 tables/hour × 50% = 12 target

**Weekly Behaviors:**
- Consider: Time available, complexity, dependencies
- Example: 3 vendor comparisons per week (allows 2+ hours each)

**Monthly Behaviors:**
- Reserve for: Large projects, audits, reviews
- Example: 1 menu engineering review per month

---

## Appendix A: Quick Reference by Industry

### Restaurant Quick Start
| Role | Top 3 Behaviors |
|------|-----------------|
| Server | Upsell Appetizer, Suggest Wine, Table Touch |
| Bartender | Premium Spirits, Cocktail Recommend, Closing Tab Upsell |
| Host | VIP Recognition, Wait Communication, Reservation Upsell |

### Retail Quick Start
| Role | Top 3 Behaviors |
|------|-----------------|
| Sales Associate | Greet 30 Sec, Add-On Suggest, Check Stock |
| Cashier | Loyalty Sign-Up, Add-On at Register, Receipt Survey |

### Hospitality Quick Start
| Role | Top 3 Behaviors |
|------|-----------------|
| Front Desk | Personal Welcome, Room Upsell, Local Recommend |
| Housekeeping | Amenity Refresh, Issue Report, Guest Note |

---

## Appendix B: KPI Impact Matrix

| Behavior | Avg Check | Revenue | Rating | CoS% | GOP |
|----------|-----------|---------|--------|------|-----|
| Upsell Appetizer | +++ | ++ | | | + |
| Suggest Wine | +++ | ++ | | | + |
| Table Touch | | | +++ | | |
| VIP Recognition | | + | +++ | | |
| Three-Quote | | | | +++ | ++ |
| Invoice Verify | | | | ++ | + |

**Legend:** +++ Strong Impact, ++ Moderate Impact, + Slight Impact
