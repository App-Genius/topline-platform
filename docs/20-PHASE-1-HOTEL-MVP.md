# Phase 1: Hotel MVP (AC Hotel)

## Overview

Phase 1 delivers a production-ready system for AC Hotel with hard-coded roles, behaviors, and dashboards. This is a focused MVP that validates the core value proposition before building the generic platform.

**Target Customer:** AC Hotel (single property)
**Timeline:** 4 weeks
**Goal:** Prove the system works in a real hotel environment

---

## Table of Contents

1. [What's In Scope](#1-whats-in-scope)
2. [What's Out of Scope](#2-whats-out-of-scope)
3. [Current State Assessment](#3-current-state-assessment)
4. [Hotel Roles & Behaviors](#4-hotel-roles--behaviors)
5. [Dashboard & KPIs](#5-dashboard--kpis)
6. [Daily Briefing System](#6-daily-briefing-system)
7. [Manager Verification Workflow](#7-manager-verification-workflow)
8. [Game State Logic](#8-game-state-logic)
9. [AI Behavior Recommendations](#9-ai-behavior-recommendations)
10. [Seed Data](#10-seed-data)
11. [Implementation Order](#11-implementation-order)
12. [Definition of Done](#12-definition-of-done)

---

## 1. What's In Scope

| Feature | Description |
|---------|-------------|
| **Hard-coded Roles** | Pre-defined hotel roles (Front Desk, Housekeeping, etc.) |
| **Hard-coded Behaviors** | Pre-defined behaviors per role (Upsell, Suggest, etc.) |
| **Existing KPIs** | Revenue, Average Check, Covers, Rating, Behavior Rate |
| **Daily Briefing** | 6-step briefing wizard for managers |
| **Behavior Verification** | Manager queue with bulk verify/reject |
| **Real Game State** | Winning/Losing based on actual revenue vs target |
| **AI Behavior Suggestions** | AI recommends behaviors for new roles (OpenRouter) |
| **AC Hotel Seed Data** | Pre-populated data for AC Hotel |

---

## 2. What's Out of Scope

These features are deferred to Phase 2 (Generic Platform):

| Feature | Reason |
|---------|--------|
| Onboarding Questionnaire | Needs multi-industry support first |
| Multi-Industry Selection | AC Hotel is hospitality only |
| Custom Role Creation UI | Use hard-coded roles for MVP |
| Dynamic Behavior Generation | AI recommendations only for MVP |
| Receipt Scanning | Vision API complexity |
| Real-time AI Coach | Focus on basics first |
| POS/PMS Integration | External dependency |
| Multi-Location Support | Single property MVP |
| Configurable Dashboards | Use standard layout |
| White-label Branding | Not needed for owned hotel |

---

## 3. Current State Assessment

### 3.1 What's Built & Working

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | Complete | 30+ tables in Prisma |
| Server Actions | Complete | Consolidated from Hono API |
| React Query Hooks | Complete | Connected to Server Actions |
| Cookie Auth | Complete | HTTP-only JWT cookies |
| Basic Pages | Complete | Admin, Manager, Staff, Scoreboard |

### 3.2 What's Broken/Incomplete

| Issue | Severity | Fix |
|-------|----------|-----|
| Manager Briefing crash | P0 | Debug and fix page |
| Settings page empty | P1 | Implement settings UI |
| Hydration errors | P1 | Fix Math.random in SSR |
| Mock data in Insights | P2 | Connect to real API |
| Mock data in Strategy | P2 | Connect to real API |
| Scoreboard simulated | P2 | Use real data |

### 3.3 What's Missing for Production

| Feature | Priority | Complexity |
|---------|----------|------------|
| Daily briefing workflow | P0 | Medium |
| Manager verification queue | P0 | Medium |
| Real game state logic | P0 | Low |
| Hotel-specific behaviors | P0 | Low |
| AI behavior recommendations | P1 | Medium |

---

## 4. Hotel Roles & Behaviors

### 4.1 Role Types

Use existing RoleType enum plus two new additions:

**Existing Roles (Use As-Is):**

| Role | Hotel Context |
|------|---------------|
| ADMIN | Owner, General Manager |
| MANAGER | Floor Manager, F&B Manager, Front Office Manager |
| SERVER | F&B servers, Room service |
| BARTENDER | Bar staff |
| CHEF | Kitchen staff |
| PURCHASER | Procurement |
| ACCOUNTANT | Back office |
| FACILITIES | Maintenance, Engineering |

**New Roles to Add:**

| Role | Hotel Context |
|------|---------------|
| FRONT_DESK | Reception, Check-in/out, Guest services |
| HOUSEKEEPING | Room attendants, Housekeeping supervisors |

### 4.2 Pre-defined Behaviors

These behaviors will be seeded for AC Hotel:

#### Front Desk Behaviors
| Behavior | Points | Target/Day |
|----------|--------|------------|
| Offer room upgrade | 10 | 5 |
| Suggest late checkout | 5 | 3 |
| Recommend restaurant | 3 | 10 |
| Note special requests | 2 | 5 |
| Upsell amenity package | 15 | 2 |

#### Server Behaviors (F&B)
| Behavior | Points | Target/Day |
|----------|--------|------------|
| Suggest appetizer | 3 | 10 |
| Recommend wine pairing | 5 | 5 |
| Offer dessert | 3 | 10 |
| Mention daily special | 2 | 15 |
| Suggest room service | 5 | 3 |

#### Bartender Behaviors
| Behavior | Points | Target/Day |
|----------|--------|------------|
| Suggest premium spirit | 5 | 10 |
| Recommend cocktail | 3 | 15 |
| Offer bar snack | 3 | 10 |

#### Housekeeping Behaviors
| Behavior | Points | Target/Day |
|----------|--------|------------|
| Complete room checklist | 5 | 12 |
| Report maintenance issue | 3 | 2 |
| Restock amenities | 2 | 12 |

#### Purchaser Behaviors
| Behavior | Points | Target/Day |
|----------|--------|------------|
| Compare vendor prices | 10 | 1 |
| Review cost of sales | 5 | 1 |
| Audit invoices | 3 | 3 |

#### Chef Behaviors
| Behavior | Points | Target/Day |
|----------|--------|------------|
| Log food waste | 3 | 3 |
| Update 86'd items | 5 | 2 |
| Portion control check | 3 | 5 |

---

## 5. Dashboard & KPIs

### 5.1 Use Existing KPIs

No new KPIs needed. The existing schema covers hotel needs:

| KPI | Description | Formula |
|-----|-------------|---------|
| REVENUE | Total revenue | Sum of daily entries |
| AVERAGE_CHECK | Per-cover revenue | Revenue / Covers |
| COVERS | Guest count | Daily entry covers |
| RATING | Customer rating | Average review score |
| BEHAVIOR_COUNT | Total behaviors | Count of behavior logs |
| GROSS_OPERATING_PROFIT | GOP % | (Revenue - COGS - Labor) / Revenue |
| COST_OF_SALES | COGS % | COGS / Revenue |
| FOOD_COST | Food cost % | Food cost / Food revenue |
| LABOR_COST | Labor % | Labor cost / Revenue |

### 5.2 Dashboard Layout

Keep existing dashboard structure:
- KPI cards row (4 cards)
- Revenue trend chart
- Behavior correlation chart
- Business health monitor
- Recent feedback section

---

## 6. Daily Briefing System

### 6.1 Briefing Flow (6 Steps)

The daily briefing is a manager-led meeting that happens each shift:

```
Step 1: OVERVIEW
├── Yesterday's revenue vs target
├── Today's expected covers/occupancy
├── Current game state (winning/losing)
└── Week-to-date performance

Step 2: VIP GUESTS
├── Special requests for today
├── Returning guests to recognize
├── Dietary restrictions/allergies
└── VIP arrivals expected

Step 3: KITCHEN UPDATES
├── 86'd items (out of stock)
├── Alternative suggestions
├── Specials available
└── Kitchen timing notes

Step 4: UPSELL FOCUS
├── Today's food upsell item
├── Today's beverage upsell item
├── Scripts/talking points
└── Incentive reminder

Step 5: TRAINING TOPIC
├── 2-minute training content
├── AI-generated or manual topic
├── Discussion points
└── Skill of the day

Step 6: ATTENDANCE
├── Mark who's present
├── Photo of signed sheet (optional)
├── Notes field
└── Complete briefing button
```

### 6.2 Briefing Data Model

```typescript
interface Briefing {
  id: string;
  organizationId: string;
  locationId: string;
  date: Date;
  shift: 'morning' | 'evening' | 'night';

  // Step 1: Overview (calculated from data)
  yesterdayRevenue: number;
  targetRevenue: number;
  gameState: 'winning' | 'losing' | 'neutral';

  // Step 2: VIP Guests (manager input)
  vipNotes: string;
  specialRequests: string[];

  // Step 3: Kitchen Updates (manager input)
  eightySixItems: string[];
  alternatives: string[];
  specialsAvailable: string[];

  // Step 4: Upsell Focus (manager input)
  foodUpsell: string;
  beverageUpsell: string;
  upsellScript: string;

  // Step 5: Training (linked to TrainingTopic)
  trainingTopicId: string | null;
  trainingNotes: string;

  // Step 6: Attendance
  attendees: string[]; // User IDs
  photoUrl: string | null;
  notes: string;

  completedAt: Date | null;
  completedBy: string | null;
}
```

### 6.3 Files to Create/Modify

| File | Action |
|------|--------|
| `actions/briefings.ts` | Create - Server actions for briefing CRUD |
| `hooks/queries/useBriefings.ts` | Create - React Query hooks |
| `app/manager/briefing/page.tsx` | Rewrite - Multi-step wizard |
| `components/features/briefing/BriefingWizard.tsx` | Create - Wizard component |

---

## 7. Manager Verification Workflow

### 7.1 Verification Queue

Managers need to verify staff behavior logs:

```
Verification Dashboard:
├── Pending count badge (in nav)
├── Filter controls
│   ├── By behavior
│   ├── By staff member
│   ├── By date range
│   └── By status
├── Behavior list
│   ├── Checkbox for bulk select
│   ├── Staff name & avatar
│   ├── Behavior name
│   ├── Timestamp
│   ├── Metadata (table, check amount)
│   └── Actions (verify/reject)
└── Bulk actions bar
    ├── Verify selected
    ├── Reject selected
    └── Selection count
```

### 7.2 Rejection Flow

When rejecting a behavior log:
1. Manager clicks reject
2. Modal appears asking for reason
3. Reason options: "Not performed", "Incorrect data", "Duplicate", "Other"
4. Staff is notified (optional)
5. Log marked as rejected with reason

### 7.3 Files to Create/Modify

| File | Action |
|------|--------|
| `app/manager/verification/page.tsx` | Create - New verification page |
| `actions/behavior-logs.ts` | Modify - Add bulk verify/reject |
| `components/features/verification/VerificationQueue.tsx` | Create - Queue component |
| `components/features/verification/RejectModal.tsx` | Create - Rejection modal |

---

## 8. Game State Logic

### 8.1 Game State Calculation

Connect game state to real revenue data:

```typescript
type GameState = 'CELEBRATING' | 'WINNING' | 'NEUTRAL' | 'LOSING';

function calculateGameState(params: {
  currentRevenue: number;
  targetRevenue: number;
  timeOfDay: number; // 0-1 representing progress through operating hours
}): GameState {
  const { currentRevenue, targetRevenue, timeOfDay } = params;

  // Expected revenue at this time of day
  const expectedRevenue = targetRevenue * timeOfDay;

  // Performance percentage
  const performance = currentRevenue / expectedRevenue;

  if (performance >= 1.0) return 'CELEBRATING'; // At or above 100%
  if (performance >= 0.95) return 'WINNING';    // 95-99%
  if (performance >= 0.85) return 'NEUTRAL';    // 85-94%
  return 'LOSING';                               // Below 85%
}
```

### 8.2 Visual Indicators

| State | Color | Message | Icon |
|-------|-------|---------|------|
| CELEBRATING | Gold | "Record day!" | Trophy |
| WINNING | Emerald | "Above target" | TrendingUp |
| NEUTRAL | Amber | "Slight gap to close" | Activity |
| LOSING | Rose | "Rally the team!" | AlertTriangle |

### 8.3 Files to Modify

| File | Action |
|------|--------|
| `context/AppContext.tsx` | Modify - Add real game state calculation |
| `lib/utils/calculations.ts` | Modify - Add game state formula |
| `app/scoreboard/page.tsx` | Modify - Use real game state |

---

## 9. AI Behavior Recommendations

### 9.1 OpenRouter Integration

Use OpenRouter as the LLM provider for flexibility:

```typescript
// lib/ai/client.ts
import OpenAI from 'openai';

export const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL,
    'X-Title': 'Topline',
  },
});

// Default model for behavior suggestions
export const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';
```

### 9.2 Behavior Suggestion Schema

```typescript
// lib/ai/behavior-suggestions.ts
import { z } from 'zod';

export const behaviorSuggestionSchema = z.object({
  name: z.string().max(50).describe('Short, action-oriented name'),
  description: z.string().max(200).describe('What this behavior involves'),
  category: z.enum(['REVENUE', 'COST', 'QUALITY', 'EFFICIENCY']),
  suggestedPoints: z.number().int().min(1).max(20),
  suggestedTarget: z.number().int().min(1).max(50),
  rationale: z.string().max(300).describe('Why this behavior drives results'),
});

export const behaviorSuggestionsResponseSchema = z.object({
  behaviors: z.array(behaviorSuggestionSchema).max(5),
});
```

### 9.3 Suggestion Prompt

```typescript
// lib/ai/behavior-suggestions.ts
export function buildBehaviorPrompt(params: {
  role: string;
  industry: string;
  existingBehaviors: string[];
}): string {
  return `You are an expert in hospitality operations and revenue optimization.

Generate 5 high-impact behaviors for a ${params.role} in a ${params.industry} setting.

These behaviors should:
1. Be specific, actionable daily tasks
2. Drive measurable business outcomes (revenue, cost savings, quality)
3. Be easy to verify by a manager
4. Not duplicate these existing behaviors: ${params.existingBehaviors.join(', ')}

Focus on behaviors that:
- Increase average transaction value
- Improve customer satisfaction
- Reduce waste or costs
- Build habits that compound over time

Return exactly 5 behaviors with names, descriptions, categories, suggested points (1-20), suggested daily targets (1-50), and rationale.`;
}
```

### 9.4 Server Action

```typescript
// actions/ai.ts
'use server';

import { openrouter, DEFAULT_MODEL } from '@/lib/ai/client';
import { behaviorSuggestionsResponseSchema, buildBehaviorPrompt } from '@/lib/ai/behavior-suggestions';

export async function generateBehaviorSuggestions(params: {
  role: string;
  industry: string;
  existingBehaviors: string[];
}) {
  const prompt = buildBehaviorPrompt(params);

  const response = await openrouter.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  const parsed = behaviorSuggestionsResponseSchema.parse(JSON.parse(content));

  return { success: true, data: parsed.behaviors };
}
```

### 9.5 Files to Create

| File | Action |
|------|--------|
| `lib/ai/client.ts` | Create - OpenRouter client setup |
| `lib/ai/behavior-suggestions.ts` | Create - Schema and prompts |
| `actions/ai.ts` | Create - Server actions for AI |
| `hooks/queries/useAI.ts` | Create - React Query hooks |

### 9.6 Environment Variables

```bash
# .env.local
OPENROUTER_API_KEY=sk-or-v1-xxx
```

---

## 10. Seed Data

### 10.1 AC Hotel Seed Script

```typescript
// prisma/seeds/ac-hotel.ts

export const acHotelSeed = {
  organization: {
    name: 'AC Hotel',
    industry: 'HOSPITALITY',
    settings: {
      timezone: 'America/New_York',
      currency: 'USD',
      operatingHours: { open: '06:00', close: '23:00' },
    },
  },

  roles: [
    { name: 'General Manager', type: 'ADMIN' },
    { name: 'Front Office Manager', type: 'MANAGER' },
    { name: 'F&B Manager', type: 'MANAGER' },
    { name: 'Front Desk Agent', type: 'FRONT_DESK' },
    { name: 'Server', type: 'SERVER' },
    { name: 'Bartender', type: 'BARTENDER' },
    { name: 'Room Attendant', type: 'HOUSEKEEPING' },
    { name: 'Chef', type: 'CHEF' },
  ],

  users: [
    { name: 'Joel Dean', email: 'joel@achotel.com', role: 'General Manager' },
    { name: 'Sarah Manager', email: 'sarah@achotel.com', role: 'Front Office Manager' },
    { name: 'Mike Front', email: 'mike@achotel.com', role: 'Front Desk Agent' },
    { name: 'Lisa Server', email: 'lisa@achotel.com', role: 'Server' },
    { name: 'Tom Bartender', email: 'tom@achotel.com', role: 'Bartender' },
    { name: 'Ana Housekeeping', email: 'ana@achotel.com', role: 'Room Attendant' },
    { name: 'Carlos Chef', email: 'carlos@achotel.com', role: 'Chef' },
  ],

  benchmark: {
    year: 2024,
    totalRevenue: 3650000, // $10K/day average
    daysOpen: 365,
    baselineAvgCheck: 45,
    baselineRating: 4.2,
  },

  // Behaviors defined in section 4.2 above
};
```

### 10.2 Seed Command

```bash
npm run db:seed:ac-hotel
```

### 10.3 Files to Create

| File | Action |
|------|--------|
| `prisma/seeds/ac-hotel.ts` | Create - Hotel-specific seed data |
| `prisma/seed.ts` | Modify - Add AC Hotel seed |

---

## 11. Implementation Order

### Week 1: Fix & Stabilize

| Day | Task | Files |
|-----|------|-------|
| 1-2 | Fix Manager Briefing page | `app/manager/briefing/page.tsx` |
| 2-3 | Fix Settings page | `app/admin/settings/page.tsx` |
| 3-4 | Fix hydration errors | Various |
| 4-5 | Connect game state to real data | `context/AppContext.tsx`, `lib/utils/calculations.ts` |

### Week 2: Core Features

| Day | Task | Files |
|-----|------|-------|
| 1 | Add hotel roles to schema | `prisma/schema.prisma` |
| 2-3 | Create behavior seed data | `prisma/seeds/ac-hotel.ts` |
| 3-4 | Manager verification queue | `app/manager/verification/page.tsx` |
| 5 | Bulk verify actions | `actions/behavior-logs.ts` |

### Week 3: Briefing System

| Day | Task | Files |
|-----|------|-------|
| 1-2 | Briefing wizard UI | `components/features/briefing/BriefingWizard.tsx` |
| 2-3 | Briefing server actions | `actions/briefings.ts` |
| 3-4 | Attendance tracking | `app/manager/briefing/page.tsx` |
| 5 | Photo upload | `actions/uploads.ts` |

### Week 4: AI & Polish

| Day | Task | Files |
|-----|------|-------|
| 1-2 | OpenRouter client setup | `lib/ai/client.ts` |
| 2-3 | AI behavior recommendations | `actions/ai.ts` |
| 3-4 | AC Hotel seed data | `prisma/seeds/ac-hotel.ts` |
| 4-5 | Testing & bug fixes | Various |

---

## 12. Definition of Done

Phase 1 is complete when ALL of these are true:

### Core Functionality
- [ ] Manager can conduct daily briefing (all 6 steps)
- [ ] Manager can verify/reject behaviors in bulk
- [ ] Staff can log behaviors with two-tap confirmation
- [ ] Scoreboard shows real game state (winning/losing)
- [ ] Dashboard shows real KPIs from database

### AI Features
- [ ] AI can suggest behaviors for new roles
- [ ] OpenRouter integration working
- [ ] Suggestions match Zod schema

### Data & Infrastructure
- [ ] AC Hotel seed data loads correctly
- [ ] FRONT_DESK and HOUSEKEEPING roles in schema
- [ ] Pre-defined behaviors seeded

### Quality
- [ ] No console errors or hydration issues
- [ ] All existing tests pass
- [ ] Mobile responsive on staff pages
- [ ] Manager pages work on tablet

### Production Ready
- [ ] Environment variables documented
- [ ] Error handling in place
- [ ] Loading states for all async operations
- [ ] Empty states for all lists

---

## Appendix: Environment Variables

```bash
# Required for Phase 1
DATABASE_URL=postgresql://...
JWT_SECRET=xxx
NEXT_PUBLIC_APP_URL=https://app.topline.com

# AI Features
OPENROUTER_API_KEY=sk-or-v1-xxx
```
